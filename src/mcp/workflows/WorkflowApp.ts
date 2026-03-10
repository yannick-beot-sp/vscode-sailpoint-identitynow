import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { ListWorkflowsTool } from "./tools/ListWorkflowsTool";
import { GetWorkflowTool } from "./tools/GetWorkflowTool";
import { SetWorkflowStatusTool } from "./tools/SetWorkflowStatusTool";
import { DeleteWorkflowTool } from "./tools/DeleteWorkflowTool";
import { CreateWorkflowTool } from "./tools/CreateWorkflowTool";
import { UpdateWorkflowTool } from "./tools/UpdateWorkflowTool";

/**
 * FrontMCP application grouping all Workflow management tools.
 */
@App({
    id: "workflows",
    name: "Workflows",
    tools: [
        ListWorkflowsTool,
        GetWorkflowTool,
        SetWorkflowStatusTool,
        CreateWorkflowTool,
        UpdateWorkflowTool,
        DeleteWorkflowTool,
    ],
})
export class WorkflowApp { }
