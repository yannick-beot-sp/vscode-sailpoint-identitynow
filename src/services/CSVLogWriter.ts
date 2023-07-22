/* eslint-disable @typescript-eslint/naming-convention */
import { createWriteStream, WriteStream } from 'fs';
import { EOL } from 'os';

export enum CSVLogWriterLogType {
    ERROR = 'ERROR',
    INFO = 'INFO',
    WARNING = 'WARNING',
    SUCCESS = 'SUCCESS'
}

export class CSVLogWriter {
    logFilename: string;
    private initialized = false;
    private output!: WriteStream;

    constructor(
        private csvFilename: string
    ) {
        if (csvFilename.endsWith('.csv')) {
            this.logFilename = csvFilename.substring(0, csvFilename.length-3) + this.getDateString() + '.log';
        } else {
            this.logFilename = csvFilename + '-' + this.getDateString() + '.log';
        }
    }

    private async initialize(): Promise<void> {
        this.initialized = true;
        
        // Create Folders
        this.output = createWriteStream(this.logFilename, { encoding: 'utf8', autoClose: false });
        await this.writeLine(CSVLogWriterLogType.INFO, `Importing file ${this.csvFilename}`);
    }

    public async writeLine(type: CSVLogWriterLogType, message: string): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }

        const timestamp = new Date().toISOString().replace(/\..+/, '');
        this.output.write(`[${timestamp}][${type.padEnd(CSVLogWriterLogType.SUCCESS.length, ' ')}]${message}`);
        this.output.write(EOL);
    }

    public async end() {
        if (!this.initialized) {
            await this.initialize();
        }
        this.output.end();
    }

    private getDateString() {
        const date = new Date();
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day =`${date.getDate()}`.padStart(2, '0');
        const hour =`${date.getHours()}`.padStart(2, '0');
        const minute =`${date.getMinutes()}`.padStart(2, '0');

        return `${year}${month}${day}${hour}${minute}`;
      }
}