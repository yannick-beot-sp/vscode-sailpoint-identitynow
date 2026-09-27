import { NotificationTemplateVariableExample } from "./templateVariables";

type DateInput = Date | string | number | PreviewCalendar | undefined | null;
type AddUnit = "seconds" | "minutes" | "hours" | "days" | "months" | "years";

interface ZonedParts {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    millisecond: number;
    weekday: number;
}

interface PreviewCalendar {
    instant: Date;
    timeZone: string;
    getTime(): number;
    toString(): string;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DATE_STYLES: Record<string, number> = { full: 0, long: 1, medium: 2, short: 3, default: 2 };
const PATTERN_TOKENS = ["yyyy", "yy", "MMMM", "MMM", "MM", "M", "dd", "d", "EEEE", "EEE", "HH", "H", "hh", "h", "mm", "m", "ss", "s", "SSS", "a", "zzzz", "zzz", "XXX", "XX", "Z"];
const TOOL_KEYS = new Set(["date", "__dateTool", "__esc", "__numberTool", "spTools", "__util"]);

/**
 * Global functions available to every notification template.
 *
 * Date, number, and escape behavior follows the VelocityTools classes named by
 * the catalog. `spTools.formatDate` follows the styles documented for Identity
 * Security Cloud templates. Identity lookups use the example context because
 * this preview does not call the tenant.
 */
export function attachGlobalTools(context: Record<string, unknown>): void {
    const dateTool = createDateTool(systemTimeZone());
    if (!Object.prototype.hasOwnProperty.call(context, "date")) {
        context.date = dateTool;
    }
    context.__dateTool = dateTool;
    context.__esc = escapeTool;
    context.__numberTool = numberTool;
    context.spTools = spTools;
    context.__util = createUtil(context);
    if (!Object.prototype.hasOwnProperty.call(context, "nowDate")) {
        context.nowDate = new Date();
    }
}

function createDateTool(initialTimeZone: string) {
    let timeZone = initialTimeZone;
    const tool = {
        now(): Date {
            return new Date();
        },
        parse(input?: DateInput): Date {
            return toDate(input) ?? new Date(NaN);
        },
        format(formatOrValue?: unknown, value?: unknown): string {
            if (arguments.length < 2) {
                return formatDateValue(formatOrValue, undefined, timeZone);
            }
            return formatDateValue(value, formatOrValue, timeZone);
        },
        get(formatOrDateStyle?: unknown, timeStyle?: unknown): string {
            if (arguments.length >= 2) {
                return formatStyles(new Date(), styleNumber(formatOrDateStyle), styleNumber(timeStyle), timeZone);
            }
            return formatDateValue(new Date(), formatOrDateStyle, timeZone);
        },
        getCalendar(): PreviewCalendar {
            return createCalendar(new Date(), timeZone);
        },
        getDate(): Date {
            return new Date();
        },
        getDateFormat(format?: unknown, locale?: unknown, zone?: unknown): { format(value?: unknown): string; toString(): string } {
            const pattern = String(format ?? "medium");
            const selectedZone = typeof zone === "string" && isValidTimeZone(zone) ? zone : timeZone;
            const selectedLocale = typeof locale === "string" && locale ? locale : "en-US";
            return {
                format(value?: unknown): string {
                    return formatDateValue(value, pattern, selectedZone, selectedLocale);
                },
                toString(): string {
                    return pattern;
                },
            };
        },
        getDay(value?: unknown): string {
            return partOrEmpty(arguments.length === 0 ? new Date() : value, timeZone, (parts) => String(parts.day));
        },
        getMonth(value?: unknown): string {
            // Velocity DateTool returns Java's zero-based Calendar.MONTH.
            return partOrEmpty(arguments.length === 0 ? new Date() : value, timeZone, (parts) => String(parts.month - 1));
        },
        getYear(value?: unknown): string {
            return partOrEmpty(arguments.length === 0 ? new Date() : value, timeZone, (parts) => String(parts.year));
        },
        getTimeZone(): string {
            return timeZone;
        },
        setTimeZone(zone?: unknown): string {
            const requested = String(zone ?? "").trim();
            if (isValidTimeZone(requested)) {
                timeZone = requested;
            }
            return "";
        },
        toDate(formatOrValue?: unknown, value?: unknown): Date | PreviewCalendar | number | undefined {
            if (arguments.length >= 2) {
                return parseWithPattern(String(formatOrValue ?? ""), value, timeZone);
            }
            return asDateValue(formatOrValue);
        },
        toCalendar(formatOrValue?: unknown, value?: unknown): PreviewCalendar | undefined {
            if (isCalendar(formatOrValue) && arguments.length < 2) {
                return formatOrValue;
            }
            const parsed = arguments.length >= 2
                ? parseWithPattern(String(formatOrValue ?? ""), value, timeZone)
                : toDate(formatOrValue as DateInput);
            return parsed ? createCalendar(parsed, timeZone) : undefined;
        },
        add(input: DateInput, amount: number, unit: AddUnit): Date {
            const date = toDate(input ?? new Date());
            if (!date) {
                return new Date(NaN);
            }
            const result = new Date(date.getTime());
            switch (unit) {
                case "seconds":
                    result.setSeconds(result.getSeconds() + amount);
                    break;
                case "minutes":
                    result.setMinutes(result.getMinutes() + amount);
                    break;
                case "hours":
                    result.setHours(result.getHours() + amount);
                    break;
                case "days":
                    result.setDate(result.getDate() + amount);
                    break;
                case "months":
                    result.setMonth(result.getMonth() + amount);
                    break;
                case "years":
                    result.setFullYear(result.getFullYear() + amount);
                    break;
            }
            return result;
        },
        iso(input?: DateInput): string {
            const date = input === undefined || input === null ? new Date() : toDate(input);
            return date && !Number.isNaN(date.getTime()) ? date.toISOString() : "Invalid Date";
        },
    };
    return tool;
}

const spTools = {
    convertToTimeZone(value?: unknown, zone?: unknown): PreviewCalendar | undefined {
        const instant = toDate(value as DateInput);
        if (!instant) {
            return undefined;
        }
        const requested = String(zone ?? "").trim();
        const timeZone = isValidTimeZone(requested) ? requested : systemTimeZone();
        return createCalendar(instant, timeZone);
    },
    escapeHtml(value?: unknown): string {
        return escapeHtml(value);
    },
    formatDate(value?: unknown, second?: unknown, third?: unknown): string {
        const zone = isCalendar(value) ? value.timeZone : systemTimeZone();
        const instant = toDate(value as DateInput);
        if (!instant) {
            return "";
        }
        if (typeof second === "string") {
            return formatPattern(instant, second, zone);
        }
        if (typeof second === "number" && typeof third === "number") {
            return formatStyles(instant, second, third, zone);
        }
        return formatStyles(instant, 3, 3, zone);
    },
    formatOffsetDateTimeForEmail(value?: unknown): string {
        const instant = toDate(value as DateInput);
        if (!instant) {
            return "";
        }
        const zone = offsetTimeZone(value) ?? (isCalendar(value) ? value.timeZone : systemTimeZone());
        return formatPattern(instant, "EEE MMM dd HH:mm:ss zzz yyyy", zone);
    },
    formatURL(value?: unknown): string {
        const url = String(value ?? "");
        if (!url.includes("#") || !url.includes("/ui/")) {
            return url;
        }
        const uiIndex = url.indexOf("/ui/");
        const prefix = url.startsWith("/") ? "" : url.slice(0, uiIndex);
        return `${prefix}/ui/rest/redirect?url=${encodeURIComponent(url)}`;
    },
};

const escapeTool = {
    html: escapeHtml,
    java: escapeJava,
    javascript: escapeJavaScript,
    json: escapeJavaScript,
    sql(value?: unknown): string {
        return stringValue(value).replace(/'/g, "''");
    },
    unicode(value?: unknown): string {
        return stringValue(value)
            .replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "\t");
    },
    unurl(value?: unknown): string {
        return decodeURIComponent(stringValue(value).replace(/\+/g, " "));
    },
    url(value?: unknown): string {
        return encodeURIComponent(stringValue(value)).replace(/%20/g, "+");
    },
    velocity(value?: unknown): string {
        return stringValue(value).replace(/\$/g, "${esc.d}").replace(/#/g, "${esc.h}");
    },
    xml(value?: unknown): string {
        return stringValue(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    },
};

const numberTool = {
    currency(value?: unknown): string {
        return formatNumber("currency", value);
    },
    format(formatOrValue?: unknown, value?: unknown): string {
        if (arguments.length < 2) {
            return formatNumber("number", formatOrValue);
        }
        return formatNumber(String(formatOrValue ?? "number"), value);
    },
    getNumberFormat(format?: unknown, locale?: unknown): { format(value?: unknown): string; toString(): string } {
        const selected = String(format ?? "number");
        const selectedLocale = typeof locale === "string" && locale ? locale : "en-US";
        return {
            format(value?: unknown): string {
                return formatNumber(selected, value, selectedLocale);
            },
            toString(): string {
                return selected;
            },
        };
    },
    integer(value?: unknown): string {
        return formatNumber("integer", value);
    },
    number(value?: unknown): string {
        return formatNumber("number", value);
    },
    percent(value?: unknown): string {
        return formatNumber("percent", value);
    },
    toNumber(formatOrValue?: unknown, value?: unknown): number | undefined {
        const source = arguments.length >= 2 ? value : formatOrValue;
        const parsed = typeof source === "number" ? source : Number(String(source ?? "").replace(/[$,%\s]/g, ""));
        return Number.isFinite(parsed) ? parsed : undefined;
    },
};

function createUtil(context: Record<string, unknown>) {
    function identityFor(id: string): Record<string, unknown> | undefined {
        return id ? findById(context, id) : undefined;
    }
    return {
        getIdentityDetailsByID(id?: unknown): Record<string, unknown> {
            const identityId = scalarId(id);
            return identityFor(identityId) ?? { id: identityId, name: "Preview identity" };
        },
        getIdentityRequestById(id?: unknown): Record<string, unknown> {
            const requestId = scalarId(id);
            return identityFor(requestId) ?? { id: requestId, requestItems: [] };
        },
        getMultipleIdentitiesDetailsByID(...ids: unknown[]): Record<string, unknown>[] {
            const values = ids.length === 1 && Array.isArray(ids[0]) ? ids[0] : ids;
            return values
                .map((id) => scalarId(id))
                .filter((id) => id.length > 0)
                .map((id) => identityFor(id))
                .filter((identity): identity is Record<string, unknown> => identity !== undefined);
        },
        getObjectByJsonPath(source?: unknown, path?: unknown): unknown {
            const root = typeof source === "string" ? parseJson(source) : source;
            return evaluateJsonPath(root, String(path ?? "$"));
        },
        getUser(id?: unknown): Record<string, unknown> {
            const identityId = scalarId(id);
            const found = identityFor(identityId);
            return {
                id: String(found?.id ?? identityId),
                name: String(found?.name ?? found?.displayName ?? "Preview identity"),
                email: String(found?.email ?? "user@example.com"),
                phone: String(found?.phone ?? ""),
            };
        },
        sanitizeAndValidateEmailAddress(value?: unknown): string {
            const email = stringValue(value).trim().replace(/[\r\n]/g, "");
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
        },
    };
}

function formatDateValue(value: unknown, format: unknown, timeZone: string, locale = "en-US"): string {
    const instant = toDate(value as DateInput);
    if (!instant) {
        return "Invalid Date";
    }
    if (typeof format === "string" && format.toLowerCase() in DATE_STYLES) {
        return formatStyles(instant, DATE_STYLES[format.toLowerCase()], undefined, timeZone, locale);
    }
    if (typeof format === "string") {
        return formatPattern(instant, format, timeZone, locale);
    }
    return formatStyles(instant, 2, undefined, timeZone, locale);
}

function formatStyles(date: Date, dateStyle: number | undefined, timeStyle: number | undefined, timeZone: string, locale = "en-US"): string {
    if (Number.isNaN(date.getTime())) {
        return "Invalid Date";
    }
    if (!locale.toLowerCase().startsWith("en")) {
        const options: Intl.DateTimeFormatOptions = { timeZone };
        if (dateStyle !== undefined) {
            options.dateStyle = (["full", "long", "medium", "short"] as const)[dateStyle] ?? "medium";
        }
        if (timeStyle !== undefined) {
            options.timeStyle = (["full", "long", "medium", "short"] as const)[timeStyle] ?? "medium";
        }
        return new Intl.DateTimeFormat(locale, options).format(date);
    }
    const parts = zonedParts(date, timeZone);
    const dateText = dateStyle === undefined ? "" : englishDate(parts, dateStyle);
    const timeText = timeStyle === undefined ? "" : englishTime(date, parts, timeStyle, timeZone);
    return [dateText, timeText].filter((part) => part.length > 0).join(" ");
}

function englishDate(parts: ZonedParts, style: number): string {
    const monthName = MONTHS[parts.month - 1] ?? "";
    const monthShort = MONTH_SHORT[parts.month - 1] ?? "";
    const weekday = WEEKDAYS[parts.weekday] ?? "";
    const year = String(parts.year).slice(-2);
    switch (style) {
        case 0:
            return `${weekday}, ${monthName} ${parts.day}, ${parts.year}`;
        case 1:
            return `${monthName} ${parts.day}, ${parts.year}`;
        case 2:
            return `${monthShort} ${parts.day}, ${parts.year}`;
        default:
            return `${parts.month}/${parts.day}/${year}`;
    }
}

function englishTime(date: Date, parts: ZonedParts, style: number, timeZone: string): string {
    const hour24 = parts.hour % 24;
    const suffix = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 || 12;
    const clock = style === 3
        ? `${hour12}:${pad(parts.minute)} ${suffix}`
        : `${hour12}:${pad(parts.minute)}:${pad(parts.second)} ${suffix}`;
    if (style === 1) {
        return `${clock} ${timeZoneName(date, timeZone, "short")}`;
    }
    if (style === 0) {
        return `${clock} ${timeZoneName(date, timeZone, "long")}`;
    }
    return clock;
}

function formatPattern(date: Date, pattern: string, timeZone: string, locale = "en-US"): string {
    if (Number.isNaN(date.getTime())) {
        return "Invalid Date";
    }
    const parts = zonedParts(date, timeZone);
    let result = "";
    for (let index = 0; index < pattern.length;) {
        if (pattern[index] === "'") {
            const literal = readQuoted(pattern, index);
            result += literal.text;
            index = literal.next;
            continue;
        }
        const token = takeToken(pattern, index);
        if (!token) {
            result += pattern[index];
            index += 1;
            continue;
        }
        result += patternToken(date, parts, token, timeZone, locale);
        index += token.length;
    }
    return result;
}

function patternToken(date: Date, parts: ZonedParts, token: string, timeZone: string, locale: string): string {
    const hour24 = parts.hour % 24;
    const hour12 = hour24 % 12 || 12;
    switch (token) {
        case "yyyy":
            return String(parts.year);
        case "yy":
            return String(parts.year).slice(-2);
        case "MMMM":
            return monthName(date, timeZone, locale, "long");
        case "MMM":
            return monthName(date, timeZone, locale, "short");
        case "MM":
            return pad(parts.month);
        case "M":
            return String(parts.month);
        case "dd":
            return pad(parts.day);
        case "d":
            return String(parts.day);
        case "EEEE":
            return weekdayName(date, timeZone, locale, "long");
        case "EEE":
            return weekdayName(date, timeZone, locale, "short");
        case "HH":
            return pad(hour24);
        case "H":
            return String(hour24);
        case "hh":
            return pad(hour12);
        case "h":
            return String(hour12);
        case "mm":
            return pad(parts.minute);
        case "m":
            return String(parts.minute);
        case "ss":
            return pad(parts.second);
        case "s":
            return String(parts.second);
        case "SSS":
            return pad(parts.millisecond, 3);
        case "a":
            return hour24 >= 12 ? "PM" : "AM";
        case "zzzz":
            return timeZoneName(date, timeZone, "long");
        case "zzz":
            return timeZoneName(date, timeZone, "short");
        case "XXX":
            return offsetText(date, timeZone, true);
        case "XX":
        case "Z":
            return offsetText(date, timeZone, false);
        default:
            return token;
    }
}

function parseWithPattern(pattern: string, value: unknown, timeZone: string): Date | undefined {
    if (typeof value !== "string") {
        return toDate(value as DateInput);
    }
    const parts: ZonedParts = { year: 1970, month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0, weekday: 0 };
    let patternIndex = 0;
    let valueIndex = 0;
    while (patternIndex < pattern.length) {
        if (pattern[patternIndex] === "'") {
            const literal = readQuoted(pattern, patternIndex);
            if (value.slice(valueIndex, valueIndex + literal.text.length) !== literal.text) {
                return undefined;
            }
            valueIndex += literal.text.length;
            patternIndex = literal.next;
            continue;
        }
        const token = takeToken(pattern, patternIndex);
        if (!token) {
            if (value[valueIndex] !== pattern[patternIndex]) {
                return undefined;
            }
            patternIndex += 1;
            valueIndex += 1;
            continue;
        }
        const width = token === "yyyy" ? 4 : token === "SSS" ? 3 : token.length >= 2 ? 2 : undefined;
        const digits = readDigits(value, valueIndex, width);
        if (!digits) {
            return undefined;
        }
        const number = Number(digits.text);
        assignPatternNumber(parts, token, number);
        valueIndex = digits.next;
        patternIndex += token.length;
    }
    return zonedTime(parts, timeZone);
}

function assignPatternNumber(parts: ZonedParts, token: string, value: number): void {
    if (token.startsWith("y")) {
        parts.year = token === "yy" ? 2000 + value : value;
    } else if (token.startsWith("M")) {
        parts.month = value;
    } else if (token.startsWith("d")) {
        parts.day = value;
    } else if (token === "HH" || token === "H" || token === "hh" || token === "h") {
        parts.hour = value;
    } else if (token === "mm" || token === "m") {
        parts.minute = value;
    } else if (token === "ss" || token === "s") {
        parts.second = value;
    } else if (token === "SSS") {
        parts.millisecond = value;
    }
}

function formatNumber(format: string, value: unknown, locale = "en-US"): string {
    const numeric = typeof value === "number" ? value : Number(String(value ?? "").replace(/[$,%\s]/g, ""));
    if (!Number.isFinite(numeric)) {
        return "";
    }
    const named = format.toLowerCase();
    if (named === "integer") {
        return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(numeric);
    }
    if (named === "currency") {
        return new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(numeric);
    }
    if (named === "percent") {
        return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(numeric);
    }
    if (named === "number" || named === "default") {
        return new Intl.NumberFormat(locale).format(numeric);
    }
    const percent = format.includes("%");
    const currency = format.includes("¤");
    const [integerPattern, fractionPattern = ""] = format.replace(/[¤%$]/g, "").split(".");
    const minimumFractionDigits = (fractionPattern.match(/0/g) ?? []).length;
    const maximumFractionDigits = minimumFractionDigits + (fractionPattern.match(/#/g) ?? []).length;
    let text = new Intl.NumberFormat(locale, {
        useGrouping: integerPattern.includes(","),
        minimumFractionDigits,
        maximumFractionDigits,
    }).format(Math.abs(percent ? numeric * 100 : numeric));
    if (numeric < 0) {
        text = `-${text}`;
    }
    if (currency) {
        text = `$${text}`;
    }
    if (percent) {
        text += "%";
    }
    return text;
}

function evaluateJsonPath(source: unknown, path: string): unknown {
    const expression = path.trim();
    if (expression === "" || expression === "$") {
        return source;
    }
    const tokens = tokenizeJsonPath(expression.startsWith("$") ? expression.slice(1) : expression);
    let current: unknown[] = [source];
    for (const token of tokens) {
        const next: unknown[] = [];
        for (const value of current) {
            if (token.kind === "wildcard") {
                if (Array.isArray(value)) {
                    next.push(...value);
                }
                continue;
            }
            if (token.kind === "index") {
                if (Array.isArray(value)) {
                    next.push(value[token.index]);
                }
                continue;
            }
            if (isDataRecord(value) && !isBlockedKey(token.name) && Object.prototype.hasOwnProperty.call(value, token.name)) {
                next.push(value[token.name]);
            }
        }
        current = next.filter((value) => value !== undefined);
    }
    return expression.includes("*") ? current : current[0] ?? null;
}

function tokenizeJsonPath(path: string): Array<{ kind: "property"; name: string } | { kind: "index"; index: number } | { kind: "wildcard" }> {
    const tokens: Array<{ kind: "property"; name: string } | { kind: "index"; index: number } | { kind: "wildcard" }> = [];
    const pattern = /\.([A-Za-z_][A-Za-z0-9_]*)|\[\s*(\d+|\*)\s*\]|\['([^']+)'\]|\["([^"]+)"\]/g;
    for (const match of path.matchAll(pattern)) {
        if (match[1] || match[3] || match[4]) {
            tokens.push({ kind: "property", name: match[1] ?? match[3] ?? match[4] });
        } else if (match[2] === "*") {
            tokens.push({ kind: "wildcard" });
        } else if (match[2]) {
            tokens.push({ kind: "index", index: Number(match[2]) });
        }
    }
    return tokens;
}

function findById(context: Record<string, unknown>, id: string): Record<string, unknown> | undefined {
    const seen = new Set<unknown>();
    const queue: unknown[] = [];
    for (const [key, value] of Object.entries(context)) {
        if (!TOOL_KEYS.has(key)) {
            queue.push(value);
        }
    }
    while (queue.length > 0) {
        const current = queue.shift();
        if (!isDataRecord(current) || seen.has(current)) {
            continue;
        }
        seen.add(current);
        if (String(current.id ?? "") === id) {
            return current;
        }
        if (Array.isArray(current)) {
            queue.push(...current);
            continue;
        }
        queue.push(...Object.values(current).filter((value) => typeof value !== "function"));
    }
    return undefined;
}

function scalarId(value: unknown): string {
    if (Array.isArray(value)) {
        return scalarId(value[0]);
    }
    if (isDataRecord(value) && value.id !== undefined && value.id !== null) {
        return String(value.id);
    }
    return value === undefined || value === null ? "" : String(value);
}

function parseJson(value: string): unknown {
    try {
        return JSON.parse(value) as NotificationTemplateVariableExample;
    } catch {
        return undefined;
    }
}

function createCalendar(instant: Date, timeZone: string): PreviewCalendar {
    return {
        instant,
        timeZone,
        getTime: () => instant.getTime(),
        toString: () => formatPattern(instant, "EEE MMM dd HH:mm:ss zzz yyyy", timeZone),
    };
}

function isCalendar(value: unknown): value is PreviewCalendar {
    if (!isDataRecord(value)) {
        return false;
    }
    return value.instant instanceof Date && typeof value.timeZone === "string" && typeof value.getTime === "function";
}

function asDateValue(value: unknown): Date | PreviewCalendar | number | undefined {
    if (value instanceof Date || typeof value === "number" || isCalendar(value)) {
        return value;
    }
    return toDate(value as DateInput);
}

function toDate(input?: DateInput): Date | undefined {
    if (input === undefined || input === null || input === "") {
        return undefined;
    }
    if (input instanceof Date) {
        return Number.isNaN(input.getTime()) ? undefined : input;
    }
    if (isCalendar(input)) {
        return input.instant;
    }
    if (typeof input === "number") {
        const date = new Date(input);
        return Number.isNaN(date.getTime()) ? undefined : date;
    }
    if (typeof input === "string") {
        const parsed = new Date(input);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
}

function partOrEmpty(value: unknown, timeZone: string, select: (parts: ZonedParts) => string): string {
    const date = toDate(value as DateInput);
    return date ? select(zonedParts(date, timeZone)) : "";
}

function zonedParts(date: Date, timeZone: string): ZonedParts {
    const formatted = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes) => formatted.find((item) => item.type === type)?.value ?? "";
    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(part("weekday"));
    let hour = Number(part("hour"));
    if (hour === 24) {
        hour = 0;
    }
    return {
        year: Number(part("year")),
        month: Number(part("month")),
        day: Number(part("day")),
        hour,
        minute: Number(part("minute")),
        second: Number(part("second")),
        millisecond: date.getUTCMilliseconds(),
        weekday: weekday < 0 ? 0 : weekday,
    };
}

function zonedTime(parts: ZonedParts, timeZone: string): Date {
    const utc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, parts.millisecond);
    const first = utc - zoneOffsetMinutes(new Date(utc), timeZone) * 60_000;
    const second = utc - zoneOffsetMinutes(new Date(first), timeZone) * 60_000;
    return new Date(second);
}

function zoneOffsetMinutes(date: Date, timeZone: string): number {
    const parts = zonedParts(date, timeZone);
    const zoned = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    return Math.round((zoned - date.getTime()) / 60_000);
}

function offsetText(date: Date, timeZone: string, colon: boolean): string {
    const offset = zoneOffsetMinutes(date, timeZone);
    const sign = offset >= 0 ? "+" : "-";
    const absolute = Math.abs(offset);
    const hours = pad(Math.floor(absolute / 60));
    const minutes = pad(absolute % 60);
    return colon ? `${sign}${hours}:${minutes}` : `${sign}${hours}${minutes}`;
}

function offsetTimeZone(value: unknown): string | undefined {
    if (typeof value !== "string") {
        return undefined;
    }
    if (value.endsWith("Z")) {
        return "UTC";
    }
    const match = /([+-])(\d{2}):(\d{2})$/.exec(value);
    if (!match) {
        return undefined;
    }
    const sign = match[1] === "+" ? "-" : "+";
    return `Etc/GMT${sign}${Number(match[2])}`;
}

function timeZoneName(date: Date, timeZone: string, width: "short" | "long"): string {
    return new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: width })
        .formatToParts(date)
        .find((part) => part.type === "timeZoneName")?.value ?? timeZone;
}

function monthName(date: Date, timeZone: string, locale: string, width: "short" | "long"): string {
    return new Intl.DateTimeFormat(locale, { timeZone, month: width }).format(date);
}

function weekdayName(date: Date, timeZone: string, locale: string, width: "short" | "long"): string {
    return new Intl.DateTimeFormat(locale, { timeZone, weekday: width }).format(date);
}

function styleNumber(value: unknown): number | undefined {
    if (typeof value === "number") {
        return value;
    }
    if (typeof value === "string" && value.toLowerCase() in DATE_STYLES) {
        return DATE_STYLES[value.toLowerCase()];
    }
    return undefined;
}

function takeToken(pattern: string, index: number): string | undefined {
    return PATTERN_TOKENS.find((token) => pattern.startsWith(token, index));
}

function readQuoted(pattern: string, index: number): { text: string; next: number } {
    let cursor = index + 1;
    let text = "";
    while (cursor < pattern.length) {
        if (pattern[cursor] === "'" && pattern[cursor + 1] === "'") {
            text += "'";
            cursor += 2;
            continue;
        }
        if (pattern[cursor] === "'") {
            return { text, next: cursor + 1 };
        }
        text += pattern[cursor];
        cursor += 1;
    }
    return { text, next: cursor };
}

function readDigits(value: string, index: number, width: number | undefined): { text: string; next: number } | undefined {
    const available = value.slice(index).match(/^\d+/)?.[0];
    if (!available) {
        return undefined;
    }
    const text = width === undefined ? available.slice(0, 2) : available.slice(0, width);
    if (width !== undefined && text.length !== width) {
        return undefined;
    }
    return { text, next: index + text.length };
}

function systemTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function isValidTimeZone(zone: string): boolean {
    if (!zone) {
        return false;
    }
    try {
        Intl.DateTimeFormat("en-US", { timeZone: zone });
        return true;
    } catch {
        return false;
    }
}

function escapeHtml(value?: unknown): string {
    return stringValue(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function escapeJava(value?: unknown): string {
    return stringValue(value)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
}

function escapeJavaScript(value?: unknown): string {
    return escapeJava(value).replace(/'/g, "\\'");
}

function stringValue(value: unknown): string {
    if (value === undefined || value === null) {
        return "";
    }
    return String(value);
}

function pad(value: number, length = 2): string {
    return String(value).padStart(length, "0");
}

function isBlockedKey(key: string): boolean {
    return key === "__proto__" || key === "prototype" || key === "constructor";
}

function isDataRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object";
}
