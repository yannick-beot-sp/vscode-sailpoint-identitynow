/* eslint-disable @typescript-eslint/naming-convention */
import * as os from 'os';
import { it, describe } from 'mocha';
import path = require('node:path');
import { CSVWriter } from '../../services/CSVWriter';

const data = [
    {
        "id": 1,
        "first_name": "Avigdor",
        "last_name": "Cona",
        "email": "acona0@microsoft.com",
        "gender": "Male",
        "ip_address": "138.240.227.51"
    },
    {
        "id": 2,
        "first_name": "Cathlene",
        "last_name": "Sekulla",
        "email": "csekulla1@bravesites.com",
        "gender": "Female",
        "ip_address": "82.70.149.156"
    },
    {
        "id": 3,
        "first_name": "Renaldo",
        "last_name": "Semrad",
        "email": "rsemrad2@ft.com",
        "gender": "Male",
        "ip_address": "172.63.113.18"
    },
    {
        "id": 4,
        "first_name": "Brittne",
        "last_name": "Harrald",
        "email": "bharrald3@foxnews.com",
        "gender": "Female",
        "ip_address": "164.57.246.150"
    },
    {
        "id": 5,
        "first_name": "Hort",
        "last_name": "Whetnall",
        "email": "hwhetnall4@nytimes.com",
        "gender": "Male",
        "ip_address": "23.68.96.105"
    },
    {
        "id": 6,
        "first_name": "Linnell",
        "last_name": "Winslet",
        "email": "lwinslet5@zdnet.com",
        "gender": "Female",
        "ip_address": "106.176.22.2"
    },
    {
        "id": 7,
        "first_name": "Randene",
        "last_name": "Ramiro",
        "email": "rramiro6@ft.com",
        "gender": "Female",
        "ip_address": "113.91.254.30"
    },
    {
        "id": 8,
        "first_name": "Jinny",
        "last_name": "Decroix",
        "email": "jdecroix7@moonfruit.com",
        "gender": "Female",
        "ip_address": "21.28.224.206"
    },
    {
        "id": 9,
        "first_name": "Celesta",
        "last_name": "Kyttor",
        "email": "ckyttor8@netlog.com",
        "gender": "Female",
        "ip_address": "59.52.205.146"
    },
    {
        "id": 10,
        "first_name": "Raye",
        "last_name": "Oakey",
        "email": "roakey9@51.la",
        "gender": "Female",
        "ip_address": "36.125.71.172"
    }
];

const headers = ["id", "first_name", "last_name", "email", "description"];

suite('CSVWriter Test Suite', () => {
    describe('CSVWriter without transform', () => {
        const outputPath = path.join(os.tmpdir(), './dummy-array.csv');
        console.log("Writing to", outputPath);
        const csvWriter = new CSVWriter(outputPath, headers, headers);
        it("should not fail", async () => {
            await csvWriter.write(data);
            csvWriter.end();

        });
    });

});
