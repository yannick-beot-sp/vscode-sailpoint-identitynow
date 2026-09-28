/**
 * vscode-mock.ts
 *
 * Minimal stub for the `vscode` module, used by Jest via moduleNameMapper.
 * Exposes only the surface used by the code under test:
 *  - window.showInputBox / showErrorMessage / …
 *  - workspace.getConfiguration  (getPreferredPort / isMcpEnabled)
 *  - workspace.onDidChangeConfiguration  (McpServerManager constructor)
 *  - EventEmitter            (McpServerManager.didChangeEmitter)
 *  - lm.registerMcpServerDefinitionProvider  (McpServerManager.registerServer)
 */

const TEST_PORT = parseInt(process.env.MCP_TEST_PORT ?? "47337", 10);

const vscodeMock = {
    window: {
        showInputBox: async (_options: unknown) => undefined,
        showQuickPick: async (_items: unknown, _options?: unknown) => undefined,
        showErrorMessage: async (_message: string, ..._items: string[]) => undefined,
        showInformationMessage: async (_message: string, ..._items: string[]) => undefined,
        showWarningMessage: async (_message: string, ..._items: string[]) => undefined,
        showTextDocument: async (_document: unknown, _options?: unknown) => undefined,
        withProgress: async (_options: unknown, task: (progress: unknown, token: unknown) => Promise<unknown>) =>
            task(
                { report: () => undefined },
                { isCancellationRequested: false, onCancellationRequested: () => ({ dispose() { /* no-op */ } }) }
            ),
    },

    ProgressLocation: {
        SourceControl: 1,
        Window: 10,
        Notification: 15,
    },

    TreeItem: class TreeItem {
        constructor(public label?: unknown, public collapsibleState?: number) { }
    },

    TreeItemCollapsibleState: {
        None: 0,
        Collapsed: 1,
        Expanded: 2,
    },

    ThemeIcon: class ThemeIcon {
        constructor(public id: string) { }
    },

    workspace: {
        getConfiguration: (_section?: string) => ({
            get: (key: string, defaultValue?: unknown) => {
                // Return the fixed test port so McpServerManager skips findFreePort()
                if (key === "mCP.port") { return TEST_PORT; }
                // Keep MCP disabled so initialize() is a no-op in production paths
                if (key === "mCP.enabled") { return false; }
                return defaultValue;
            },
            update: async (_key: string, _value: unknown) => { /* no-op */ },
            has: (_key: string) => false,
            inspect: (_key: string) => undefined,
        }),
        onDidChangeConfiguration: (_listener: unknown) => ({ dispose: () => { /* no-op */ } }),
        openTextDocument: async (_uri: unknown) => ({ languageId: "plaintext" }),
        workspaceFolders: undefined,
    },

    languages: {
        getLanguages: async () => ["csv", "json", "plaintext"],
        setTextDocumentLanguage: async (document: unknown, _languageId: string) => document,
    },

    /** Minimal EventEmitter used as a class (new vscode.EventEmitter<T>()) */
    EventEmitter: class VscodeEventEmitter {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        event(_listener: unknown) { return { dispose: () => { /* no-op */ } }; }
        fire(_data?: unknown) { /* no-op */ }
        dispose() { /* no-op */ }
    },

    lm: {
        registerMcpServerDefinitionProvider: (_id: string, _provider: unknown) => ({
            dispose: () => { /* no-op */ },
        }),
    },

    Uri: {
        file: (path: string) => ({ fsPath: path }),
        parse: (str: string) => ({ fsPath: str }),
    },

    extensions: {
        getExtension: (_id: string) => ({ packageJSON: { version: "0.0.0-test" } }),
    },

    version: "1.0.0-test",
};

// Export for Jest's moduleNameMapper (when this file is used as the vscode module stub).
export = vscodeMock;
