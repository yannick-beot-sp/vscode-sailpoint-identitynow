// ISO 3166-1 alpha-2, alpha-3 and numeric codes. Names come from Intl.
const COUNTRY_CODES = `
AD AND 020 AE ARE 784 AF AFG 004 AG ATG 028 AI AIA 660 AL ALB 008 AM ARM 051 AO AGO 024 AQ ATA 010
AR ARG 032 AS ASM 016 AT AUT 040 AU AUS 036 AW ABW 533 AX ALA 248 AZ AZE 031 BA BIH 070 BB BRB 052 BD BGD 050
BE BEL 056 BF BFA 854 BG BGR 100 BH BHR 048 BI BDI 108 BJ BEN 204 BL BLM 652 BM BMU 060 BN BRN 096 BO BOL 068
BQ BES 535 BR BRA 076 BS BHS 044 BT BTN 064 BV BVT 074 BW BWA 072 BY BLR 112 BZ BLZ 084 CA CAN 124 CC CCK 166
CD COD 180 CF CAF 140 CG COG 178 CH CHE 756 CI CIV 384 CK COK 184 CL CHL 152 CM CMR 120 CN CHN 156 CO COL 170
CR CRI 188 CU CUB 192 CV CPV 132 CW CUW 531 CX CXR 162 CY CYP 196 CZ CZE 203 DE DEU 276 DJ DJI 262 DK DNK 208
DM DMA 212 DO DOM 214 DZ DZA 012 EC ECU 218 EE EST 233 EG EGY 818 EH ESH 732 ER ERI 232 ES ESP 724 ET ETH 231
FI FIN 246 FJ FJI 242 FK FLK 238 FM FSM 583 FO FRO 234 FR FRA 250 GA GAB 266 GB GBR 826 GD GRD 308 GE GEO 268
GF GUF 254 GG GGY 831 GH GHA 288 GI GIB 292 GL GRL 304 GM GMB 270 GN GIN 324 GP GLP 312 GQ GNQ 226 GR GRC 300
GS SGS 239 GT GTM 320 GU GUM 316 GW GNB 624 GY GUY 328 HK HKG 344 HM HMD 334 HN HND 340 HR HRV 191 HT HTI 332
HU HUN 348 ID IDN 360 IE IRL 372 IL ISR 376 IM IMN 833 IN IND 356 IO IOT 086 IQ IRQ 368 IR IRN 364 IS ISL 352
IT ITA 380 JE JEY 832 JM JAM 388 JO JOR 400 JP JPN 392 KE KEN 404 KG KGZ 417 KH KHM 116 KI KIR 296 KM COM 174
KN KNA 659 KP PRK 408 KR KOR 410 KW KWT 414 KY CYM 136 KZ KAZ 398 LA LAO 418 LB LBN 422 LC LCA 662 LI LIE 438
LK LKA 144 LR LBR 430 LS LSO 426 LT LTU 440 LU LUX 442 LV LVA 428 LY LBY 434 MA MAR 504 MC MCO 492 MD MDA 498
ME MNE 499 MF MAF 663 MG MDG 450 MH MHL 584 MK MKD 807 ML MLI 466 MM MMR 104 MN MNG 496 MO MAC 446 MP MNP 580
MQ MTQ 474 MR MRT 478 MS MSR 500 MT MLT 470 MU MUS 480 MV MDV 462 MW MWI 454 MX MEX 484 MY MYS 458 MZ MOZ 508
NA NAM 516 NC NCL 540 NE NER 562 NF NFK 574 NG NGA 566 NI NIC 558 NL NLD 528 NO NOR 578 NP NPL 524 NR NRU 520
NU NIU 570 NZ NZL 554 OM OMN 512 PA PAN 591 PE PER 604 PF PYF 258 PG PNG 598 PH PHL 608 PK PAK 586 PL POL 616
PM SPM 666 PN PCN 612 PR PRI 630 PS PSE 275 PT PRT 620 PW PLW 585 PY PRY 600 QA QAT 634 RE REU 638 RO ROU 642
RS SRB 688 RU RUS 643 RW RWA 646 SA SAU 682 SB SLB 090 SC SYC 690 SD SDN 729 SE SWE 752 SG SGP 702 SH SHN 654
SI SVN 705 SJ SJM 744 SK SVK 703 SL SLE 694 SM SMR 674 SN SEN 686 SO SOM 706 SR SUR 740 SS SSD 728 ST STP 678
SV SLV 222 SX SXM 534 SY SYR 760 SZ SWZ 748 TC TCA 796 TD TCD 148 TF ATF 260 TG TGO 768 TH THA 764 TJ TJK 762
TK TKL 772 TL TLS 626 TM TKM 795 TN TUN 788 TO TON 776 TR TUR 792 TT TTO 780 TV TUV 798 TW TWN 158 TZ TZA 834
UA UKR 804 UG UGA 800 UM UMI 581 US USA 840 UY URY 858 UZ UZB 860 VA VAT 336 VC VCT 670 VE VEN 862 VG VGB 092
VI VIR 850 VN VNM 704 VU VUT 548 WF WLF 876 WS WSM 882 YE YEM 887 YT MYT 175 ZA ZAF 710 ZM ZMB 894 ZW ZWE 716
`;

export interface Country {
    alpha2: string;
    alpha3: string;
    numeric: string;
}

let countriesByKey: Map<string, Country> | undefined;

/**
 * Indexes the countries by alpha-2, alpha-3, numeric code and English name, in lower case
 */
function getCountriesByKey(): Map<string, Country> {
    if (countriesByKey) {
        return countriesByKey;
    }

    const names = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' });
    const codes = COUNTRY_CODES.trim().split(/\s+/);
    countriesByKey = new Map();
    for (let i = 0; i < codes.length; i += 3) {
        const country = { alpha2: codes[i], alpha3: codes[i + 1], numeric: codes[i + 2] };
        const keys = [country.alpha2, country.alpha3, country.numeric, names.of(country.alpha2)];
        for (const key of keys) {
            if (key) {
                countriesByKey.set(key.toLowerCase(), country);
            }
        }
    }
    return countriesByKey;
}

/**
 * Finds a country by alpha-2, alpha-3 or numeric code, or by English name. Case insensitive.
 */
export function findCountry(value: string): Country | undefined {
    const key = value.trim().toLowerCase();
    return getCountriesByKey().get(/^\d{1,3}$/.test(key) ? key.padStart(3, '0') : key);
}

let languagesByName: Map<string, string> | undefined;

/**
 * Finds the RFC 5646 language tag of a language, from its English name or its ISO 639 code. Case insensitive.
 */
export function findLanguageTag(value: string): string | undefined {
    const key = value.trim().toLowerCase();

    if (/^[a-z]{2,3}$/.test(key)) {
        try {
            const tag = Intl.getCanonicalLocales(key)[0];
            if (new Intl.DisplayNames(['en'], { type: 'language', fallback: 'none' }).of(tag)) {
                return tag;
            }
        } catch {
            // not a valid language code
        }
    }

    if (!languagesByName) {
        const names = new Intl.DisplayNames(['en'], { type: 'language', fallback: 'none' });
        languagesByName = new Map();
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        for (const first of letters) {
            for (const second of letters) {
                const name = names.of(first + second);
                if (name && !languagesByName.has(name.toLowerCase())) {
                    languagesByName.set(name.toLowerCase(), first + second);
                }
            }
        }
    }
    return languagesByName.get(key);
}
