import * as fs from 'fs';
import csvParser = require("csv-parser");
import { UncorrelatedAccount } from '../models/UncorrelatedAccount';

export class CSVReader {

    constructor(private filepath: string) {

    }

    public async processLine(callback: ((line: UncorrelatedAccount) => void | Promise<void>)): Promise<void> {
        this.checkExists();
        return new Promise((resolve, reject) => {
            const input = fs.createReadStream(this.filepath);
            input.pipe(csvParser())
                .on('data', (data) => {
                    let result = callback(data as UncorrelatedAccount);
                    if (result instanceof Promise) {
                        (async () => await result)();
                    }
                })
                .on('end', () => resolve())
                .on('error', (err: any) => reject(err));
        });
    }

    private checkExists() {
        if (!fs.existsSync(this.filepath)) {
            throw new Error(`File ${this.filepath} does not exist`);
        }
    }

    public async getHeaders(): Promise<string[]> {
        this.checkExists();
        return new Promise((resolve, reject) => {
            const input = fs.createReadStream(this.filepath);
            input.pipe(csvParser())
                .on('headers', (headers) => {
                    input.destroy();
                    resolve(headers);
                })
                .on('error', (err: any) => reject(err));
        });
    }
}