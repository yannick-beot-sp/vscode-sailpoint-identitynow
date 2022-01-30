import { window, ExtensionContext, authentication } from 'vscode';
import { SailPointIdentityNowAuthenticationProvider } from '../services/AuthenticationProvider';
import { TenantService } from '../services/TenantService';
import { isEmpty } from '../utils';


export class AddTenantCommand {


    constructor(private readonly tenantService: TenantService){}

    async askTenant(): Promise<string | undefined> {
        const result = await window.showInputBox({
            value: '',
            ignoreFocusOut: true,
            placeHolder: 'company or company.identitynow.com',
            prompt: "Enter the tenant name",
            title: 'IdentityNow',
            validateInput: text => {
                const regex = new RegExp('^[a-z0-9]+([a-z0-9-]*\.+)*[a-z0-9]+$', 'i');
                if (regex.test(text)) {
                    return null;
                }
                return "Invalid tenant name";
            }
        });
        return result;
    }


    async execute(context: ExtensionContext): Promise<void> {

        let tenantName = await this.askTenant();
        if (isEmpty(tenantName)) {
            return;
        }
        tenantName = tenantName?.toLowerCase() as string;

        const session = await authentication.getSession(SailPointIdentityNowAuthenticationProvider.id, [tenantName], { createIfNone: true });
        if (!isEmpty(session.accessToken)) {
            window.showInformationMessage(`Tenant ${tenantName} added!`);
            this.tenantService.setTenant({name:tenantName, apiUrl:''});
            // console.log({ "accessToken": session.accessToken });
        }
    }
}
