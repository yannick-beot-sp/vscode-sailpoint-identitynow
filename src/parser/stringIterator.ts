import { ParseException } from "../errors";


export const END_OF_STRING = '\0';
export const SPACE = "^[ \t]$";
export const QUOTE = "^[\"']$";

export function isSpace(char: string) {
    const regexp = new RegExp(SPACE);
    return regexp.test(char);
}
export function isQuote(char: string) {
    const regexp = new RegExp(QUOTE);
    return regexp.test(char);
}

export class StringIterator {
    private currentIndex = 0;

    constructor(private readonly str) {

    }

    public advance(): string {
        this.currentIndex++;
        if (this.currentIndex >= this.str.length) {
            return END_OF_STRING;
        }
        return this.current;
    }


    public skipSpace() {
        while (/\s/.test(this.current)) {
            const tmp = this.advance();
            if (END_OF_STRING === tmp) {
                throw new ParseException("Not token found");
            }
        }
    }

    public readToken() {
        this.skipSpace();
        if (isQuote(this.current)) {
            this.advance(); // skipping quote
            const token = this.moveTo(QUOTE);
            this.advance(); // skipping quote
            return token;
        } else {
            return this.moveTo("[ \t.]", false);
        }
    }

    public moveTo(char: string, required = true): string {
        let current = this.current;
        let result = '';
        const regexp = new RegExp(char);
        while (!regexp.test(current) && END_OF_STRING !== current) {
            result += current;
            current = this.advance();
            if (required && current === END_OF_STRING) {
                throw new ParseException(`[${char}] not found`);
            }
        }


        return result;
    }

    get current() {
        if (this.currentIndex > this.str.length) {
            throw new ParseException("End of string reached");
        }
        return this.str[this.currentIndex];
    }
    get peep() { return this.str[this.currentIndex + 1]; }
}