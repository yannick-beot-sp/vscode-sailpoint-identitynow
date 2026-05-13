import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { ListIdentityProfilesTool } from "./tools/ListIdentityProfilesTool";
import { GetIdentityProfileTool } from "./tools/GetIdentityProfileTool";
import { SetIdentityProfileMappingTool } from "./tools/SetIdentityProfileMappingTool";
import { CreateIdentityProfileTool } from "./tools/CreateIdentityProfileTool";

@App({
    id: "identityprofiles",
    name: "Identity Profiles",
    tools: [ListIdentityProfilesTool, GetIdentityProfileTool, SetIdentityProfileMappingTool, CreateIdentityProfileTool],
})
export class IdentityProfilesApp { }
