

import { EOL } from 'os';

import { createWriteStream, WriteStream } from 'fs';
import { AsyncParser, ParserOptions } from '@json2csv/node';
import { customUnwind } from '../utils/CSVTransform';


/**
 * This ensures that EOL characters are escaped
 * This adds double quotes 
 * @param opts 
 * @returns 
 */
function stringFormatter(
    opts: { quote?: string, escapedQuote?: string, escaptedEol?: string } = {},
) {
    const quote = typeof opts.quote === 'string' ? opts.quote : '"';
    const escaptedEol = typeof opts.escaptedEol === 'string' ? opts.escaptedEol : '\\n';
    const escapedQuote =
        typeof opts.escapedQuote === 'string'
            ? opts.escapedQuote
            : `${quote}${quote}`;

    const quoteRegExp = new RegExp(quote, 'g');
    const eolRegExp = new RegExp("\r?\n", 'g');
    return (value) => {
        if (value.includes(quote)) {
            value = value.replace(quoteRegExp, escapedQuote);
        }
        if (value.includes("\n")) {
            value.replace(eolRegExp, escaptedEol);
        }

        return `${quote}${value}${quote}`;
    };
}



export class CSVWriter<
    TRaw extends object,
    T extends object,
> {
    private initialized = false;
    private output!: WriteStream;
    private parser: AsyncParser<TRaw, T>;

    constructor(private outputPath: string, private headers: string[], private paths: string[], unwindablePaths: string[] = [], private transforms: any[] = [], private delimiter = ",") {
        // Construct options for AsyncParser
        const opts: ParserOptions<TRaw, T> = {
            fields: this.paths,
            // @ts-ignore
            transforms: transforms,
            header: false,
            defaultValue: '',
            delimiter,
            formatters: {
                string: stringFormatter()
            }
        };
        if (unwindablePaths.length > 0) {
            // @ts-ignore
            opts.transforms.push(customUnwind({ paths: unwindablePaths }));
        }
        this.parser = new AsyncParser(opts);
    }

    private async initialize(): Promise<void> {
        this.initialized = true;
        const opts: ParserOptions<TRaw, T> = { fields: this.headers, transforms: [], header: true };
        // TODO
        // Create Folders
        this.output = createWriteStream(this.outputPath, { encoding: 'utf8', autoClose: false });
        let parser = new AsyncParser(opts);
        await this.pipeline(parser, []);
    }

    private async pipeline(parser: AsyncParser<TRaw, T>, data: any): Promise<void> {
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
            await this.initialize();
        }
        this.output.write(EOL);
        await this.pipeline(this.parser, data);
    }

    public async end() {
        if (!this.initialized) {
            // ensure headers are written
            await this.initialize();
        }
        this.output.end();
    }
}

