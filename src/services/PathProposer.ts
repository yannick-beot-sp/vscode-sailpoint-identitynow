import { isEmpty } from '../utils';
import * as vscode from 'vscode';
import * as os from 'os';
import { titleCase } from '../utils/titleCase';

const SECTION_CONF = "vscode-sailpoint-identitynow";
const ACCOUNT_REPORT_FILENAME_CONF = "report.accounts.filename";
const UNCORRELATED_ACCOUNT_REPORT_FILENAME_CONF = "report.uncorrelatedAccounts.filename";
const ENTITLEMENT_REPORT_FILENAME_CONF = "report.entitlements.filename";

const SPCONFIG_SINGLE_RESOURCE_CONF = "sP-Config.singleResource.filename";
const SPCONFIG_SINGLE_FILE_CONF = "sP-Config.singleFile.filename";
const SPCONFIG_MULTIPLE_FILES_FOLDER_CONF = "sP-Config.multipleFiles.folder";
const SPCONFIG_MULTIPLE_FILES_FILENAME_CONF = "sP-Config.multipleFiles.filename";

const GENERIC_CSV_REPORT_VIEW = "report.csv.filename";


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

    /** Type name */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    J?: string
}


/**
 * this service is used to propose paths (folders, filenames)
 * It relies on configuration items and variable substitution
 */
export class PathProposer {

    private static ensureNotEmpty(paramName: string, value: any) {
        if (isEmpty(value)) {
            throw new Error("Invalid configuration parameter: " + titleCase(paramName));
        }
    }

    private static getConfigKey(key: string): string {
        let path: unknown | string = vscode.workspace.getConfiguration(SECTION_CONF).get(key);
        this.ensureNotEmpty(key, path);
        return path as string;
    }

    private static getWorkspaceFolder(): undefined | string {
        if (vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders.length > 0) {
            const proposedFolder = vscode.workspace.workspaceFolders[0].uri.fsPath.replace(/\\/g, "/");
            return proposedFolder;
        }
        return undefined;
    }

    public static replaceVariables(path: string, context: ContextValues = {}): string {
        // compute default values
        const w = this.getWorkspaceFolder();
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
        let path = this.getConfigKey(key);
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
        let path = this.getConfigKey(key);
        path = this.replaceVariables(path, {
            t: tenantName,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            T: tenantDisplayName,
            o: objectType,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            S: objectName
        });
        return path as string;
    }

    private static getTenantBasedReportFilename(
        key: string,
        tenantName: string,
        tenantDisplayName: string,
    ): string {
        let path = this.getConfigKey(key);
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
        return this.getSourceBasedReportFilename(ACCOUNT_REPORT_FILENAME_CONF,
            tenantName,
            tenantDisplayName,
            sourceName);
    }

    public static getUncorrelatedAccountReportFilename(
        tenantName: string,
        tenantDisplayName: string,
        sourceName: string,
    ): string {
        return this.getSourceBasedReportFilename(UNCORRELATED_ACCOUNT_REPORT_FILENAME_CONF,
            tenantName,
            tenantDisplayName,
            sourceName);
    }

    public static getEntitlementReportFilename(
        tenantName: string,
        tenantDisplayName: string,
        sourceName: string,
    ): string {
        return this.getSourceBasedReportFilename(ENTITLEMENT_REPORT_FILENAME_CONF,
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
        return this.getObjectBasedReportFilename(SPCONFIG_SINGLE_RESOURCE_CONF,
            tenantName,
            tenantDisplayName,
            objectType,
            objectName);
    }

    public static getSPConfigSingleFileFilename(
        tenantName: string,
        tenantDisplayName: string,
    ): string {
        return this.getTenantBasedReportFilename(SPCONFIG_SINGLE_FILE_CONF,
            tenantName,
            tenantDisplayName);
    }

    public static getSPConfigMultipeFileFolder(
        tenantName: string,
        tenantDisplayName: string
    ): string {

        return this.getTenantBasedReportFilename(SPCONFIG_MULTIPLE_FILES_FOLDER_CONF,
            tenantName,
            tenantDisplayName);
    }

    public static getSPConfigMultipeFileFilename(
        tenantName: string,
        tenantDisplayName: string,
        objectType: string,
        objectName: string,
    ): string {
        return this.getObjectBasedReportFilename(SPCONFIG_MULTIPLE_FILES_FILENAME_CONF,
            tenantName,
            tenantDisplayName,
            objectType,
            objectName);
    }

    private static getGenericCSVFilenameWithKey(
        key: string,
        tenantName: string,
        tenantDisplayName: string,
        type: string
    ): string {
        let path = this.getConfigKey(key);
        path = this.replaceVariables(path, {
            t: tenantName,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            T: tenantDisplayName,
            J: type
        });
        return path as string;
    }

    public static getGenericCSVFilename(
        tenantName: string,
        tenantDisplayName: string,
        type: string
    ): string {
        return this.getGenericCSVFilenameWithKey(
            GENERIC_CSV_REPORT_VIEW,
            tenantName,
            tenantDisplayName,
            type
        );
    }
}