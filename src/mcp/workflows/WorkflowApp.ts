import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { ListWorkflowsTool } from "./tools/ListWorkflowsTool.js";
import { GetWorkflowTool } from "./tools/GetWorkflowTool.js";
import { SetWorkflowStatusTool } from "./tools/SetWorkflowStatusTool.js";
import { DeleteWorkflowTool } from "./tools/DeleteWorkflowTool.js";
import { CreateWorkflowTool } from "./tools/CreateWorkflowTool.js";
import { UpdateWorkflowTool } from "./tools/UpdateWorkflowTool.js";
import { TestWorkflowTool } from "./tools/TestWorkflowTool.js";
import { WorkflowResource } from "./WorkflowResource.js";

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
        TestWorkflowTool,
    ],
    resources: [
        WorkflowResource,
    ],
})
export class WorkflowApp { }
