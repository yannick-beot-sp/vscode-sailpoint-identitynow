import * as os from 'os';
import * as configuration from '../configurationConstants';
import { getConfigKey, getWorkspaceFolder } from '../utils/configurationUtils';
import { sanitizePath } from '../utils';

interface ContextValues {
    /**
     * User Home Dir
     */
    u?: string
    /**
     * first workspace folder
     */
    w?: string
    /** either workspace folder if defined, or home dir */
    x?: string
    /** day */
    d?: string
    /** Month */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    M?: string
    /** Year */
    y?: number
    /** Hours */
    h?: string
    /** Minutes */
    m?: string
    /** Seconds */
    s?: string
    /**
     * Tenant name
     */
    t?: string
    /**
     * Friendly tenant name
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    T?: string
    /** Object type */
    o?: string
    /** Source name */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    S?: string
}


/**
 * this service is used to propose paths (folders, filenames)
 * It relies on configuration items and variable substitution
 */
export class PathProposer {

    public static replaceVariables(path: string, context: ContextValues = {}): string {
        // compute default values
        const w = getWorkspaceFolder();
        const now = new Date();
        const defaultContextValues: ContextValues = {
            u: os.homedir(),
            w,
            x: (w ? w : os.homedir()),
            y: now.getUTCFullYear(),
            // eslint-disable-next-line @typescript-eslint/naming-convention
            M: String(now.getUTCMonth() + 1).padStart(2, '0'),
            d: String(now.getUTCDate()).padStart(2, '0'),
            h: String(now.getUTCHours()).padStart(2, '0'),
            m: String(now.getUTCMinutes()).padStart(2, '0'),
            s: String(now.getUTCSeconds()).padStart(2, '0'),
        };

        const values = {
            ...defaultContextValues,
            ...context
        };
        // replace the tokens in path
        for (const [key, value] of Object.entries(values)) {
            path = path.replaceAll(`%${key}`, value ? value.toString() : "");
        }

        return path;
    }

    private static getSourceBasedReportFilename(
        key: string,
        tenantName: string,
        tenantDisplayName: string,
        sourceName: string,
    ): string {
        let path = getConfigKey(key);
        path = this.replaceVariables(path, {
            t: tenantName,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            T: tenantDisplayName,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            S: sourceName
        });
        return path as string;
    }

    private static getObjectBasedReportFilename(
        key: string,
        tenantName: string,
        tenantDisplayName: string,
        objectType: string,
        objectName: string,
    ): string {
        let result = getConfigKey(key);
        result = this.replaceVariables(result, {
            t: tenantName,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            T: tenantDisplayName,
            o: objectType,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            S: objectName
        });
        return sanitizePath(result);
    }

    private static getTenantBasedReportFilename(
        key: string,
        tenantName: string,
        tenantDisplayName: string,
    ): string {
        let path = getConfigKey(key);
        path = this.replaceVariables(path, {
            t: tenantName,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            T: tenantDisplayName,
        });
        return path as string;
    }

    public static getAccountReportFilename(
        tenantName: string,
        tenantDisplayName: string,
        sourceName: string,
    ): string {
        return this.getSourceBasedReportFilename(configuration.ACCOUNT_REPORT_FILENAME_CONF,
            tenantName,
            tenantDisplayName,
            sourceName);
    }

    public static getUncorrelatedAccountReportFilename(
        tenantName: string,
        tenantDisplayName: string,
        sourceName: string,
    ): string {
        return this.getSourceBasedReportFilename(configuration.UNCORRELATED_ACCOUNT_REPORT_FILENAME_CONF,
            tenantName,
            tenantDisplayName,
            sourceName);
    }

    public static getEntitlementReportFilename(
        tenantName: string,
        tenantDisplayName: string,
        sourceName: string,
    ): string {
        return this.getSourceBasedReportFilename(configuration.ENTITLEMENT_REPORT_FILENAME_CONF,
            tenantName,
            tenantDisplayName,
            sourceName);
    }

    public static getSPConfigSingleResourceFilename(
        tenantName: string,
        tenantDisplayName: string,
        objectType: string,
        objectName: string,
    ): string {
        return this.getObjectBasedReportFilename(configuration.SPCONFIG_SINGLE_RESOURCE_CONF,
            tenantName,
            tenantDisplayName,
            objectType,
            objectName);
    }

    public static getSPConfigSingleFileFilename(
        tenantName: string,
        tenantDisplayName: string,
    ): string {
        return this.getTenantBasedReportFilename(configuration.SPCONFIG_SINGLE_FILE_CONF,
            tenantName,
            tenantDisplayName);
    }

    public static getSPConfigMultipeFileFolder(
        tenantName: string,
        tenantDisplayName: string
    ): string {

        return this.getTenantBasedReportFilename(configuration.SPCONFIG_MULTIPLE_FILES_FOLDER_CONF,
            tenantName,
            tenantDisplayName);
    }

    public static getSPConfigMultipeFileFilename(
        tenantName: string,
        tenantDisplayName: string,
        objectType: string,
        objectName: string,
    ): string {
        return this.getObjectBasedReportFilename(configuration.SPCONFIG_MULTIPLE_FILES_FILENAME_CONF,
            tenantName,
            tenantDisplayName,
            objectType,
            objectName);
    }

    public static getAccessProfileReportFilename(
        tenantName: string,
        tenantDisplayName: string
    ): string {
        return this.getTenantBasedReportFilename(configuration.ACCESS_PROFILE_REPORT_FILENAME_CONF,
            tenantName,
            tenantDisplayName);
    }

    public static getRoleReportFilename(
        tenantName: string,
        tenantDisplayName: string
    ): string {
        return this.getTenantBasedReportFilename(configuration.ROLE_REPORT_FILENAME_CONF,
            tenantName,
            tenantDisplayName);
    }

    public static getFormsExportFilename(
        tenantName: string,
        tenantDisplayName: string
    ): string {
        return this.getTenantBasedReportFilename(configuration.FORMS_EXPORT_FILENAME_CONF,
            tenantName,
            tenantDisplayName);
    }

    public static getFormExportFilename(
        tenantName: string,
        tenantDisplayName: string,
        objectName: string
    ): string {
        return this.getObjectBasedReportFilename(configuration.FORM_EXPORT_FILENAME_CONF,
            tenantName,
            tenantDisplayName,
            "FORM_DEFINITION",
            objectName);
    }

    public static getWorkflowFilename(
        tenantName: string,
        tenantDisplayName: string,
        objectName: string
    ): string {
        return this.getObjectBasedReportFilename(configuration.WORKFLOW_EXPORT_FILENAME_CONF,
            tenantName,
            tenantDisplayName,
            "WORKFLOW",
            objectName);
    }
}