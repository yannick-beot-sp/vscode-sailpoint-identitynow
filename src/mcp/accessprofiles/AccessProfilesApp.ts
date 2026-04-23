import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { SearchAccessProfilesTool } from "./tools/SearchAccessProfilesTool";

@App({
    id: "accessprofiles",
    name: "Access Profiles",
    tools: [SearchAccessProfilesTool],
})
export class AccessProfilesApp { }
