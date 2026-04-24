import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { SearchAccessProfilesTool } from "./tools/SearchAccessProfilesTool";
import { CreateAccessProfileTool } from "./tools/CreateAccessProfileTool";

@App({
    id: "accessprofiles",
    name: "Access Profiles",
    tools: [SearchAccessProfilesTool, CreateAccessProfileTool],
})
export class AccessProfilesApp { }
