import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { ListIdentityProfilesTool } from "./tools/ListIdentityProfilesTool.js";
import { GetIdentityProfileTool } from "./tools/GetIdentityProfileTool.js";
import { SetIdentityProfileMappingTool } from "./tools/SetIdentityProfileMappingTool.js";
import { CreateIdentityProfileTool } from "./tools/CreateIdentityProfileTool.js";

@App({
    id: "identityprofiles",
    name: "Identity Profiles",
    tools: [ListIdentityProfilesTool, GetIdentityProfileTool, SetIdentityProfileMappingTool, CreateIdentityProfileTool],
})
export class IdentityProfilesApp { }
