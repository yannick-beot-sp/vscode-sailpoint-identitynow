import * as vscode from "vscode";
import { McpServer } from "./McpServer";
import { MCP_NAME } from "./constants";

/**
 * VS Code MCP Server Definition Provider for SailPoint Identity Security Cloud.
 * Exposes the FrontMCP HTTP server to VS Code's Copilot MCP client.
 *
 * Registered via `vscode.lm.registerMcpServerDefinitionProvider`.
 */
export class ISCMcpServerDefinitionProvider
    implements vscode.McpServerDefinitionProvider
{
    constructor(private readonly server: McpServer) {
    }

    async provideMcpServerDefinitions(): Promise<vscode.McpServerDefinition[]> {
        if (!this.server.isRunning() || this.server.port === 0) {
            return [];
        }

        return [
            new vscode.McpHttpServerDefinition(
                MCP_NAME,
                vscode.Uri.parse(`http://localhost:${this.server.port}/mcp`)
            ),
        ];
    }
}
