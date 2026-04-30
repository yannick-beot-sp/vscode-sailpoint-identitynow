import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { ListTenantsTool } from "./tools/ListTenantsTool";
import { GetTenantInfoTool } from "./tools/GetTenantInfoTool";

@App({
    id: "tenants",
    name: "Tenants",
    tools: [ListTenantsTool, GetTenantInfoTool],
})
export class TenantApp {}
