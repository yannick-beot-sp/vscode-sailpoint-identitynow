import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { ListTenantsTool } from "./tools/ListTenantsTool.js";
import { GetTenantInfoTool } from "./tools/GetTenantInfoTool.js";

@App({
    id: "tenants",
    name: "Tenants",
    tools: [ListTenantsTool, GetTenantInfoTool],
})
export class TenantApp {}
