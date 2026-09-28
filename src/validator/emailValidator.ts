import { Validator } from "./validator.js";

export const emailValidator = new Validator({
    required: true,
    regexp: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
});
