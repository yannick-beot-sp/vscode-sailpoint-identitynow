/* eslint-disable @typescript-eslint/naming-convention */
import * as os from 'os';
import { it, describe } from 'mocha';
import path = require('node:path');
import { CSVReader } from '../../services/CSVReader';
import * as assert from 'assert';
import { UncorrelatedAccount } from '../../models/UncorrelatedAccount';

const dataFolder = path.join(path.dirname(__filename).replace(path.sep + "out" + path.sep, path.sep + "src" + path.sep), 'data');

suite('CSVReader Test Suite', () => {
    const inputPath = path.join(dataFolder, 'testcsv1.csv');
    console.log("Reading to", inputPath);
    describe('CSVReader should read data', () => {
        
        it("should process line with a simple function", async () => {
            const csvReader = new CSVReader(inputPath);
            let count = 0;
            let f = function(data: UncorrelatedAccount) {
                count++;
            };
            await csvReader.processLine(f);
            assert.equal(count, 1);
        });

        it("should process line with an async function", async () => {
            const csvReader = new CSVReader(inputPath);
            let count = 0;
            let f = async function(data: UncorrelatedAccount) {
                count++;
            };
            await csvReader.processLine(f);
            assert.equal(count, 1);
        });
    
        it("should process line with an object", async () => {
            const csvReader = new CSVReader(inputPath);

            class Counter {
                private _count = 0;
                constructor() { }

                public inc(): void {
                    console.log("count =", this._count);
                    this._count++;
                }

                public get count() {
                    return this._count;
                }
            }
            let counter = new Counter();

            let f = function(data: UncorrelatedAccount) {
                // console.log({data});
                counter.inc();
            };
            await csvReader.processLine(f);
            assert.equal(counter.count, 1);
        });
    });
    describe('CSVReader should read header', () => {
        const csvReader = new CSVReader(inputPath);
        it("should not fail", async () => {
            const headers = await csvReader.getHeaders();
            console.log("headers=" + headers);
            assert.notEqual(headers, null);
            assert.equal(headers.length, 4);

        });
    });

});
