import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { SearchAccessProfilesTool } from "./tools/SearchAccessProfilesTool";
import { CreateAccessProfileTool } from "./tools/CreateAccessProfileTool";
import { UpdateAccessProfileTool } from "./tools/UpdateAccessProfileTool";

@App({
    id: "accessprofiles",
    name: "Access Profiles",
    tools: [SearchAccessProfilesTool, CreateAccessProfileTool, UpdateAccessProfileTool],
})
export class AccessProfilesApp { }
