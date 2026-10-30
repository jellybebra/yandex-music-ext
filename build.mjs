// Build store-ready ZIPs: node build.mjs
import { readFile, writeFile, mkdir, copyFile, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = new URL('./', import.meta.url);
const output = new URL('web-ext-artifacts/', root);
const source = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
const firefoxSettings = JSON.parse(await readFile(new URL('firefox-settings.json', root), 'utf8'));
await mkdir(output, { recursive: true });
const files = [
    'background.js', 'inject.js', 'popup.html', 'popup.js', 'donation.js', 'PRIVACY.md',
    ...Object.values(source.icons),
];
for (const browser of ['chrome', 'firefox']) {
    const staging = await mkdtemp(join(fileURLToPath(output), `build-${browser}-`));
    try {
        const manifest = structuredClone(source);
        if (browser === 'firefox') {
            manifest.background = { scripts: [source.background.service_worker] };
            manifest.browser_specific_settings = firefoxSettings;
        }
        for (const file of new Set(files)) {
            await copyFile(new URL(file, root), join(staging, file));
        }
        await writeFile(join(staging, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
        const zip = fileURLToPath(new URL(`yandex-music-classic-${browser}-${source.version}.zip`, output));
        await rm(zip, { force: true });
        execFileSync('zip', ['-q', '-X', zip, 'manifest.json', ...new Set(files)], { cwd: staging });
        console.log(zip);
    } finally {
        await rm(staging, { recursive: true, force: true });
    }
}
