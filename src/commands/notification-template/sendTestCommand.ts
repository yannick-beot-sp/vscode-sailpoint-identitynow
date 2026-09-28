import * as vscode from 'vscode';
import { SendTestNotificationRequestDtoMediumEnum as SendTestNotificationRequestDtoMedium, TemplateDtoMediumEnum as TemplateDtoMedium } from 'sailpoint-api-client/dist/notifications/api.js';
import { NotificationTemplateTreeItem } from '../../models/ISCTreeItem.js';
import { ISCClient } from '../../services/ISCClient.js';
import { TenantService } from '../../services/TenantService.js';
import { getIdByUri } from '../../utils/UriUtils.js';
import { emailValidator } from '../../validator/emailValidator.js';
import { validateTenantReadonly } from '../validateTenantReadonly.js';

const TEMPLATE_PATH = /\/notification-template(?:s|-body)\//;

interface TemplateTarget {
    tenantId: string;
    tenantName: string;
    templateId: string;
}

/**
 * Sends a test e-mail for a notification template through
 * `NotificationsApi.sendTestNotification` (`POST /beta/send-test-notification`).
 * The tenant renders the stored template (key, medium, locale) and delivers it
 * to the address entered here.
 */
export class SendNotificationTemplateTestCommand {

    constructor(private readonly tenantService: TenantService) { }

    async execute(arg?: NotificationTemplateTreeItem | vscode.Uri): Promise<void> {
        console.log("> SendNotificationTemplateTestCommand.execute", arg);
        const target = await this.resolveTarget(arg);
        if (!target) {
            return;
        }

        if (!(await validateTenantReadonly(this.tenantService, target.tenantId, "send a test email"))) {
            return;
        }

        const client = new ISCClient(target.tenantId, target.tenantName);
        const template = await client.getNotificationTemplateById(target.templateId);
        if (template.medium !== TemplateDtoMedium.Email) {
            vscode.window.showErrorMessage("Send test is available for e-mail templates only.");
            return;
        }

        let defaultEmail: string | undefined;
        let emailTestMode = false;
        try {
            const conf = await client.getEmailTestMode();
            defaultEmail = conf.emailTestAddress;
            emailTestMode = conf.emailTestMode === true;
        } catch (error) {
            console.warn("> SendNotificationTemplateTestCommand: could not read email test mode", error);
        }

        const recipient = await vscode.window.showInputBox({
            title: "Identity Security Cloud",
            prompt: emailTestMode && defaultEmail
                ? `Recipient for the test. Email test mode is on, so the tenant may deliver it to ${defaultEmail} instead.`
                : "Recipient for the test email",
            placeHolder: "name@example.com",
            value: defaultEmail,
            ignoreFocusOut: true,
            validateInput: (value) => emailValidator.validate(value.trim()),
        });
        if (recipient === undefined) {
            return;
        }

        if (!(await this.saveDirtyEditors(target.templateId))) {
            return;
        }

        const label = template.name ?? template.key;
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Sending test email for ${label}...`,
                cancellable: false,
            }, () => client.sendTestNotification({
                key: template.key,
                medium: SendTestNotificationRequestDtoMedium.Email,
                locale: template.locale,
                recipientEmailList: [recipient.trim()],
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Could not send test email for ${label}: ${message}`);
            return;
        }

        const suffix = emailTestMode
            ? " Email test mode is enabled for this tenant."
            : "";
        vscode.window.showInformationMessage(
            `Test email sent for ${label} (${template.locale}) to ${recipient.trim()}.${suffix}`
        );
    }

    private async resolveTarget(arg?: NotificationTemplateTreeItem | vscode.Uri): Promise<TemplateTarget | undefined> {
        if (this.isTemplateNode(arg)) {
            return {
                tenantId: arg.tenantId,
                tenantName: arg.tenantName,
                templateId: arg.resourceId,
            };
        }

        const uri = arg instanceof vscode.Uri
            ? arg
            : vscode.window.activeTextEditor?.document.uri;
        if (!uri || uri.scheme !== "idn" || !TEMPLATE_PATH.test(uri.path)) {
            vscode.window.showErrorMessage("Open an e-mail notification template to send a test.");
            return undefined;
        }

        const tenantInfo = await this.tenantService.getTenantByTenantName(uri.authority);
        const templateId = getIdByUri(uri);
        if (!tenantInfo || !templateId) {
            vscode.window.showErrorMessage("Could not resolve the notification template.");
            return undefined;
        }
        return {
            tenantId: tenantInfo.id,
            tenantName: tenantInfo.tenantName,
            templateId,
        };
    }

    private isTemplateNode(arg: unknown): arg is NotificationTemplateTreeItem {
        return !!arg
            && typeof arg === "object"
            && "tenantId" in arg
            && "tenantName" in arg
            && "resourceId" in arg
            && typeof (arg as NotificationTemplateTreeItem).resourceId === "string"
            && !(arg instanceof vscode.Uri);
    }

    /**
     * The send API renders the template stored in the tenant. Persist open
     * editors for this template first so the test includes the latest body.
     * Returns false when the user dismisses the prompt or a save fails.
     */
    private async saveDirtyEditors(templateId: string): Promise<boolean> {
        const dirty = vscode.workspace.textDocuments.filter(doc =>
            doc.isDirty
            && doc.uri.scheme === "idn"
            && TEMPLATE_PATH.test(doc.uri.path)
            && getIdByUri(doc.uri) === templateId
        );
        if (dirty.length === 0) {
            return true;
        }

        const choice = await vscode.window.showWarningMessage(
            "This template has unsaved changes. Save them before sending the test?",
            "Save and send",
            "Send saved version",
        );
        if (!choice) {
            return false;
        }
        if (choice === "Send saved version") {
            return true;
        }
        for (const doc of dirty) {
            if (!(await doc.save())) {
                return false;
            }
        }
        return true;
    }
}
