import { TenantService } from "../../services/TenantService";
import { chooseTenant } from "../../utils/vsCodeHelpers";
import { WizardBaseExporter } from "./WizardBaseExporter";

/**
 * Entrypoint for full export configuration from the command palette. Tenant is unknown.
 */
export class ExportConfigPalette extends WizardBaseExporter {
    constructor(
        private readonly tenantService: TenantService
    ) { super(); }

    async execute() {
        console.log("> exportConfigPalette.execute");
        const tenantInfo = await chooseTenant(this.tenantService, 'From which tenant do you want to export the config?');
        console.log("exportConfigPalette: tenant = ", tenantInfo);
        if (!tenantInfo) {
            return;
        }

        await this.chooseAndExport(
            tenantInfo.id,
            tenantInfo.tenantName,
            tenantInfo.name
        );
    }
}
