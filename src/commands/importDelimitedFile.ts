import * as vscode from 'vscode';

/**
 * Base class for all importer
 */
class BaseDelimitedFileImporter {
    tenantName: string | undefined;
    tenantId: string | undefined;
    filePath: string | undefined;
    data = "";
    init(): void {
        this.data = "";
    }
}