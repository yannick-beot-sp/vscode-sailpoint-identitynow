import { randomUUID } from 'crypto';
import * as vscode from 'vscode';
import { FormTreeItem } from '../../models/ISCTreeItem.js';
import { TenantService } from '../../services/TenantService.js';
import { askObjectName, chooseTenants } from '../cloneUtils.js';
import { FormDefinitionImporter } from './FormDefinitionImporter.js';
import { cleanUpForms } from './utils.js';

export class FormDefinitionCloneCommand {
    constructor(private readonly tenantService: TenantService) { }

    async execute(node: FormTreeItem): Promise<void> {
        console.log("> FormDefinitionCloneCommand.execute");

        const ctx = await chooseTenants(this.tenantService, node, "form", node.label as string)
        if (!ctx) {
            return;
        }

        const forms = await ctx.sourceClient.exportForms(`name eq "${node.label}"`)
        if (forms.length === 0) {
            vscode.window.showErrorMessage(`Form ${node.label} not found`);
            return;
        }
        const [form] = cleanUpForms(forms)

        const name = await askObjectName("form", ctx.defaultName(form.object?.name ?? node.label as string))
        if (!name) {
            return;
        }

        // New identity so that the source form can never be overwritten by the import
        const { self, ...rest } = form
        const clone = {
            ...rest,
            object: { ...form.object, id: randomUUID(), name }
        }

        const importer = new FormDefinitionImporter(
            ctx.targetTenant.id,
            ctx.targetTenant.tenantName,
            ctx.targetTenant.name
        )
        await importer.importFileWithProgression([clone as any]);
    }
}
