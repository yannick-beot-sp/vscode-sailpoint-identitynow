export interface ValidatorOptions {

    required?: boolean;
    maxLength?: number;
    regexp?: string;
    custom?(input: string): string | undefined
    errorMessages?: ValidatorErrorMessages;

}
export interface ValidatorErrorMessages {
    required?: string;
    maxLength?: string;
    regexp?: string;
}

export class Validator {
    constructor(private readonly options: ValidatorOptions) { }

    public validate(input: string): string | undefined {
        // Implementation not very flexible

        if (this.options.required
            && !Rules.required(input)) {
            return this.options.errorMessages?.required ?? ErrorMessages.required;
        }

        if (this.options.maxLength
            && !Rules.maxLength(input, this.options.maxLength)) {
            return format(this.options.errorMessages?.maxLength ?? ErrorMessages.maxLength, this.options.maxLength);
        }

        if (this.options.regexp
            && !Rules.regexp(input, this.options.regexp)) {
            return this.options.errorMessages?.regexp ?? ErrorMessages.regexp;
        }


        return undefined;
    }
}

/**
 * Contains all validation method
 * Each method returns true if valid
 */
class Rules {

    public static required(val: any): boolean {
        var str;

        if (val === undefined || val === null) {
            return false;
        }

        str = String(val).replace(/\s/g, "");
        return str.length > 0 ? true : false;
    }


    public static maxLength(val: string, req: number): boolean {
        var size = val.length;
        return size <= req;
    }

    public static regexp(val: string, req: string): boolean {
        const reg = new RegExp(req);
        return !!reg.test(val);
    }

}

class ErrorMessages {
    public static readonly required = "You must provide a value";
    public static readonly maxLength = "The length must not exceed {0} characters";
    public static readonly regexp = "Format is invalid";
}

function format(format, ...args) {
    return format.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] !== 'undefined'
            ? args[number]
            : match
            ;
    });
}