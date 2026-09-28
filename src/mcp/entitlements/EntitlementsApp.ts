import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { SearchEntitlementsTool } from "./tools/SearchEntitlementsTool.js";

@App({
    id: "entitlements",
    name: "Entitlements",
    tools: [SearchEntitlementsTool],
})
export class EntitlementsApp { }
