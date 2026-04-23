import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { SearchEntitlementsTool } from "./tools/SearchEntitlementsTool";

@App({
    id: "entitlements",
    name: "Entitlements",
    tools: [SearchEntitlementsTool],
})
export class EntitlementsApp { }
