import * as vscode from 'vscode';
import { NEW_ID } from '../constants';
import { TransformsTreeItem } from "../models/ISCTreeItem";
import { TransformQuickPickItem } from '../models/TransformQuickPickItem';
import { isEmpty } from '../utils/stringUtils';
import { getResourceUri } from '../utils/UriUtils';
import { createNewFile } from '../utils/vsCodeHelpers';
import { compareByLabel } from '../utils';
const transforms = require('../../snippets/transforms.json');

/**
 * Command used to open a source or a transform
 */
export class NewTransformCommand {
    async askTransformName(): Promise<string | undefined> {
        const result = await vscode.window.showInputBox({
            value: '',
            ignoreFocusOut: true,
            placeHolder: 'Transform name',
            prompt: "Enter the transform name",
            title: 'Identity Security Cloud',
            validateInput: text => {
                if (text && text.length > 50) {
                    return "Transform name cannot exceed 50 characters.";
                }

                if (text === '') {
                    return "You must provide a transform name.";
                }

                // '+' removed from allowed character as known issue during search/filter of transform 
                // If search/filter is failing, the transform is not properly closed and reopened
                const regex = new RegExp('^[a-z0-9 _:;,={}@()#-|^%$!?.*]{1,50}$', 'i');
                if (regex.test(text)) {
                    return null;
                }
                return "Invalid transform name";
            }
        });
        return result?.trim();
    }

    async askTransformType(): Promise<TransformQuickPickItem | undefined> {

        const transformPickList = Object.keys(transforms)
            .map((k: any) => ({
                "label": k,
                "detail": transforms[k].description,
                "template": transforms[k].newtemplate
            }))
            .sort(compareByLabel);

        const transform = await vscode.window.showQuickPick(transformPickList, {
            ignoreFocusOut: false,
            title: "Transform to use",
            canPickMany: false
        });
        return transform;
    }

    async execute(tenant: TransformsTreeItem): Promise<void> {

        console.log("> NewTransformCommand.execute", tenant);

        // assessing that item is a TenantTreeItem
        if (tenant === undefined || !(tenant instanceof TransformsTreeItem)) {
            console.log("WARNING: NewTransformCommand.execute: invalid node", tenant);
            throw new Error("NewTransformCommand.execute: invalid node");
        }
        const tenantName = tenant.tenantName || "";
        if (isEmpty(tenantName)) {
            return;
        }
        let transformName = await this.askTransformName() || "";
        if (isEmpty(transformName)) {
            return;
        }

        const transform = await this.askTransformType();
        if (!transform) {
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating File...',
            cancellable: false
        }, async (task, token) => {
            const newUri = getResourceUri(tenantName, 'transforms', NEW_ID, transformName);

            const strContent = transform.template.replaceAll("{TRANSFORM_NAME}", transformName);

            await createNewFile(newUri, strContent);
        });
    }
}
