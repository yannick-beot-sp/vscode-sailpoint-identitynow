import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { ListTransformsTool } from "./tools/ListTransformsTool";
import { GetTransformTool } from "./tools/GetTransformTool";
import { CreateTransformTool } from "./tools/CreateTransformTool";
import { DeleteTransformTool } from "./tools/DeleteTransformTool";
import { UpdateTransformTool } from "./tools/UpdateTransformTool";
import { EvaluateTransformTool } from "./tools/EvaluateTransformTool";

/**
 * FrontMCP application grouping all Transform management tools.
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
})
export class TransformApp { }
