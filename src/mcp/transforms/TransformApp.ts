import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { ListTransformsTool } from "./tools/ListTransformsTool.js";
import { GetTransformTool } from "./tools/GetTransformTool.js";
import { CreateTransformTool } from "./tools/CreateTransformTool.js";
import { DeleteTransformTool } from "./tools/DeleteTransformTool.js";
import { UpdateTransformTool } from "./tools/UpdateTransformTool.js";
import { EvaluateTransformTool } from "./tools/EvaluateTransformTool.js";
import { TransformResource } from "./TransformResource.js";

/**
 * FrontMCP application grouping all Transform management tools and resources.
 */
@App({
    id: "transforms",
    name: "Transforms",
    tools: [
        ListTransformsTool,
        GetTransformTool,
        CreateTransformTool,
        UpdateTransformTool,
        DeleteTransformTool,
        EvaluateTransformTool,
    ],
    resources: [
        TransformResource,
    ],
})
export class TransformApp { }
