import * as fs from 'fs';
import * as readline from 'readline';
import * as os from 'os';
import { parse } from 'csv-parse';
import { parse as parseSync } from 'csv-parse/sync';


// Note, the `stream/promises` module is only available
// starting with Node.js version 16
import { getFirstLine } from '../utils/fileutils.js';
import { transformNewlines } from '../utils/CSVTransform.js';

const UTF8_BOM = "\uFEFF";

export type CsvDelimiter = "," | ";";

/**
 * Choose one delimiter from the header. Semicolon wins only when the header
 * has more unquoted semicolons than commas. Otherwise the file is comma-separated,
 * so a multivalue ';' stays inside the field when Excel drops the quotes.
 */
export function detectCsvDelimiter(headerLine: string): CsvDelimiter {
    const line = headerLine.startsWith(UTF8_BOM) ? headerLine.slice(1) : headerLine;
    let commas = 0;
    let semicolons = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (inQuotes) {
            continue;
        }
        if (char === ",") {
            commas++;
        } else if (char === ";") {
            semicolons++;
        }
    }
    return semicolons > commas ? ";" : ",";
}

export class CSVReader<T> {

    private delimiter: CsvDelimiter | undefined;

    constructor(private filepath: string) {

    }

    public async processLine(callback: ((line: T) => void | Promise<void>)): Promise<void> {
        this.checkExists();
        const delimiter = await this.getDelimiter();

        const parser = fs
            .createReadStream(this.filepath)
            .pipe(parse({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                skip_empty_lines: true,
                columns: true,
                comment: '#',
                delimiter,
                bom: true,
                cast: transformNewlines
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

    private async getDelimiter(): Promise<CsvDelimiter> {
        if (this.delimiter === undefined) {
            const header = await getFirstLine(this.filepath);
            this.delimiter = detectCsvDelimiter(header);
        }
        return this.delimiter;
    }

    public async getHeaders(): Promise<string[]> {
        this.checkExists();
        const delimiter = await this.getDelimiter();
        let headers = await getFirstLine(this.filepath);
        if (headers.startsWith(UTF8_BOM)) {
            headers = headers.slice(1);
        }

        const records = parseSync(headers, { columns: false, delimiter, bom: true });
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
            const write2Null = fs.createWriteStream(os.devNull);
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