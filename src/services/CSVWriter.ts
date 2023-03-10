

import { EOL } from 'os';
import { pipeline } from 'node:stream/promises';

import { createWriteStream, WriteStream } from 'fs';
// @ts-ignore
import { AsyncParser } from '@json2csv/node';
import { customUnwind } from '../utils/CSVTransform';
import { Stream } from 'stream';

export class CSVWriter {
    private initialized = false;
    private output!: WriteStream;
    private parser: AsyncParser;

    constructor(private outputPath: string, private headers: string[], private paths: string[], private unwindablePaths: string[] = []) {
        // Construct options for AsyncParser
        const opts: any = { fields: this.paths, transforms: [], header: false };
        if (Array.isArray(unwindablePaths) && unwindablePaths.length > 0) {
            opts.transforms = [customUnwind({ paths: unwindablePaths })];
        }
        this.parser = new AsyncParser(opts);
    }

    private async intialize(): Promise<void> {
        this.initialized = true;
        const opts = { fields: this.headers, transforms: {}, header: true };
        // TODO
        // Create Folders
        this.output = createWriteStream(this.outputPath, { encoding: 'utf8', autoClose: false });
        let parser = new AsyncParser(opts);
        await this.pipeline(parser, []);
    }

    private async pipeline(parser: AsyncParser, data: any): Promise<void> {
        return new Promise((resolve, reject) => {
            const input = parser.parse(data);
            input.pipe(this.output, { end: false });

            input.on('end', function () {
                resolve();
            });
            input.on('error', function (err: any) {
                reject(err);
            });
        });
    }

    public async write(data: any[]): Promise<void> {
        if (!this.initialized) {
            await this.intialize();
        }
        this.output.write(EOL);
        await this.pipeline(this.parser, data);
    }

    public async end() {
        if (!this.initialized) {
            // ensure headers are written
            await this.intialize();
        }
        this.output.end();
    }
}