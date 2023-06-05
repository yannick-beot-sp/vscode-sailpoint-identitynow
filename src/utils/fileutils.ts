import path = require('path');
import * as fs from 'fs';
import * as os from 'os';
import { mkdtemp, rm } from 'node:fs/promises';

/**
 * Ensure that the folder supposed to hold the filename exists and if not, creates it
 * @param filepath absolute path, including the filename
 */
export async function ensureFolderExists(filepath: string) {
    console.log('> ensureFolderExists', filepath);

    const exportFolder = path.dirname(filepath);
    if (!fs.existsSync(exportFolder)) {
        console.log('ensureFolderExists: creating ', exportFolder);
        fs.mkdirSync(exportFolder, { recursive: true });
    }

    console.log('< ensureFolderExists');
}

/**
 * cf. https://advancedweb.hu/secure-tempfiles-in-nodejs-without-dependencies/
 */
export async function withTempFile(fn: any) {
    withTempDir((dir: any) => fn(path.join(dir, "file.csv")));
}

export async function withTempDir(fn: any) {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'idn-'));
    try {
        return await fn(dir);
    } finally {
        await rm(dir, { recursive: true, force: true });
    }
};