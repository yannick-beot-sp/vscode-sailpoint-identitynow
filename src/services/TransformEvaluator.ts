import * as vscode from 'vscode';
import { isEmpty } from '../utils';
import { OpenResourceCommand } from "../commands/openResource";
import { ATTRIBUTES } from '../models/TransformAttributes';
import { COUNTRYCODES } from '../models/CountryCodes';
import { IdentityNowClient } from './IdentityNowClient';
import { VALID_OPERATORS } from '../constants';
import { TenantService } from './TenantService';

export class TransformEvaluator {
    private input: any;
    private tenantName = "";
    private tenantId = "";
    private identityNameOrId: any;

    constructor(
        private readonly tenantService: TenantService
    ) {
        this.input = undefined;
        // this.tenantName = undefined;
        this.identityNameOrId = undefined;
    }

    async evaluate(item?: any): Promise<any> {
        console.log('Evaluating transform...');
        console.log("################### item=", item);

        if (item !== undefined && item.tenantName) {
            this.tenantName = item.tenantName;
            this.tenantId = item.tenantId;
            let openResourceCommand: OpenResourceCommand = new OpenResourceCommand();
            await openResourceCommand.execute(item);
        } else {
            const editor = vscode.window.activeTextEditor;
            this.tenantName = editor?.document.uri.authority ?? "";
            if (this.tenantName) {
                const tenantInfo = await this.tenantService.getTenantByTenantName(this.tenantName);
                this.tenantId = tenantInfo?.id ?? "";
            }
        }

        console.log('TenantName = ' + this.tenantName);
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const document = editor.document;
            const text = document.getText();
            const transform = JSON.parse(text);

            let transformName = await this.getTransformName(transform);

            if (isEmpty(transformName)) {
                return;
            }

            let transformType = await this.getTransformType(transform);

            if (isEmpty(transformType)) {
                return;
            }

            let requiredAttributes = await this.getRequiredAttributes(transformType);
            let attributes = transform.attributes;
            let message;

            if (requiredAttributes?.length > 0) {
                if (!attributes) {
                    message = "Missing required attribute 'attributes";
                    console.error(message);
                    vscode.window.showErrorMessage(message);
                    return;
                } else {
                    let missingAttributes: string[] = [];

                    for (let i = 0; i < requiredAttributes.length; i++) {
                        if (attributes[requiredAttributes[i]] === undefined) {
                            missingAttributes.push(requiredAttributes[i]);
                        }
                    }

                    if (missingAttributes.length > 0) {
                        message = "Missing required attribute(s) [" + missingAttributes + "]";
                        console.error(message);
                        vscode.window.showErrorMessage(message);
                        return;
                    }
                }
            }

            if (transformType === 'rule') {
                transformType += ':' + attributes.operation;
            }

            let requiresInput: boolean = await this.requiresInput(transformType);

            if (requiresInput) {
                if ((attributes === null) || (attributes === undefined)) {
                    this.input = await this.askInput(transformType);

                    if (isEmpty(this.input)) {
                        return;
                    }
                } else {
                    if (attributes.input !== undefined) {
                        if (typeof attributes.input === 'object') {
                            this.input = await this.evaluateChildTransform(attributes.input);
                        } else {
                            this.input = attributes.input;
                        }
                    } else {
                        this.input = await this.askInput(transformType);

                        if (isEmpty(this.input)) {
                            return;
                        }
                    }
                }

                console.log(">>> Input: " + this.input);
            } else {
                if (attributes !== undefined) {
                    if (attributes.input !== undefined) {
                        if (attributes.input !== null) {
                            message = "Transforms of type '" + transformType + "' do not require attribute 'input'";
                            console.error(message);
                            vscode.window.showErrorMessage(message);
                            return;
                        }
                    }
                }
            }

            let result: any = await this.evaluateTransformOfType(transformType, attributes);

            if (result !== undefined) {
                vscode.window.showInformationMessage("Validation of transform successful. Result = " + (typeof result === 'string' ? ("'" + result + "'") : result));
            }
        }

