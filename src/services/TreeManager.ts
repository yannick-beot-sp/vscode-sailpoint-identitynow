import { authentication, window, TreeItem, commands } from "vscode";
import { DialogResponses, IActionContext, UserCancelledError } from 'vscode-azureextensionui';
import { TenantTreeItem } from "../models/IdentityNowTreeItem";
import { IdentityNowDataProvider } from "../views/IdentityNowDataProvider";
import { SailPointIdentityNowAuthenticationProvider } from "./AuthenticationProvider";
import { TenantService } from "./TenantService";

export class TreeManager {

    constructor(
        private readonly dataProvider: IdentityNowDataProvider,
        private readonly tenantService: TenantService,
        private readonly authProvider: SailPointIdentityNowAuthenticationProvider
    ) { }



    public async removeTenant(item: TenantTreeItem): Promise<void> {
        console.log("> removeTenant", item);
        // assessing that item is a TenantTreeItem
        if (item === undefined || !(item instanceof TenantTreeItem)) {
            console.log("WARNING: removeTenant: invalid item", item);
            throw new Error("removeTenant: invalid item");
        }
        const tenantName = item.tenantName || "";
        const response = await window.showInformationMessage(
            `Are you sure you want to delete tenant ${tenantName}?`,
            ...["Yes", "No"]
        );
        if (response!=="Yes") {
            console.log("< removeTenant: no delete");
        }

        const session = await authentication.getSession(SailPointIdentityNowAuthenticationProvider.id, [tenantName], { createIfNone: false });
        if (session !== undefined) {
            this.authProvider.removeSession(session.id);
        }
        this.tenantService.removeTenant(tenantName);
        commands.executeCommand("vscode-sailpoint-identitynow.refresh-tenants");
        window.showInformationMessage(`Successfully deleted tenant ${tenantName}`);
    }
}