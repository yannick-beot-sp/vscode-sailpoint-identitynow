import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { ListFormsTool } from "./tools/ListFormsTool.js";
import { GetFormTool } from "./tools/GetFormTool.js";
import { CreateFormTool } from "./tools/CreateFormTool.js";
import { UpdateFormTool } from "./tools/UpdateFormTool.js";
import { DeleteFormTool } from "./tools/DeleteFormTool.js";

@App({
    id: "forms",
    name: "Forms",
    tools: [ListFormsTool, GetFormTool, CreateFormTool, UpdateFormTool, DeleteFormTool],
})
export class FormsApp { }
