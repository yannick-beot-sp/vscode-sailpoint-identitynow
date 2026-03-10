import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { ListWorkflowsTool } from "./tools/ListWorkflowsTool";
import { GetWorkflowTool } from "./tools/GetWorkflowTool";
import { SetWorkflowStatusTool } from "./tools/SetWorkflowStatusTool";
import { DeleteWorkflowTool } from "./tools/DeleteWorkflowTool";
import { CreateWorkflowTool } from "./tools/CreateWorkflowTool";
import { UpdateWorkflowTool } from "./tools/UpdateWorkflowTool";
import { WorkflowResource } from "./WorkflowResource";

/**
 * FrontMCP application grouping all Workflow management tools and resources.
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
    resources: [
        WorkflowResource,
    ],
})
export class WorkflowApp { }
