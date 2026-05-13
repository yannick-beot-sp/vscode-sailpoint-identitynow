import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { ListFormsTool } from "./tools/ListFormsTool";
import { GetFormTool } from "./tools/GetFormTool";
import { CreateFormTool } from "./tools/CreateFormTool";
import { UpdateFormTool } from "./tools/UpdateFormTool";
import { DeleteFormTool } from "./tools/DeleteFormTool";

@App({
    id: "forms",
    name: "Forms",
    tools: [ListFormsTool, GetFormTool, CreateFormTool, UpdateFormTool, DeleteFormTool],
})
export class FormsApp { }
