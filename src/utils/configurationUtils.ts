import * as vscode from "vscode";
import { isEmpty } from "./stringUtils";
import { titleCase } from "./titleCase";
import * as configuration from '../configurationConstants';

export function ensureNotEmpty(paramName: string, value: any) {
    if (isEmpty(value)) {
        throw new Error("Invalid configuration parameter: " + titleCase(paramName));
    }
}

export function getConfigKey(key: string): string {
    let path: unknown | string = vscode.workspace.getConfiguration(configuration.SECTION_CONF).get(key);
    ensureNotEmpty(key, path);
    return path as string;
}

export function getWorkspaceFolder(): undefined | string {
    if (vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders.length > 0) {
        const proposedFolder = vscode.workspace.workspaceFolders[0].uri.fsPath.replace(/\\/g, "/");
        return proposedFolder;
    }
    return undefined;
}

export function inspectConfig(key: string, scope?: vscode.ConfigurationScope | null) {
    return vscode.workspace
        .getConfiguration(configuration.SECTION_CONF, scope)
        .inspect(key);
}

export function setConfigKey(key: string, value: string) {
    const inspect = inspectConfig(key);
    if (inspect === undefined) { return; }
    if (inspect.workspaceFolderValue !== undefined) {
        if (value === inspect.workspaceFolderValue) { return Promise.resolve(undefined); }

        return update(key, value, vscode.ConfigurationTarget.WorkspaceFolder);
    }

    if (inspect.workspaceValue !== undefined) {
        if (value === inspect.workspaceValue) { return Promise.resolve(undefined); }

        return update(key, value, vscode.ConfigurationTarget.Workspace);
    }

    if (inspect.globalValue === value || (inspect.globalValue === undefined && value === inspect.defaultValue)) {
        return Promise.resolve(undefined);
    }

    return update(
        key,
        value,
        vscode.ConfigurationTarget.Global,
    );
}

function update(
    key: string,
    value: string,
    target: vscode.ConfigurationTarget,
) {
    return vscode.workspace.getConfiguration(configuration.SECTION_CONF).update(key, value, target);
}