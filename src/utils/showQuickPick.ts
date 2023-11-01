/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable, QuickPickOptions, QuickInputButton, QuickInputButtons, QuickPick, window, QuickPickItem } from 'vscode';
import { Wizard } from '../wizard/wizard';
import { GoBackError, UserCancelledError } from '../errors';

// Picks are shown in given order, except higher priority items and recently used are moved to the top, and items are grouped if requiested
export async function showQuickPick<TPick extends QuickPickItem, T>(
    wizard: Wizard<T>,
    picks: TPick[] | Promise<TPick[]>,
    options: QuickPickOptions,
    skipIfOne?: boolean,
    onWayback = false
): Promise<TPick | TPick[]> {


    const disposables: Disposable[] = [];
    try {
        const quickPick: QuickPick<TPick> = createQuickPick(wizard, options);
        disposables.push(quickPick);
        // Show progress bar while loading quick picks
        quickPick.busy = true;
        quickPick.enabled = false;
        quickPick.placeholder = "Loading...";
        quickPick.show();

        picks = await picks;
        quickPick.items = await createQuickPickItems(picks, wizard);

        if (skipIfOne && quickPick.items && quickPick.items.length === 1) {
            if (onWayback) {
                // very likely that this prompt was skipped the first time as there is only 1 value
                // Throw an error to go back one more step
                throw new GoBackError();
            }
            quickPick.hide();
            return quickPick.items[0];
        }
        let zeroItem = false;
        if (quickPick.items.length === 0) {
            zeroItem = true;
            quickPick.canSelectMany = false;
            quickPick.items = [
                {
                    label: "No item"
                } as TPick
            ];
        } else {
            if (options.canPickMany) {
                quickPick.selectedItems = quickPick.items.filter(x => x.picked);
            } else {
                quickPick.activeItems = quickPick.items.filter(x => x.picked);
            }
        }

        quickPick.placeholder = options.placeHolder;
        quickPick.busy = false;
        quickPick.enabled = true;

        // eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor
        const result = await new Promise<TPick | TPick[]>(async (resolve, reject): Promise<void> => {
            disposables.push(
                quickPick.onDidAccept(async () => {
                    try {
                        if (options.canPickMany) {
                            resolve(Array.from(quickPick.selectedItems));
                        } else {
                            const selectedItem: TPick | undefined = quickPick.selectedItems[0];
                            if (!zeroItem && selectedItem) {
                                resolve(selectedItem);
                            }
                        }
                    } catch (error) {
                        reject(error);
                    }
                }),
                quickPick.onDidTriggerButton(async btn => {
                    if (btn === QuickInputButtons.Back) {
                        reject(new GoBackError());
                    }
                }),
                quickPick.onDidHide(() => {
                    reject(new UserCancelledError());
                })
            );
        });

        return result;
    } finally {
        disposables.forEach(d => { d.dispose(); });
    }
}

function createQuickPick<TPick extends QuickPickItem, T>(wizard: Wizard<T>, options: QuickPickOptions): QuickPick<TPick> {
    const quickPick: QuickPick<TPick> = window.createQuickPick<TPick>();

    if (wizard && wizard.showTitle) {
        quickPick.title = wizard.title;
        if (!wizard.hideStepCount && wizard.title) {
            quickPick.step = wizard.currentStep;
            quickPick.totalSteps = wizard.totalSteps;
        }
    }
    const buttons: QuickInputButton[] = [];
    if (wizard?.showBackButton) {
        buttons.push(QuickInputButtons.Back);
    }

    quickPick.buttons = buttons;

    if (options.ignoreFocusOut === undefined) {
        options.ignoreFocusOut = true;
    }

    if (options.canPickMany && options.placeHolder) {
        options.placeHolder += " (Press 'Space' to select and 'Enter' to confirm)";
    }

    // Copy settings that are common between options and quickPick
    quickPick.placeholder = options.placeHolder;
    quickPick.ignoreFocusOut = !!options.ignoreFocusOut;
    quickPick.matchOnDescription = !!options.matchOnDescription;
    quickPick.matchOnDetail = !!options.matchOnDetail;
    quickPick.canSelectMany = !!options.canPickMany;
    return quickPick;
}

async function createQuickPickItems<TPick extends QuickPickItem, T>(picks: TPick[], wizard: Wizard<T>) {
    let values = wizard.getCachedInputBoxValue();
    if (values !== undefined) {
        if (typeof values === 'string') {
            picks = picks.map(x => {
                x.picked = x.label === values;
                return x;
            });
        } else if (Array.isArray(values) && values.every(it => typeof it === 'string')) {
            picks = picks.map(x => {
                x.picked = values.includes(x.label);
                return x;
            });
        } else if (Array.isArray(values)) {
            const labels = values.map(x => x.label);
            picks = picks.map(x => {
                x.picked = labels.includes(x.label);
                return x;
            });
        } else {
            picks = picks.map(x => {
                x.picked = values.label === x.label;
                return x;
            });
        }
    }
    return picks;
}