        this.input = undefined;
        this.tenantName = "";
        this.tenantId = "";
        this.identityNameOrId = undefined;
    }

    async getTransformName(transform: any): Promise<string> {
        let transformName = transform.name;
        let message: string;

        if (isEmpty(transformName)) {
            message = "Missing required attribute 'name'";
            console.error(message);
            vscode.window.showErrorMessage(message);
        } else {
            console.log(">>> Evaluating transform '" + transformName + "'");
        }

        return transformName;
    }

    async getTransformType(transform: any): Promise<string> {
        console.log("> getTransformType", transform);

        let transformType = transform.type;
        let message: string;

        if (isEmpty(transformType)) {
            message = "Missing required attribute 'type'";
            console.error(message);
            vscode.window.showErrorMessage(message);
        } else {
            if (transformType === 'rule') {
                if ((transform.attributes !== undefined) && (transform.attributes.operation !== undefined)) {
                    transformType += ":" + transform.attributes.operation;
                }
            }

            let isValidTransformType: boolean = await this.isValidTransformType(transformType);

            if (!isValidTransformType) {
                message = "Invalid transform type '" + transformType + "'";
                console.error(message);
                vscode.window.showErrorMessage(message);
                transformType = '';
            } else {
                console.log(">>> Transform type '" + transformType + "'");
            }
        }

        return transformType;
    }

    async isValidTransformType(transformType: string): Promise<boolean> {
        console.log("> isValidTransformType", transformType);
        let isValidTransformType: boolean = false;

        if (Object.keys(ATTRIBUTES).indexOf(transformType) !== -1) {
            isValidTransformType = true;
        }

        return isValidTransformType;
    }

    async requiresInput(transformType: string): Promise<boolean> {
        console.log("> requiresInput", transformType);
        let result: boolean = true;

        if ((ATTRIBUTES[transformType].required.indexOf('input') === -1) && ((ATTRIBUTES[transformType].optional.indexOf('input') === -1))) {
            result = false;
        }

        console.log("< Requires input", result);
        return result;
    }

    async askInput(transformType: string): Promise<string | undefined> {
        let placeHolder = "Input text";
        let prompt: string = "Enter the text you want to use as transform's input";

        if ((transformType === 'accountAttribute') || (transformType === 'identityAttribute') || (transformType === 'rule:getReferenceIdentityAttribute')) {
            placeHolder = "Identity's username";
            prompt = "Enter the username of the identity you want to evaluate";
        }

        const input = await vscode.window.showInputBox({
            value: '',
            ignoreFocusOut: true,
            placeHolder: placeHolder,
            prompt: prompt,
            title: 'IdentityNow transform'
        });

        if (input !== undefined) {
            return input;
        }
    }

    async getRequiredAttributes(transformType: string): Promise<string[]> {
        let requiredAttributes: string[] = [];

        if (ATTRIBUTES[transformType].required.indexOf('input') === -1) {
            requiredAttributes = ATTRIBUTES[transformType].required;
        }

        return requiredAttributes;
    }

    async evaluateTransformOfType(transformType: string, attributes: any): Promise<any | undefined> {
        console.log("> evaluateTransformOfType", transformType, attributes);
        let result: any = undefined;

        if (transformType.startsWith('rule')) {
            transformType = 'rule';
        }

        switch (transformType) {
            case 'accountAttribute':
                result = await this.accountAttribute(attributes);
                break;
            case 'base64Decode':
                result = await this.base64Decode();
                break;
            case 'base64Encode':
                result = await this.base64Encode();
                break;
            case 'concat':
                result = await this.concat(attributes);
                break;
            case 'conditional':
                result = await this.conditional(attributes);
                break;
            case 'dateCompare':
                result = await this.dateCompare(attributes);
                break;
            case 'dateFormat':
                result = await this.dateFormat(attributes);
                break;
            case 'e164phone':
                result = await this.e164phone(attributes);
                break;
            case 'firstValid':
                result = await this.firstValid(attributes);
                break;
            case 'indexOf':
                result = await this.indexOf(attributes);
                break;
            case 'identityAttribute':
                result = await this.identityAttribute(attributes);
                break;
            case 'iso3166':
                result = await this.iso3166(attributes);
                break;
            case 'lastIndexOf':
                result = await this.lastIndexOf(attributes);
                break;
            case 'leftPad':
                result = await this.leftPad(attributes);
                break;
            case 'lookup':
                result = await this.lookup(attributes);
                break;
            case 'normalizeNames':
                result = await this.normalizeNames(attributes);
                break;
            case 'lower':
                result = await this.lower(attributes);
                break;
            case 'randomAlphaNumeric':
                result = await this.randomAlphaNumeric(attributes);
                break;
            case 'randomNumeric':
                result = await this.randomNumeric(attributes);
                break;
            case 'reference':
                result = await this.reference(attributes);
                break;
            case 'replaceAll':
                result = await this.replaceAll(attributes);
                break;
            case 'replace':
                result = await this.replace(attributes);
                break;
            case 'rightPad':
                result = await this.rightPad(attributes);
                break;
            case 'rule':
                result = await this.rule(attributes);
                break;
            case 'split':
                result = await this.split(attributes);
                break;
            case 'static':
                result = await this.static(attributes);
                break;
            case 'substring':
                result = await this.substring(attributes);
                break;
            case 'trim':
                result = await this.trim(attributes);
                break;
            case 'upper':
                result = await this.upper(attributes);
                break;
            case 'uuid':
                result = await this.uuid(attributes);
                break;
            default:
                let message = "Transform '" + transformType + "' not yet implemented";
                vscode.window.showWarningMessage(message);
        }

        return result;
    }

    async evaluateChildTransform(transform: any): Promise<any | undefined> {
        let transformType = await this.getTransformType(transform);

        if (isEmpty(transformType)) {
            return;
        }

        let requiredAttributes = await this.getRequiredAttributes(transformType);
        let attributes = transform.attributes;
        let message;

        if (requiredAttributes?.length > 0) {
            if (!attributes) {
                message = "Missing required attribute 'attributes'";
                console.error(message);
                vscode.window.showErrorMessage(message);
                return;
            } else {
                let missingAttributes: string[] = [];

                for (let i = 0; i < requiredAttributes.length; i++) {
                    if (attributes[requiredAttributes[i]] === undefined) {
                        missingAttributes.push(requiredAttributes[i]);
                    }
                }

                if (missingAttributes.length > 0) {
                    message = "Missing required attribute(s) [" + missingAttributes + "]";
                    console.error(message);
                    vscode.window.showErrorMessage(message);
                    return;
                }
            }
        }

        let requiresInput: boolean = await this.requiresInput(transformType);

        if (requiresInput) {
            if ((attributes === null) || (attributes === undefined)) {
                this.input = await this.askInput(transformType);

                if (isEmpty(this.input)) {
                    return;
                }
            } else {
                if (attributes.input !== undefined) {
                    if (typeof attributes.input === 'object') {
                        this.input = await this.evaluateChildTransform(attributes.input);
                    } else {
                        this.input = attributes.input;
                    }
                } else {
                    this.input = await this.askInput(transformType);

                    if (isEmpty(this.input)) {
                        return;
                    }
                }
            }

            console.log(">>> Input: " + this.input);
        } else {
            if (attributes !== undefined) {
                if (attributes.input !== undefined) {
                    if (attributes.input !== null) {
                        message = "Transforms of type '" + transformType + "' do not require attribute 'input'";
                        console.error(message);
                        vscode.window.showErrorMessage(message);
                        return;
                    }
                }
            }
        }

        return this.evaluateTransformOfType(transformType, attributes);
    }

    async accountAttribute(attributes: any) {
        console.log("Entering method accountAttribute");
        let result = undefined;

        let sourceName: string = attributes.sourceName;
        console.log(">>> Required attribute 'sourceName': '" + sourceName + "'");

        let attributeName: string = attributes.attributeName;
        console.log(">>> Required attribute 'attributeName': '" + attributeName + "'");

        const client = new IdentityNowClient(this.tenantId, this.tenantName);

        let sourceId: any = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Getting source '${sourceName}' id...`,
            cancellable: false
        }, async (task, token) => {
            let sourceId = await client.getSourceId(sourceName);
            console.log(`Source ${sourceName}'s id=${sourceId}`);
            return sourceId;
        });

        console.error("TODO Evaluate optional attributes");

        if (sourceId === undefined) {
            console.error(`Source ${sourceName} does not exist`);
            return;
        }

        if (this.identityNameOrId === undefined) {
            this.identityNameOrId = await this.askInput('accountAttribute');
        }

        if ((this.identityNameOrId === undefined) || (this.identityNameOrId === '')) {
            console.log('No username specified. Nothing to do');
            return;
        }

        console.log("Evaluating for identity='" + this.identityNameOrId + "'");

        let identity = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Getting identity '${this.identityNameOrId}'...`,
            cancellable: false
        }, async (task, token) => {
            return await client.getIdentity(this.identityNameOrId);
        });

        if (identity === undefined) {
            let message = `Identity '${this.identityNameOrId}' couldn't be found`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            return;
        }

        let nativeIdentity: string = 'undefined';

        for (let identityAccount of identity.accounts) {
            if (identityAccount.source.id === sourceId) {
                nativeIdentity = identityAccount.accountId;
                break;
            }
        }

        if (nativeIdentity === 'undefined') {
            let message = `No account found for identity '${this.identityNameOrId}' in source '${sourceName}'`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            return;
        }

        let account = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Getting account for nativeIdentity '${nativeIdentity}'...`,
            cancellable: false
        }, async (task, token) => {
            let account = await client.getAccount(nativeIdentity, sourceId);
            return account;
        });

        if (account === undefined) {
            let message = `Account '${this.identityNameOrId}' in source ${sourceName} couldn't be found`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            return;
        }

        let attributeValue: any = undefined;

        if (account.attributes !== undefined) {
            attributeValue = account.attributes[attributeName];
        }

        if (attributeValue === undefined) {
            let message = `Attribute '${attributeName} for account ${this.identityNameOrId} in source ${sourceName} does not exist or is null`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            return;
        }

        result = attributeValue;

        console.log("Exiting accountAttribute. result=" + result);
        return result;
    }

    async base64Decode() {
        console.log("Entering method base64Decode");

        let result = Buffer.from(this.input, 'base64').toString();

        console.log("Exiting base64Decode. result=" + result);
        return result;
    }

    async base64Encode() {
        console.log("Entering method base64Encode");

        let result = Buffer.from(this.input).toString('base64');

        console.log("Exiting base64Encode. result=" + result);
        return result;
    }

    async concat(attributes: any) {
        console.log("Entering method concat");
        let result = '';

        let values = attributes.values;
        let evaluatedValues = [];
        let currentValue;

        for (let value of values) {
            if (typeof value === 'object') {
                currentValue = await this.evaluateChildTransform(value);

                if (currentValue !== undefined) {
                    evaluatedValues.push(currentValue);
                } else {
                    return;
                }
            } else {
                evaluatedValues.push(value);
            }
        }

        console.log(">>> Required attribute 'values': '" + evaluatedValues + "'");

        for (let i = 0; i < evaluatedValues.length; i++) {
            result += evaluatedValues[i];
        }

        console.log("Exiting concat. result=" + result);
        return result;
    }

    async conditional(attributes: any) {
        console.log("Entering method conditional");
        let result: any;

        let expression: string = attributes.expression;
        console.log(">>> Required attribute 'expression': '" + expression + "'");
        let expressionItems: string[];
        let message: string;

        if (expression.includes(' eq ')) {
            expressionItems = expression.split(" eq ");

            if (expressionItems.length !== 2) {
                message = "Invalid expression '" + expression + "'";
                console.error(message);
                vscode.window.showErrorMessage(message);
                return;
            }
        } else {
            message = "Invalid expression '" + expression + "'. Operation must be 'eq'";
            console.error(message);
            vscode.window.showErrorMessage(message);
            return;
        }

        let leftHandExpression: string = expressionItems[0].replaceAll("\"", "");
        let leftHandExpressionValue: string;

        if (leftHandExpression.startsWith('$')) {
            if (leftHandExpression.includes(' ')) {
                message = `Invalid variable '${leftHandExpression}'`;
                console.error(message);
                vscode.window.showErrorMessage(message);
                return;
            }

            if (attributes[leftHandExpression.replace('$', '')] === undefined) {
                message = `Missing attribute '${leftHandExpression.replace('$', '')} for variable replacement`;
                console.error(message);
                vscode.window.showErrorMessage(message);
                return;
            }

            if (typeof attributes[leftHandExpression.replace('$', '')] === 'object') {
                leftHandExpressionValue = await this.evaluateChildTransform(attributes[leftHandExpression.replace('$', '')]);
            } else {
                leftHandExpressionValue = attributes[leftHandExpression.replace('$', '')];
            }
        } else {
            leftHandExpressionValue = leftHandExpression;
        }

        if (leftHandExpressionValue === undefined) {
            return;
        }

        console.log("Left hand expression value '" + leftHandExpressionValue + "'");

        let rightHandExpression: string = expressionItems[1].replaceAll("\"", "");
        let rightHandExpressionValue: string;

        if (rightHandExpression.startsWith('$')) {
            if (rightHandExpression.includes(' ')) {
                message = `Invalid variable '${rightHandExpression}'`;
                console.error(message);
                vscode.window.showErrorMessage(message);
                return;
            }

            if (attributes[rightHandExpression.replace('$', '')] === undefined) {
                message = `Missing attribute '${rightHandExpression.replace('$', '')} for variable replacement`;
                console.error(message);
                vscode.window.showErrorMessage(message);
                return;
            }

            if (typeof attributes[rightHandExpression.replace('$', '')] === 'object') {
                rightHandExpressionValue = await this.evaluateChildTransform(attributes[rightHandExpression.replace('$', '')]);
            } else {
                rightHandExpressionValue = attributes[rightHandExpression.replace('$', '')];
            }
        } else {
            rightHandExpressionValue = rightHandExpression;
        }

        if (rightHandExpressionValue === undefined) {
            return;
        }

        console.log("Right hand expression value '" + rightHandExpressionValue + "'");

        let positiveCondition: string = attributes.positiveCondition;
        let positiveConditionValue: string;

        if (positiveCondition.startsWith('$')) {
            if (positiveCondition.includes(' ')) {
                message = `Invalid variable '${positiveCondition}'`;
                console.error(message);
                vscode.window.showErrorMessage(message);
                return;
            }

            if (attributes[positiveCondition.replace('$', '')] === undefined) {
                message = `Missing attribute '${positiveCondition.replace('$', '')} for variable replacement`;
                console.error(message);
                vscode.window.showErrorMessage(message);
                return;
            }

            if (typeof attributes[positiveCondition.replace('$', '')] === 'object') {
                positiveConditionValue = await this.evaluateChildTransform(attributes[positiveCondition.replace('$', '')]);
            } else {
                positiveConditionValue = attributes[positiveCondition.replace('$', '')];
            }
        } else {
            positiveConditionValue = positiveCondition;
        }

        if (positiveConditionValue === undefined) {
            return;
        }

        console.log(">>> Required attribute 'positiveCondition': '" + positiveConditionValue + "'");

        let negativeCondition: string = attributes.negativeCondition;
        let negativeConditionValue: string;

        if (negativeCondition.startsWith('$')) {
            if (negativeCondition.includes(' ')) {
                message = `Invalid variable '${negativeCondition}'`;
                console.error(message);
                vscode.window.showErrorMessage(message);
                return;
            }

            if (attributes[negativeCondition.replace('$', '')] === undefined) {
                message = `Missing attribute '${negativeCondition.replace('$', '')} for variable replacement`;
                console.error(message);
                vscode.window.showErrorMessage(message);
                return;
            }

            if (typeof attributes[negativeCondition.replace('$', '')] === 'object') {
                negativeConditionValue = await this.evaluateChildTransform(attributes[negativeCondition.replace('$', '')]);
            } else {
                negativeConditionValue = attributes[negativeCondition.replace('$', '')];
            }
        } else {
            negativeConditionValue = negativeCondition;
        }

        if (negativeConditionValue === undefined) {
            return;
        }

        console.log(">>> Required attribute 'negativeCondition': '" + negativeCondition + "'");

        if (leftHandExpressionValue === rightHandExpressionValue) {
            result = positiveConditionValue;
        } else {
            result = negativeConditionValue;
        }

        console.log("Exiting conditional. result=" + result);
        return result;
    }

    async dateCompare(attributes: any) {
        console.log("Entering method dateCompare");
        let result = undefined;

        let firstDate = attributes.firstDate;

        if (typeof firstDate === 'object') {
            firstDate = await this.evaluateChildTransform(firstDate);
        }

        console.log(`>>> Required attribute 'firstDate': '${firstDate}'`);

        if (firstDate.startsWith('now')) {
            if (firstDate === 'now') {
                firstDate = new Date();
            }
        }

        let secondDate = attributes.secondDate;

        if (typeof secondDate === 'object') {
            secondDate = await this.evaluateChildTransform(secondDate);
        }

        console.log(`>>> Required attribute 'secondDate': '${secondDate}'`);

        if (secondDate.startsWith('now')) {
            if (secondDate === 'now') {
                secondDate = new Date();
            }
        }

        let operator = attributes.operator.toLowerCase();

        if (!VALID_OPERATORS.includes(operator)) {
            let message = `Invalid operator '${operator}'. Valid values are 'lt', 'lte', 'gt', and 'gte'.`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            return;
        }

        console.log(`>>> Required attribute 'operator': '${operator}'`);

        let positiveCondition = attributes.positiveCondition;
        console.log(`>>> Required attribute 'positiveCondition': '${positiveCondition}'`);

        let negativeCondition = attributes.negativeCondition;
        console.log(`>>> Required attribute 'negativeCondition': '${negativeCondition}'`);

        let operationResult: boolean = false;

        switch (operator) {
            case 'lt':
                console.log(new Date(firstDate) + ' < ' + new Date(secondDate));
                operationResult = new Date(firstDate) < new Date(secondDate);
                break;
            case 'lte':
                console.log(new Date(firstDate) + ' <= ' + new Date(secondDate));
                operationResult = new Date(firstDate) <= new Date(secondDate);
                break;
            case 'gt':
                console.log(new Date(firstDate) + ' > ' + new Date(secondDate));
                operationResult = new Date(firstDate) > new Date(secondDate);
                break;
            case 'gte':
                console.log(new Date(firstDate) + ' >= ' + new Date(secondDate));
                operationResult = new Date(firstDate) >= new Date(secondDate);
                break;
            default:
        }

        console.log("operationResult=" + operationResult);

        if (operationResult) {
            result = positiveCondition;
        } else {
            result = negativeCondition;
        }

        console.log("Exiting dateCompare. result=" + result);
        return result;
    }

    async dateFormat(attributes: any) {
        console.log("Entering method dateFormat");
        let result = undefined;

        let inputFormat = 'ISO8601';

        if (attributes.inputFormat !== undefined) {
            inputFormat = attributes.inputFormat;
        }

        let input = this.input;

        if (input === undefined) {
            if (attributes.input !== undefined) {
                input = attributes.input;

                if (typeof input === 'object') {
                    input = await this.evaluateChildTransform(input);
                }

                if (input === undefined) {
                    return;
                }
            }
        }

        /*
                if (!VALID_DATE_FORMATS.includes(inputFormat)) {
                    let message = `Invalid input date format '${inputFormat}'`;
                    console.error(message);
                    vscode.window.showErrorMessage(message);
                    return;
                }
                */

        console.log(`>>> Optional attribute 'inputFormat': '${inputFormat}'`);

        let outputFormat = 'ISO8601';

        if (attributes.outputFormat !== undefined) {
            outputFormat = attributes.outputFormat;
        }

        /*
        if (!VALID_DATE_FORMATS.includes(outputFormat)) {
            let message = `Invalid output date format '${outputFormat}'`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            return;
        }
        */

        console.log(`>>> Optional attribute 'outputFormat': '${outputFormat}'`);

        switch (outputFormat) {
            case 'ISO8601':
                result = new Date(input).toISOString();
                break;
            default:
        }

        console.log("Exiting dateFormat. result=" + result);
        return result;
    }

    async e164phone(attributes: any) {
        console.log("Entering method e164phone");
        let result = undefined;
        let defaultRegion;

        if (attributes.defaultRegion !== undefined) {
            defaultRegion = attributes.defaultRegion;

            console.log(`>>> Optional attribute 'defaultRegion': '${defaultRegion}'`);

            if (defaultRegion.length !== 2) {
                let message = `The format of the 'defaultRegion' attribute should be in ISO 3166-1 alpha-2 format`;
                console.error(message);
                vscode.window.showErrorMessage(message);
                console.log("Exiting e164phone. result=" + result);
                return;
            }

            if (Object.keys(COUNTRYCODES).indexOf(defaultRegion) === -1) {
                let message = `Invalid defaultRegion '${defaultRegion}'`;
                console.error(message);
                vscode.window.showErrorMessage(message);
                console.log("Exiting e164phone. result=" + result);
                return;
            }
        } else {
            defaultRegion = 'US';
        }

        let searchPattern = new RegExp('[^0-9]', 'g');
        result = this.input.replace(searchPattern, '');

        result = '+' + COUNTRYCODES[defaultRegion].countryCode + result;

        console.log("Exiting e164phone. result=" + result);
        return result;
    }

    async firstValid(attributes: any) {
        console.log("Entering method firstValid");
        let result = undefined;

        let currentValues: string = attributes.values;
        let values: string[] = [];

        for (let value of currentValues) {
            if (typeof value === 'object') {
                value = await this.evaluateChildTransform(value);
                values.push(value);
            } else {
                values.push(value);
            }
        }

        console.log(">>> Required attribute 'values': '" + values + "'");

        let ignoreErrors: string = 'false';

        if (attributes.ignoreErrors !== undefined) {
            ignoreErrors = attributes.ignoreErrors;
            console.log(">>> Optional attribute 'ignoreErrors': '" + ignoreErrors + "'");
        }

        console.error("Pending to implement ignoreErrors");

        for (let value of values) {
            if ((value !== 'undefined') && (value !== null)) {
                result = value;
                break;
            }
        }

        console.log("Exiting firstValid. result=" + result);
        return result;
    }

    async generateRandomString(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method generateRandomString");
        let result: any = undefined;

        let includeNumbers = attributes.includeNumbers;

        console.log(">>> Required attribute 'includeNumbers': '" + includeNumbers + "'");

        if ((includeNumbers !== 'true') && (includeNumbers !== 'false')) {
            let message = `Attribute includeNumbers must be either "true" or "false"`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            console.log("Exiting generateRandomString. result=" + result);
            return;
        }

        let includeSpecialChars = attributes.includeSpecialChars;

        console.log(">>> Required attribute 'includeSpecialChars': '" + includeSpecialChars + "'");

        if ((includeSpecialChars !== 'true') && (includeSpecialChars !== 'false')) {
            let message = `Attribute includeSpecialChars must be either "true" or "false"`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            console.log("Exiting generateRandomString. result=" + result);
            return;
        }

        let length = attributes.length;

        console.log(">>> Required attribute 'length': '" + length + "'");

        let lengthNumber = parseInt(length);

        if (isNaN(lengthNumber)) {
            let message = `Attribute 'length' must be a number`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            console.log("Exiting generateRandomString. result=" + result);
            return;
        }

        if (lengthNumber > 450) {
            let message = `Maximum allowable length is 450 characters`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            console.log("Exiting generateRandomString. result=" + result);
            return;
        }

        let availableChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

        if (includeNumbers === 'true') {
            availableChars += '0123456789';
        }

        if (includeSpecialChars === 'true') {
            availableChars += '!@#$%&*()+<>?';
        }

        console.log('availableChars=' + availableChars);

        result = Array(lengthNumber).join().split(',').map(function () { return availableChars.charAt(Math.floor(Math.random() * availableChars.length)); }).join('');

        console.log("Exiting generateRandomString. result=" + result);
        return result;
    }

    async getEndOfString(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method getEndOfString");
        let result: any = undefined;

        let numChars = attributes.numChars;

        console.log(">>> Required attribute 'numChars': '" + numChars + "'");

        let numCharsNumber = parseInt(numChars);

        if (isNaN(numCharsNumber)) {
            let message = `Attribute 'numChars' must be a number`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            console.log("Exiting getEndOfString. result=" + result);
            return;
        }

        if (numCharsNumber > this.input.length) {
            result = null;
        } else {
            result = this.input.substring(this.input.length - numCharsNumber);
        }

        console.log("Exiting getEndOfString. result=" + result);
        return result;
    }

    async getReferenceIdentityAttribute(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method getReferenceIdentityAttribute");
        let result: any = undefined;

        let uid = attributes.uid;
        console.log(">>> Required attribute 'uid': '" + uid + "'");

        let attributeName = attributes.attributeName;
        console.log(">>> Required attribute 'attributeName': '" + attributeName + "'");

        const client = new IdentityNowClient(this.tenantId, this.tenantName);

        if (uid === 'manager') {
            this.input = await this.askInput("rule:getReferenceIdentityAttribute");

            let identity = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Getting identity '${this.input}'...`,
                cancellable: false
            }, async (task, token) => {
                let identity = await client.getIdentity(this.input);
                return identity;
            });

            if (identity === undefined) {
                let message = `Identity '${this.input}' couldn't be found`;
                console.error(message);
                vscode.window.showErrorMessage(message);
                return;
            }

            if (identity.manager === undefined) {
                let message = `Missing or invalid value for identity '${this.input}' attribute 'manager'`;
                vscode.window.showErrorMessage(message);
                return;
            }


            if (identity.manager.name !== undefined) {
                let manager = await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Getting identity '${identity.manager.name}'...`,
                    cancellable: false
                }, async (task, token) => {
                    let manager = await client.getIdentity(identity.manager.name);
                    return manager;
                });

                if (manager === undefined) {
                    let message = `Identity '${identity.manager.name}' couldn't be found`;
                    console.error(message);
                    vscode.window.showErrorMessage(message);
                    return;
                }

                if (manager[attributeName] === undefined) {
                    let message = `Missing or invalid value for identity '${attributeName}' attribute 'manager'`;
                    vscode.window.showErrorMessage(message);
                    return;
                }

                result = manager[attributeName];
            }
        } else {
            let identity = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Getting identity '${uid}'...`,
                cancellable: false
            }, async (task, token) => {
                let identity = await client.getIdentity(uid);
                return identity;
            });

            if (identity === undefined) {
                let message = `Identity '${uid}' couldn't be found`;
                console.error(message);
                vscode.window.showErrorMessage(message);
                return;
            }

            if (identity[attributeName] === undefined) {
                let message = `Missing or invalid value for identity '${uid}' attribute '${attributeName}'`;
                vscode.window.showErrorMessage(message);
                return;
            }

            result = identity[attributeName];
        }

        console.log("Exiting getReferenceIdentityAttribute. result=" + result);
        return result;
    }

    async identityAttribute(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method identityAttribute");
        let result = undefined;

        let name: string = attributes.name;
        console.log(">>> Required attribute 'attributes.name': '" + name + "'");

        if (this.identityNameOrId === undefined) {
            this.identityNameOrId = await this.askInput('identityAttribute');
        }

        if ((this.identityNameOrId === undefined) || (this.identityNameOrId === '')) {
            console.log('No username specified. Nothing to do');
            return;
        }

        const client = new IdentityNowClient(this.tenantId, this.tenantName);

        let identity = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Getting identity '${this.identityNameOrId}'...`,
            cancellable: false
        }, async (task, token) => {
            let identity = await client.getIdentity(this.identityNameOrId);
            return identity;
        });

        if (identity === undefined) {
            let message = `Identity '${this.identityNameOrId}' couldn't be found`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            return;
        }

        if (identity.attributes[name] === undefined) {
            let message = `Missing or invalid value for identity '${this.identityNameOrId}' attribute '${name}'`;
            vscode.window.showErrorMessage(message);
            return;
        }

        result = identity.attributes[name];

        console.log("Exiting identityAttribute. result=" + result);
        return result;
    }

    async indexOf(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method indexOf");
        let result = 0;

        let substring = attributes.substring;

        if (typeof substring === 'object') {
            substring = await this.evaluateChildTransform(substring);
        }

        console.log(">>> Required attribute 'substring': '" + substring + "'");

        result = this.input.indexOf(substring);

        console.log("Exiting indexOf. result=" + result);
        return result;
    }

    async iso3166(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method iso3166");
        let result = 0;

        let format: string = "alpha2";

        if (attributes.format !== 'undefined') {
            format = attributes.format;
            console.log(">>> Optional attribute 'format': '" + format + "'");
        }

        if ((format !== 'alpha2') && (format !== 'alpha3') && (format !== 'numeric')) {
            let message = "Invalid format '" + format + "'. Valid values are 'alpha2', 'alpha3' and 'numeric'";
            console.error(message);
            vscode.window.showErrorMessage(message);
            return;
        }

        let message = "Transform 'iso3166' not yet implemented";
        vscode.window.showWarningMessage(message);
        return;

        console.log("Exiting iso3166. result=" + result);
        return result;
    }
    async lastIndexOf(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method lastIndexOf");
        let result = 0;

        let substring = attributes.substring;

        console.log(">>> Required attribute 'substring': '" + substring + "'");

        if (typeof substring === 'object') {
            result = await this.evaluateChildTransform(substring);
        }

        result = this.input.lastIndexOf(substring);

        console.log("Exiting lastIndexOf. result=" + result);
        return result;
    }

    async leftPad(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method leftPad");
        let result: string;

        let length: number = attributes.length;

        console.log(">>> Required attribute 'length': '" + length + "'");

        let padding: string = ' ';

        if (attributes.padding !== 'undefined') {
            padding = attributes.padding;
            console.log(">>> Optional attribute 'padding': " + padding);
        }

        result = this.input.padStart(length, padding);

        console.log("Exiting leftPad. result=" + result);
        return result;
    }

    async lookup(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method lookup");
        let result: any = undefined;

        let table = attributes.table;

        console.log(">>> Required attribute 'table': '" + table + "'");

        result = table[this.input];

        if (result === undefined) {
            if (table["default"]) {
                result = table["default"];
            } else {
                result = null;
            }
        }

        console.log("Exiting lookup. result=" + result);
        return result;
    }

    async normalizeNames(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method normalizeNames");
        let result: string = 'undefined';

        let searchPattern = new RegExp('(\\w+)(-|\\s|\')?', 'g');
        let items: string[] = this.input.split(searchPattern);

        let camelCaseWord;
        let ignoreNext = false;

        for (let item of items) {
            if ((ignoreNext) && (items.indexOf(item) !== 0)) {
                ignoreNext = false;
                continue;
            }

            if ((item !== '') && (item !== undefined)) {
                if (item !== ' ') {
                    camelCaseWord = item[0].toUpperCase() + item.substring(1).toLowerCase();
                } else {
                    camelCaseWord = ' ';
                }

                if (camelCaseWord.toUpperCase().startsWith('MC')) {
                    if (camelCaseWord.length === 2) {
                        ignoreNext = true;
                    } else {
                        ignoreNext = false;
                        camelCaseWord = camelCaseWord.substring(0, 2) + camelCaseWord.substring(2, 3).toUpperCase() + camelCaseWord.substring(3);
                    }
                } else if (camelCaseWord.toUpperCase().startsWith('MAC')) {
                    if (camelCaseWord.length === 3) {
                        ignoreNext = true;
                    } else {
                        ignoreNext = false;
                        camelCaseWord = camelCaseWord.substring(0, 3) + camelCaseWord.substring(3, 4).toUpperCase() + camelCaseWord.substring(4);
                    }
                } else {
                    ignoreNext = false;
                }

                if (result === 'undefined') {
                    result = camelCaseWord;
                } else {
                    result += camelCaseWord;
                }
            }
        }

        let toponymcOrGenerational: string[] = ['VON', 'DEL', 'OF', 'DE', 'LA', 'Y'];

        for (let item of toponymcOrGenerational) {
            searchPattern = new RegExp(`\\b(?=\\w)${item}\\b(?<=\\w)`, 'gi');

            if (result.match(searchPattern)) {
                result = result.replace(searchPattern, item.toLowerCase());
            }
        }

        searchPattern = new RegExp('\\s(?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})\\s', 'gi');

        if (result.match(searchPattern)) {
            result = result.replace(searchPattern, x => x.toUpperCase());
        }

        console.log("Exiting normalizeNames. result=" + result);
        return result;
    }

    async lower(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method lower");
        let result: string = this.input.toLowerCase();

        console.log("Exiting lower. result=" + result);
        return result;
    }

    async randomAlphaNumeric(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method randomAlphaNumeric");
        let result;

        let length: any = attributes.length;

        if (length === undefined) {
            length = 32;
        } else {
            console.log(">>> Option attribute 'length': '" + length + "'");
        }

        if (typeof length === 'string') {
            let message = `Attribute 'length' must be a number`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            console.log("Exiting randomAlphaNumeric. result=" + result);
            return;
        }

        if (length < 0) {
            let message = `Attribute 'length' must be a must be a positive number`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            console.log("Exiting generateRandomString. result=" + result);
            return;
        }

        if (length > 450) {
            let message = `Maximum allowable length is 450 characters`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            console.log("Exiting generateRandomString. result=" + result);
            return;
        }

        let availableChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

        result = Array(length).join().split(',').map(function () { return availableChars.charAt(Math.floor(Math.random() * availableChars.length)); }).join('');

        console.log("Exiting randomAlphaNumeric. result=" + result);
        return result;
    }

    async randomNumeric(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method randomNumeric");
        let result;

        let length: any = attributes.length;

        if (length === undefined) {
            length = 32;
        } else {
            console.log(">>> Option attribute 'length': '" + length + "'");
        }

        if (typeof length === 'string') {
            let message = `Attribute 'length' must be a number`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            console.log("Exiting randomNumeric. result=" + result);
            return;
        }

        if (length < 0) {
            let message = `Attribute 'length' must be a must be a positive number`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            console.log("Exiting generateRandomString. result=" + result);
            return;
        }

        if (length > 450) {
            let message = `Maximum allowable length is 450 characters`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            console.log("Exiting generateRandomString. result=" + result);
            return;
        }

        let availableChars = '0123456789';

        result = Array(length).join().split(',').map(function () { return availableChars.charAt(Math.floor(Math.random() * availableChars.length)); }).join('');

        console.log("Exiting randomNumeric. result=" + result);
        return result;
    }

    async reference(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method reference");
        let result = undefined;

        let id = attributes.id;
        console.log(">>> Required attribute 'id': '" + id + "'");

        const client = new IdentityNowClient(this.tenantId, this.tenantName);

        let transform: any = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Getting transform '${id}' ...`,
            cancellable: false
        }, async (task, token) => {
            let data = await client.getTransformByName(id);
            return data;
        });

        if (transform === undefined) {
            let message = "Transform '" + id + "' does not exist";
            console.error(message);
            vscode.window.showErrorMessage(message);
            return;
        } else {
            result = this.evaluateChildTransform(transform);
        }

        console.log("Exiting reference. result=" + result);
        return result;
    }

    async replaceAll(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method replaceAll");
        let result: string = 'undefined';

        let table = attributes.table;

        console.log(">>> Required attribute 'table': '" + table + "'");

        let tempResult = this.input;

        for (let regex of Object.keys(table)) {
            console.log(regex + " --> " + table[regex]);
            let searchPattern = new RegExp(regex, 'g');
            console.log('searchPattern', searchPattern);
            tempResult = tempResult.replace(searchPattern, table[regex]);
        }

        result = tempResult;

        console.log("Exiting replaceAll. result=" + result);
        return result;
    }

    async replace(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method replace");
        let result: string;

        let regex: string = attributes.regex;
        console.log(">>> Required attribute 'regex': '" + regex + "'");

        let replacement: string = attributes.replacement;
        console.log(">>> Required attribute 'replacement': '" + replacement + "'");

        let searchPattern = new RegExp(regex, 'g');
        result = this.input.replace(searchPattern, replacement);

        console.log("Exiting replace. result=" + result);
        return result;
    }

    async rightPad(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method rightPad");
        let result: string;

        let length: number = attributes.length;

        console.log(">>> Required attribute 'length': '" + length + "'");

        let padding: string = ' ';

        if (attributes.padding !== 'undefined') {
            padding = attributes.padding;
            console.log(">>> Optional attribute 'padding': " + padding);
        }

        result = this.input.padEnd(length, padding);

        console.log("Exiting rightPad. result=" + result);
        return result;
    }

    async rule(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method rule");
        let result: any = undefined;

        let name = attributes.name;

        if (name !== 'Cloud Services Deployment Utility') {
            let message = "Invalid attributes.name '" + name + "'. This must always be set to 'Cloud Services Deployment Utility'";
            console.error(message);
            vscode.window.showErrorMessage(message);
        } else {
            let operation = attributes.operation;

            switch (operation) {
                case 'generateRandomString':
                    result = await this.generateRandomString(attributes);
                    break;
                case 'getEndOfString':
                    result = await this.getEndOfString(attributes);
                    break;
                case 'getReferenceIdentityAttribute':
                    result = await this.getReferenceIdentityAttribute(attributes);
                    break;
                default:
                    let message = "Invalid operation '" + operation + "'";
                    vscode.window.showErrorMessage(message);
            }
        }

        console.log("Exiting rule. result=" + result);
        return result;
    }

    async split(attributes: any) {
        console.log("Entering method split");
        let result: any = undefined;

        let delimiter: string = attributes.delimiter;
        console.log(">>> Required attribute 'delimiter': '" + delimiter + "'");

        let index: number = attributes.index;
        console.log(">>> Required attribute 'index': '" + index + "'");

        let throws: boolean = false;

        if (attributes.throws !== undefined) {
            throws = attributes.throws;

            console.log(">>> Optional attribute 'throws': " + throws);
        }

        let components = this.input.split(delimiter);

        if (index < components.length) {
            result = components[index];
        } else {
            if (throws) {
                result = 'IndexOutOfBoundsException';
            } else {
                result = null;
            }
        }

        console.log("Exiting split. result=" + result);
        return result;
    }

    async static(attributes: any) {
        console.log("Entering method static");
        let result = undefined;

        let value: string = attributes.value;
        console.log(">>> Required attribute 'value': '" + value + "'");

        if (value.startsWith("$")) {
            result = await this.evaluateChildTransform(attributes[value.replace('$', '')]);
            console.log(">>> Optional attribute variable '" + value.replace('$', '') + "': '" + result + "'");
        } else if (value.startsWith("#")) {
            let message = `Velocity template is not yet implemented`;
            console.error(message);
            vscode.window.showErrorMessage(message);
            console.log("Exiting static. result=" + result);
            return;
        } else {
            result = value;
        }

        console.log("Exiting static. result=" + result);
        return result;
    }

    async substring(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method substring");
        let result: string = '';
        let begin = attributes.begin;

        if (typeof begin === 'object') {
            console.log("Getting complex value 'begin'");
            begin = await this.evaluateChildTransform(begin);
        }

        if (begin !== undefined) {
            console.log(">>> Required attribute 'begin': " + begin);

            let beginOffset = attributes.beginOffset;

            if (typeof beginOffset === 'undefined') {
                beginOffset = 0;
            } else {
                if (begin !== -1) {
                    console.log(">>> Optional attribute 'beginOffset': " + beginOffset);
                } else {
                    console.log(">>> Ignoring optional attribute 'beginOffset': " + beginOffset + " because 'begin' is -1");
                }
            }

            let end = undefined;

            if (attributes.end) {
                end = attributes.end;
                console.log(">>> Optional attribute 'end': " + end);

                if (typeof end === 'object') {
                    end = await this.evaluateChildTransform(end);
                }

                if (!end) {
                    return;
                }
            }

            let endOffset = 0;

            if (attributes.endOffset) {
                if ((typeof end === undefined) || (end === -1)) {
                    console.log(">>> Ignoring optional attribute 'endOffset': " + endOffset + " because end is not provided or is -1");
                } else {
                    endOffset = attributes.endOffset;
                    console.log(">>> Optional attribute 'endOffset': " + endOffset);
                }
            }

            if (end === -1) {
                end = undefined;
            }

            if (begin === -1) {
                begin = 0;
            }

            if (typeof end === 'undefined') {
                result = this.input.substring(begin + beginOffset);
            } else {
                result = this.input.substring(begin + beginOffset, end + endOffset);
            }

            console.log("Exiting substring. result=" + result);
            return result;
        }
    }

    async trim(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method trim");
        let result: string = this.input.trim();

        console.log("Exiting trim. result=" + result);
        return result;
    }

    async upper(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method upper");
        let result: string = this.input.toUpperCase();

        console.log("Exiting upper. result=" + result);
        return result;
    }

    async uuid(attributes: any) {
        console.log("------------------------------------------------------------------------------------------");
        console.log("Entering method uuid");
        let result: string = 'undefined';

        result = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

        console.log("Exiting uuid. result=" + result);
        return result;
    }
}