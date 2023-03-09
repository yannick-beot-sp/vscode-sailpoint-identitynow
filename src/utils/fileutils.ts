import path = require('path');
import * as fs from 'fs';

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