import * as fs from 'fs';
import * as readline from 'readline';
import { parse } from 'csv-parse';
import { parse as parseSync } from 'csv-parse/sync';


// Note, the `stream/promises` module is only available
// starting with Node.js version 16
import { getFirstLine } from '../utils/fileutils';


export class CSVReader<T> {

    constructor(private filepath: string) {

    }

    public async processLine(callback: ((line: T) => void | Promise<void>)): Promise<void> {
        this.checkExists();

        const parser = fs
            .createReadStream(this.filepath)
            .pipe(parse({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                skip_empty_lines: true,
                columns: true,
                comment: '#',
                delimiter: [",", ";"]
            }));

        for await (const record of parser) {
            let result = callback(record as T);
            if (result instanceof Promise) {
                await result;
            }
        }
    }

    private checkExists() {
        if (!fs.existsSync(this.filepath)) {
            throw new Error(`File ${this.filepath} does not exist`);
        }
    }

    public async getHeaders(): Promise<string[]> {
        this.checkExists();
        const headers = await getFirstLine(this.filepath);

        const records = parseSync(headers, { columns: false });
        return records[0];
    }

    /**
     * 
     * @returns Number of line, not counting the header
     */
    public async getLines(): Promise<number> {
        this.checkExists();
        return new Promise((resolve, reject) => {
            const input = fs.createReadStream(this.filepath);
            const write2Null = fs.createWriteStream('/dev/null');
            var linesCount = -1;
            let rl = readline.createInterface(input, write2Null);
            rl.on('line', function (line) {
                linesCount++; // on each linebreak, add +1 to 'linesCount'
            });
            rl.on('close', function () {
                // returning the result when the 'close' event is called
                resolve(linesCount);
            });
            rl.on('error', (err: any) => reject(err));
        });
    }
}