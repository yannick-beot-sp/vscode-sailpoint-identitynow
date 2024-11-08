import { SecretStorage } from "vscode";
import { TenantCredentials, TenantInfo, TenantToken } from "../models/TenantInfo";
import { isEmpty, isNotEmpty } from '../utils/stringUtils';
import { EndpointUtils } from "../utils/EndpointUtils";
import { AccessToken, OAuth2Client } from "./OAuth2Client";
import { CertificationCampaignInfo } from "../models/CertificationCampaignInfo";
import { TenantService, TenantServiceEventType } from "./TenantService";
import { Observer } from "./Observer";

const CAMPAIGN_CONFIGURATION_PREFIX = "IDENTITYNOW_TENANT_CAMPAIGN_CONFIGURATION_";

export class CampaignConfigurationService implements Observer<TenantServiceEventType, any> {


    constructor(private readonly secretStorage: SecretStorage, tenantService: TenantService) {
        tenantService.registerObserver(TenantServiceEventType.removeTenant, this)
    }

    async update(type: TenantServiceEventType, message: any): Promise<void> {
        if (TenantServiceEventType.removeTenant === type) {
            this.removeCertificationCampaignInfo(message.tenantName)
        }
    }

    public static async validateWorkflowCredentials(clientId: string, clientSecret: string, tenantName: string) {
        try {
            const at = await CampaignConfigurationService.getAccessToken(clientId, clientSecret, tenantName)
            return at !== undefined && isNotEmpty(at.accessToken)
        } catch (error) {
            return false
        }
    }

    private static async getAccessToken(clientId: string, clientSecret: string, tenantName: string): Promise<AccessToken> {
        const oauth2Client = new OAuth2Client(
            clientId,
            clientSecret,
            EndpointUtils.getAccessTokenUrl(tenantName)
        );
        return await oauth2Client.getAccessToken();

    }

    public async getCertificationCampaignInfo(tenantName: string): Promise<CertificationCampaignInfo | undefined> {

        const storedInfo = await this.secretStorage.get(this.getConfigurationKey(tenantName));
        if (storedInfo === undefined) {
            return undefined;
        }
        const info = JSON.parse(storedInfo) as CertificationCampaignInfo;
        // never return the credentials for security reason
        info.credentials = undefined
        return info;
    }

    public async setCertificationCampaignInfo(tenantName: string, info: CertificationCampaignInfo) {
        await this.secretStorage.store(this.getConfigurationKey(tenantName), JSON.stringify(info));
    }

    public async removeCertificationCampaignInfo(tenantName: string) {
        const key = this.getConfigurationKey(tenantName);
        await this.removeSecretKeyIfExists(key);
    }

    public async getWorkflowAccessToken(tenantName: string): Promise<string | undefined> {
        const storedInfo = await this.secretStorage.get(this.getConfigurationKey(tenantName));
        let token: TenantToken | undefined = undefined;
        if (isNotEmpty(storedInfo)) {
            try {
                const info = JSON.parse(storedInfo) as CertificationCampaignInfo;
                const token = await CampaignConfigurationService.getAccessToken(
                    info.credentials.clientId,
                    info.credentials.clientSecret,
                    tenantName
                )
                return token?.accessToken
            } catch (err) {
                console.log("WARNING: could not parse Token: ", err);
            }
        } else {
            console.log(`WARNING: no configuration for tenant + ${tenantName}`);
        }
        return undefined;
    }



    /**
     * Returns the key for the Campaign Configuration in the secret storage
     * @param tenantName 
     * @returns The key
     */
    private getConfigurationKey(tenantName: string): string {
        return CAMPAIGN_CONFIGURATION_PREFIX
            + tenantName;
    }


    /**
     * Check the existence before removing the key
     * @param key 
     */
    private async removeSecretKeyIfExists(key: string) {
        const secret = await this.secretStorage.get(key);
        if (secret !== undefined) {
            await this.secretStorage.delete(key);
        }
    }
}