import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../inject.js', import.meta.url), 'utf8');
const experiments = () => ({
    WebNextNewWaveTab: { group: 'on1', value: { title: 'on1' } },
    OtherExperiment: { group: 'on', value: { enabled: true } },
});

function setup(patches = []) {
    class PageResponse extends Response {}
    const window = { __STATE_PATCHES__: patches };
    vm.runInNewContext(source, { window, Response: PageResponse, URL });
    function response(data, url = 'https://api.music.yandex.ru/account/experiments/details', raw = false) {
        const result = new PageResponse(raw ? data : JSON.stringify(data), {
            status: 200, headers: { 'content-type': 'application/json', 'x-test': 'unchanged' },
        });
        Object.defineProperty(result, 'url', { value: url });
        return result;
    }
    return { window, response };
}

function assertClassic(data) {
    // Values assigned by the injected script belong to the VM realm.
    data = JSON.parse(JSON.stringify(data));
    assert.deepEqual(data.WebNextNewWaveTab, { group: 'default', value: { title: 'default' } });
    assert.deepEqual(data.OtherExperiment, experiments().OtherExperiment);
}

test('SPA experiments API: direct and result-wrapped responses on all supported domains', async () => {
    const { response } = setup();
    for (const tld of ['ru', 'by', 'kz', 'uz', 'com', 'net']) {
        for (const wrapped of [false, true]) {
            const data = experiments();
            const result = await response(wrapped ? { result: data } : data,
                `https://api.music.yandex.${tld}/account/experiments/details?language=ru`).json();
            assertClassic(wrapped ? result.result : result);
        }
    }
});

test('does not change unrelated URLs or responses without the target flag', async () => {
    const { response } = setup();
    for (const url of [
        'https://api.music.yandex.ru/account/settings',
        'https://example.org/account/experiments/details',
        'https://api.music.yandex.ru.example.org/account/experiments/details',
        'https://api.music.yandex.ru/account/experiments/details/other',
        '',
    ]) {
        assert.deepEqual(await response(experiments(), url).json(), experiments());
    }
    for (const data of [null, [], {}, { result: null }, { error: 'unavailable' }]) {
        assert.deepEqual(await response(data).json(), data);
    }
});

test('preserves Response metadata, body consumption and JSON errors', async () => {
    const { response } = setup();
    const result = response(experiments());
    assert.equal(result.bodyUsed, false);
    assert.equal(result.status, 200);
    assert.equal(result.headers.get('x-test'), 'unchanged');
    assertClassic(await result.json());
    assert.equal(result.bodyUsed, true);
    await assert.rejects(result.json(), TypeError);
    await assert.rejects(response('{invalid', undefined, true).json(), SyntaxError);
});

test('legacy SSR: handles queued and later patches while preserving push behavior', () => {
    const first = [{ op: 'replace', path: '/experiments/experiments', value: experiments() }];
    const { window } = setup([first]);
    const later = [{ op: 'replace', path: '/experiments/experiments', value: experiments() }];
    const unrelated = [{ op: 'replace', path: '/other', value: experiments() }];
    assert.equal(window.__STATE_PATCHES__.push(later, unrelated), 3);
    assertClassic(first[0].value);
    assertClassic(later[0].value);
    assert.deepEqual(unrelated[0].value, experiments());
});
