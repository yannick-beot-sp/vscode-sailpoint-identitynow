import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

type BrowseAction = "up" | "enter" | "toggle-all" | "toggle-hidden" | "select-dir" | "dir" | "file";

interface BrowseItem extends vscode.QuickPickItem {
    action: BrowseAction;
    fullPath?: string;
}

interface ListedEntry {
    name: string;
    fullPath: string;
    isDirectory: boolean;
}

let lastDirectory: string | undefined;

/**
 * Cursor's native open dialog is parented on a hidden window and never shows.
 * VS Code shows the system file panel, so this picker is only used in Cursor.
 */
export function prefersInEditorFileDialog(appName: string = vscode.env.appName, uriScheme: string = vscode.env.uriScheme): boolean {
    return appName === "Cursor" || appName.startsWith("Cursor ") || uriScheme === "cursor";
}

export async function browseForFile(options: vscode.OpenDialogOptions): Promise<vscode.Uri | vscode.Uri[] | undefined> {
    console.log("> browseForFile");
    const canSelectMany = options.canSelectMany === true;
    const canSelectFolders = options.canSelectFolders === true;
    const canSelectFiles = allowsFileSelection(options);
    const extensions = primaryExtensions(options.filters);
    let directory = await initialDirectory(options);
    let showAll = extensions === undefined;
    let showHidden = false;

    while (true) {
        let listed: ListedEntry[];
        try {
            listed = await listDirectory(directory);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Cannot open ${directory}: ${message}`);
            const parent = parentDirectory(directory);
            if (parent === undefined) {
                return undefined;
            }
            directory = parent;
            continue;
        }

        const hasHidden = listed.some((entry) => entry.name.startsWith("."));
        const visible = listed.filter((entry) => showHidden || !entry.name.startsWith("."));
        const items = buildItems(directory, visible, {
            canSelectFolders,
            canSelectFiles,
            extensions,
            showAll,
            showHidden,
            hasHidden,
        });

        const quickPickOptions: vscode.QuickPickOptions = {
            title: dialogTitle(options, extensions, showAll),
            placeHolder: directory,
            ignoreFocusOut: true,
            matchOnDescription: true,
        };
        const picked = canSelectMany
            ? await vscode.window.showQuickPick(items, { ...quickPickOptions, canPickMany: true })
            : await vscode.window.showQuickPick(items, quickPickOptions);
        if (picked === undefined) {
            console.log("< browseForFile: cancelled");
            return undefined;
        }

        const selection = Array.isArray(picked) ? picked : [picked];
        if (selection.length === 1) {
            const only = selection[0];
            if (only.action === "up") {
                directory = parentDirectory(directory) ?? directory;
                continue;
            }
            if (only.action === "toggle-all") {
                showAll = !showAll;
                continue;
            }
            if (only.action === "toggle-hidden") {
                showHidden = !showHidden;
                continue;
            }
            if (only.action === "enter") {
                const chosen = await promptForPath(directory, canSelectFiles, canSelectFolders);
                if (chosen?.kind === "navigate") {
                    directory = chosen.directory;
                } else if (chosen?.kind === "pick") {
                    lastDirectory = path.dirname(chosen.uri.fsPath);
                    return canSelectMany ? [chosen.uri] : chosen.uri;
                }
                continue;
            }
            if (only.action === "dir" && only.fullPath) {
                directory = only.fullPath;
                continue;
            }
            if (only.action === "select-dir") {
                lastDirectory = directory;
                const uri = vscode.Uri.file(directory);
                return canSelectMany ? [uri] : uri;
            }
            if (only.action === "file" && only.fullPath) {
                lastDirectory = directory;
                const uri = vscode.Uri.file(only.fullPath);
                return canSelectMany ? [uri] : uri;
            }
            continue;
        }

        const files = selection.filter((item) => item.action === "file" && item.fullPath);
        if (files.length === 0) {
            continue;
        }
        lastDirectory = directory;
        return files.map((item) => vscode.Uri.file(item.fullPath as string));
    }
}

function allowsFileSelection(options: vscode.OpenDialogOptions): boolean {
    if (options.canSelectFiles) {
        return true;
    }
    return !options.canSelectFiles && !options.canSelectFolders;
}

function primaryExtensions(filters: vscode.OpenDialogOptions["filters"]): string[] | undefined {
    if (!filters) {
        return undefined;
    }
    for (const extensions of Object.values(filters)) {
        const concrete = extensions
            .map((extension) => extension.toLowerCase().replace(/^\./, ""))
            .filter((extension) => extension.length > 0 && extension !== "*");
        if (concrete.length > 0) {
            return concrete;
        }
    }
    return undefined;
}

function dialogTitle(options: vscode.OpenDialogOptions, extensions: string[] | undefined, showAll: boolean): string {
    const base = options.title || options.openLabel || "Select a file";
    if (!extensions || showAll) {
        return base;
    }
    return `${base} (*.${extensions.join(", *.")})`;
}

async function initialDirectory(options: vscode.OpenDialogOptions): Promise<string> {
    const candidates = [lastDirectory, fileUriPath(options.defaultUri), os.homedir(), workspacePath()];
    for (const candidate of candidates) {
        if (!candidate) {
            continue;
        }
        const directory = await directoryFrom(candidate);
        if (directory) {
            return directory;
        }
    }
    return os.homedir();
}

function fileUriPath(uri: vscode.Uri | undefined): string | undefined {
    if (uri?.scheme === "file") {
        return uri.fsPath;
    }
    return undefined;
}

function workspacePath(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

async function directoryFrom(candidate: string): Promise<string | undefined> {
    try {
        const stat = await fs.promises.stat(candidate);
        return stat.isDirectory() ? candidate : path.dirname(candidate);
    } catch {
        return undefined;
    }
}

function parentDirectory(directory: string): string | undefined {
    const parent = path.dirname(directory);
    return parent === directory ? undefined : parent;
}

async function entryKind(dirent: fs.Dirent, fullPath: string): Promise<"dir" | "file" | undefined> {
    if (dirent.isSymbolicLink()) {
        const stat = await fs.promises.stat(fullPath);
        if (stat.isDirectory()) {
            return "dir";
        }
        return stat.isFile() ? "file" : undefined;
    }
    if (dirent.isDirectory()) {
        return "dir";
    }
    return dirent.isFile() ? "file" : undefined;
}

async function listDirectory(directory: string): Promise<ListedEntry[]> {
    const dirents = await fs.promises.readdir(directory, { withFileTypes: true });
    const entries: ListedEntry[] = [];
    for (const dirent of dirents) {
        const fullPath = path.join(directory, dirent.name);
        try {
            const kind = await entryKind(dirent, fullPath);
            if (kind === undefined) {
                continue;
            }
            entries.push({ name: dirent.name, fullPath, isDirectory: kind === "dir" });
        } catch {
            // Skip entries that disappear or cannot be stat'ed.
        }
    }
    entries.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
            return a.isDirectory ? -1 : 1;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
    return entries;
}

function buildItems(directory: string, entries: ListedEntry[], state: {
    canSelectFolders: boolean;
    canSelectFiles: boolean;
    extensions: string[] | undefined;
    showAll: boolean;
    showHidden: boolean;
    hasHidden: boolean;
}): BrowseItem[] {
    const items: BrowseItem[] = [{
        label: "Enter a path...",
        action: "enter",
        iconPath: new vscode.ThemeIcon("edit"),
    }];
    if (state.extensions) {
        items.push({
            label: state.showAll ? `Show only *.${state.extensions.join(", *.")}` : "Show all files",
            action: "toggle-all",
            iconPath: new vscode.ThemeIcon("list-filter"),
        });
    }
    if (state.hasHidden || state.showHidden) {
        items.push({
            label: state.showHidden ? "Hide hidden files" : "Show hidden files",
            action: "toggle-hidden",
            iconPath: new vscode.ThemeIcon(state.showHidden ? "eye-closed" : "eye"),
        });
    }
    if (state.canSelectFolders) {
        items.push({
            label: "Select this folder",
            description: directory,
            action: "select-dir",
            iconPath: new vscode.ThemeIcon("check"),
        });
    }
    if (parentDirectory(directory)) {
        items.push({
            label: "..",
            action: "up",
            iconPath: new vscode.ThemeIcon("arrow-up"),
        });
    }

    for (const entry of entries) {
        if (entry.isDirectory) {
            items.push({
                label: entry.name,
                action: "dir",
                fullPath: entry.fullPath,
                iconPath: new vscode.ThemeIcon("folder"),
            });
            continue;
        }
        if (!state.canSelectFiles) {
            continue;
        }
        if (!state.showAll && state.extensions && !matchesExtension(entry.name, state.extensions)) {
            continue;
        }
        items.push({
            label: entry.name,
            action: "file",
            fullPath: entry.fullPath,
            iconPath: new vscode.ThemeIcon("file"),
        });
    }
    return items;
}

function matchesExtension(name: string, extensions: string[]): boolean {
    const lower = name.toLowerCase();
    return extensions.some((extension) => lower.endsWith(`.${extension}`));
}

type PathChoice =
    | { kind: "navigate"; directory: string }
    | { kind: "pick"; uri: vscode.Uri };

async function promptForPath(directory: string, canSelectFiles: boolean, canSelectFolders: boolean): Promise<PathChoice | undefined> {
    const typed = await vscode.window.showInputBox({
        title: "Enter a path",
        prompt: "File or folder path",
        value: directory.endsWith(path.sep) ? directory : directory + path.sep,
        ignoreFocusOut: true,
    });
    if (typed === undefined || typed.trim().length === 0) {
        return undefined;
    }
    const resolved = path.resolve(directory, typed.trim().replace(/^["']+|["']+$/g, ""));
    let stat: fs.Stats;
    try {
        stat = await fs.promises.stat(resolved);
    } catch {
        vscode.window.showErrorMessage(`Path not found: ${resolved}`);
        return undefined;
    }
    if (stat.isDirectory()) {
        if (canSelectFolders && !canSelectFiles) {
            return { kind: "pick", uri: vscode.Uri.file(resolved) };
        }
        return { kind: "navigate", directory: resolved };
    }
    if (!canSelectFiles) {
        vscode.window.showErrorMessage("Select a folder.");
        return undefined;
    }
    return { kind: "pick", uri: vscode.Uri.file(resolved) };
}
