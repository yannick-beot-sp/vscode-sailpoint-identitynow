/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable, InputBox, QuickInputButton, QuickInputButtons, Uri, env, window } from 'vscode';
import { GoBackError, UserCancelledError } from '../errors';
import { Wizard } from '../wizard/wizard';
import { LearnMore } from '../wizard/LearnMoreButton';
import { ExtInputBoxOptions } from '../wizard/ExtInputBoxOptions';
import { isNotEmpty } from './stringUtils';

export type InputBoxValidationResult = Awaited<ReturnType<Required<ExtInputBoxOptions>['validateInput']>>;

export async function showInputBox<T>(wizard: Wizard<T>, options: ExtInputBoxOptions): Promise<string> {
    const disposables: Disposable[] = [];
    try {
        const inputBox: InputBox = createInputBox(wizard, options);
        disposables.push(inputBox);

        let latestValidation: Promise<InputBoxValidationResult> = options.validateInput ? Promise.resolve(options.validateInput(inputBox.value)) : Promise.resolve('');
        return await new Promise<string>((resolve, reject): void => {
            disposables.push(
                inputBox.onDidChangeValue(async text => {
                    if (options.validateInput) {
                        const validation: Promise<InputBoxValidationResult> = Promise.resolve(options.validateInput(text));
                        latestValidation = validation;
                        const message: InputBoxValidationResult = await validation;
                        if (validation === latestValidation) {
                            inputBox.validationMessage = message || '';
                        }
                    }
                }),
                inputBox.onDidAccept(async () => {
                    // Run final validation and resolve if value passes
                    inputBox.enabled = false;
                    inputBox.busy = true;

                    const validateInputResult: InputBoxValidationResult = await latestValidation;
                    if (!validateInputResult) {
                        resolve(inputBox.value);
                    } else if (validateInputResult) {
                        inputBox.validationMessage = validateInputResult;
                    }

                    inputBox.enabled = true;
                    inputBox.busy = false;
                }),
                inputBox.onDidTriggerButton(async btn => {
                    if (btn === QuickInputButtons.Back) {
                        reject(new GoBackError());
                    } else if (btn === LearnMore && isNotEmpty(options.learnMoreLink)) {
                        await env.openExternal(Uri.parse(options.learnMoreLink));
                    }
                }),
                inputBox.onDidHide(() => {
                    reject(new UserCancelledError());
                })
            );
            inputBox.show();
        });
    } finally {
        disposables.forEach(d => { d.dispose(); });
    }
}

function createInputBox<T>(wizard: Wizard<T>, options: ExtInputBoxOptions): InputBox {
    const inputBox: InputBox = window.createInputBox();

    if (wizard && wizard.showTitle) {
        inputBox.title = wizard.title;
        if (!wizard.hideStepCount && wizard.title) {
            inputBox.step = wizard.currentStep;
            inputBox.totalSteps = wizard.totalSteps;
        }
    }

    const buttons: QuickInputButton[] = [];
    if (wizard.showBackButton) {
        buttons.push(QuickInputButtons.Back);
    }

    if (options.learnMoreLink) {
        buttons.push(LearnMore);
    }

    inputBox.buttons = buttons;

    if (options.ignoreFocusOut === undefined) {
        options.ignoreFocusOut = true;
    }

    const validateInput = options.validateInput;
    if (validateInput) {
        options.validateInput = async (v): Promise<InputBoxValidationResult> => await validateInput(v);
    }

    if (!inputBox.password) {
        inputBox.value = wizard.getCachedInputBoxValue() || options.value || '';
    }

    // Copy settings that are common between options and inputBox
    inputBox.ignoreFocusOut = !!options.ignoreFocusOut;
    inputBox.password = !!options.password;
    inputBox.placeholder = options.placeHolder;
    inputBox.prompt = options.prompt;
    inputBox.title ??= options.title;
    inputBox.value = options.default
    return inputBox;
}
