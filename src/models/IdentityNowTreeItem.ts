import {
	ExtensionContext,
	ThemeIcon,
	TreeItem,
	TreeItemCollapsibleState,
	TreeItemLabel,
	Uri,
} from "vscode";
import { getIdByUri, getPathByUri, getResourceUri } from "../utils/UriUtils";
import * as commands from "../commands/constants";
import path = require("path");
import { IdentityNowClient } from "../services/IdentityNowClient";
import { compareByName, compareByPriority } from "../utils";

/**
 * Base class to expose getChildren and updateIcon methods
 */
export abstract class BaseTreeItem extends TreeItem {

	constructor(
		label: string | TreeItemLabel,
		public readonly tenantId: string,
		public readonly tenantName: string,
		public readonly tenantDisplayName: string,
		collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None,
	) {
		super(label, collapsibleState);
	}

	abstract getChildren(): Promise<BaseTreeItem[]>;

	updateIcon(context: ExtensionContext) {
		// Do nothing by default
	}
}

/**
 * Containers for tenants
 */
export class TenantTreeItem extends BaseTreeItem {
	constructor(
		tenantLabel: string,
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super(tenantLabel,
			tenantId,
			tenantName,
			tenantDisplayName,
			TreeItemCollapsibleState.Collapsed);
		this.tooltip = tenantName;
	}
	iconPath = new ThemeIcon("organization");
	contextValue = "tenant";

	getChildren(): Promise<BaseTreeItem[]> {
		const results: BaseTreeItem[] = [];
		results.push(new SourcesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new TransformsTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new WorkflowsTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new RulesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new ServiceDesksTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new IdentityProfilesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		return new Promise((resolve) => resolve(results));
	}
}

/**
 * Abstract class to implement a "folder" below the tenant node
 */
export abstract class FolderTreeItem extends BaseTreeItem {
	constructor(
		label: string,
		public readonly contextValue: string,
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		public readonly parentUri?: Uri
	) {
		super(label,
			tenantId,
			tenantName,
			tenantDisplayName,
			TreeItemCollapsibleState.Collapsed);
	}

	updateIcon(): void {
		if (this.collapsibleState === TreeItemCollapsibleState.Expanded) {
			this.iconPath = new ThemeIcon("folder-opened");
		} else {
			this.iconPath = new ThemeIcon("folder");
		}
	}
}

/**
 * Containers for sources
 */
export class SourcesTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Sources", "sources", tenantId, tenantName, tenantDisplayName);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const results: BaseTreeItem[] = [];
		const client = new IdentityNowClient(this.tenantId, this.tenantName);
		const sources = await client.getSources();
		if (sources !== undefined && sources instanceof Array) {
			for (let source of sources) {
				results.push(
					new SourceTreeItem(
						this.tenantId,
						this.tenantName,
						this.tenantDisplayName,
						source.name,
						source.id,
						source.connectorAttributes.cloudExternalId,
						source.type
					)
				);
			}
		}
		return results;
	}
}
/**
 * Containers for Identity Profiles
 */
export class IdentityProfilesTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Identity Profiles", "identity-profiles", tenantId, tenantName, tenantDisplayName);
	}

	private criteria = IdentityProfileSorting.name;

	public async sortBy(criteria: IdentityProfileSorting) {
		this.criteria = criteria;
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const results: BaseTreeItem[] = [];
		const client = new IdentityNowClient(this.tenantId, this.tenantName);
		let identityProfiles = await client.getIdentityProfiles();
		if (this.criteria === IdentityProfileSorting.name) {
			identityProfiles = identityProfiles.sort(compareByName);
		} else {
			identityProfiles = identityProfiles.sort(compareByPriority);
		}
		const identityProfileItems = identityProfiles.map(
			(w) =>
				new IdentityProfileTreeItem(
					this.tenantId,
					this.tenantName,
					this.tenantDisplayName,
					`${w.name} (${w.authoritativeSource.name.replace(
						/ \[source.*\]/,
						""
					)})`,
					w.id
				)
		);
		return identityProfileItems;
	}
}

export class IdentityNowResourceTreeItem extends BaseTreeItem {
	public readonly uri: Uri;
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		resourceType: string,
		//public readonly
		id: string,
		collapsible: TreeItemCollapsibleState = TreeItemCollapsibleState.None,
		public readonly subResourceType: string = "",
		public readonly subId: string = "",
		public readonly beta = false
	) {
		// By default, a IdentityNowResourceTreeItem will be a leaf, meaning that there will not be any childs
		super(label, tenantId, tenantName, tenantDisplayName, collapsible);
		this.id = id;
		this.uri = getResourceUri(tenantName, resourceType, id, label, beta);
		if (subResourceType && subId) {
			this.uri = this.uri.with({
				path: path.posix.join(
					getPathByUri(this.uri) || "",
					subResourceType,
					subId,
					label
				),
			});
			this.id = subId;
		}
	}

	command = {
		title: "open",
		command: commands.OPEN_RESOURCE,
		arguments: [this],
	};

	getChildren(): Promise<BaseTreeItem[]> {
		throw new Error("Method not implemented.");
	}
}

export class SourceTreeItem extends IdentityNowResourceTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string,
		public readonly ccId: number,
		public readonly type: string
	) {
		super(
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			"sources",
			id,
			TreeItemCollapsibleState.Collapsed
		);

		this.contextValue = type.replace(" ", "") + "source";
	}



	getChildren(): Promise<BaseTreeItem[]> {
		const results: BaseTreeItem[] = [];
		results.push(new SchemasTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName, this.uri));
		results.push(
			new ProvisioningPoliciesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName, this.uri)
		);
		return new Promise((resolve) => resolve(results));
	}

	updateIcon(context: ExtensionContext): void {
		this.iconPath = {
			light: context.asAbsolutePath("resources/light/source.svg"),
			dark: context.asAbsolutePath("resources/dark/source.svg"),
		};
	}
}

/**
 * Containers for transforms
 */
export class TransformsTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Transforms", "transforms", tenantId, tenantName, tenantDisplayName);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		let results: BaseTreeItem[] = [];
		const client = new IdentityNowClient(this.tenantId, this.tenantName);
		const transforms = await client.getTransforms();
		if (transforms !== undefined && transforms instanceof Array) {
			results = transforms.map((element) =>
				new TransformTreeItem(
					this.tenantId,
					this.tenantName,
					this.tenantDisplayName,
					element.name,
					element.id
				)
			);
		}
		return results;
	}
}

export class TransformTreeItem extends IdentityNowResourceTreeItem {
	contextValue = "transform";

	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string) {
		super(
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			"transforms",
			id
		);
	}

	updateIcon(context: ExtensionContext): void {
		this.iconPath = {
			light: context.asAbsolutePath("resources/light/transform.svg"),
			dark: context.asAbsolutePath("resources/dark/transform.svg"),
		};
	}
}

export class SchemasTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		parentUri: Uri
	) {
		super("Schemas", "schemas", tenantId, tenantName, tenantDisplayName, parentUri);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		let results: BaseTreeItem[] = [];

		const client = new IdentityNowClient(this.tenantId, this.tenantName);
		const schemaPath = getPathByUri(this.parentUri) + "/schemas";
		const schemas = await client.getResource(schemaPath);
		if (schemas !== undefined && schemas instanceof Array) {
			results = schemas
				.sort(compareByName)
				.map((element) =>
					new SchemaTreeItem(
						this.tenantId,
						this.tenantName,
						this.tenantDisplayName,
						element.name,
						getIdByUri(this.parentUri) || "",
						element.id
					)
				);
		}
		return results;
	}
}

export class SchemaTreeItem extends IdentityNowResourceTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string,
		subId: string
	) {
		super(
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			"sources",
			id,
			TreeItemCollapsibleState.None,
			"schemas",
			subId
		);
	}

	iconPath = new ThemeIcon("symbol-class");

	contextValue = "schema";
}

/**
 * Containers for Provisioning policies
 */
export class ProvisioningPoliciesTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		parentUri: Uri
	) {
		super("Provisioning Policies", "provisioning-policies", tenantId, tenantName, tenantDisplayName, parentUri);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		let results: BaseTreeItem[] = [];
		const client = new IdentityNowClient(this.tenantId, this.tenantName);
		const provisioningPoliciesPath =
			getPathByUri(this.parentUri) + "/provisioning-policies";
		const provisioningPolicies = await client.getResource(
			provisioningPoliciesPath
		);
		if (
			provisioningPolicies !== undefined &&
			provisioningPolicies instanceof Array
		) {
			results = provisioningPolicies
				.sort(compareByName)
				.map(
					(provisioningPolicy) =>
						new ProvisioningPolicyTreeItem(
							this.tenantId,
							this.tenantName,
							this.tenantDisplayName,
							provisioningPolicy.name,
							getIdByUri(this.parentUri) || "",
							provisioningPolicy.usageType
						)
				);
		}
		return results;
	}
}

export class ProvisioningPolicyTreeItem extends IdentityNowResourceTreeItem {
	contextValue = "provisioning-policy";

	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string,
		subId: string
	) {
		// For ProvisioningPolicyTreeItem, subId is equal to CREATE, so not unique.
		super(
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			"sources",
			id + "/provisioning-policies/" + subId
		);
	}

	updateIcon(context: ExtensionContext): void {
		this.iconPath = {
			light: context.asAbsolutePath("resources/light/provisioning-policy.svg"),
			dark: context.asAbsolutePath("resources/dark/provisioning-policy.svg"),
		};
	}
}

/**
 * Containers for workflows
 */
export class WorkflowsTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Workflows", "workflows", tenantId, tenantName, tenantDisplayName);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const client = new IdentityNowClient(this.tenantId, this.tenantName);
		const workflows = await client.getWorflows();
		const workflowTreeItems = workflows.map(
			(w) =>
				new WorkflowTreeItem(
					this.tenantId,
					this.tenantName,
					this.tenantDisplayName,
					w.name,
					w.id,
					w.enabled
				)
		);
		return workflowTreeItems;
	}
}

export class WorkflowTreeItem extends IdentityNowResourceTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string,
		public enabled: boolean
	) {
		super(
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			"workflows",
			id,
			TreeItemCollapsibleState.None,
			undefined,
			undefined,
			true
		);
		this.contextValue = enabled ? "enabledWorkflow" : "disabledWorkflow";
	}

	updateIcon(context: ExtensionContext): void {
		if (this.enabled) {
			this.iconPath = {
				light: context.asAbsolutePath("resources/light/workflow-enabled.svg"),
				dark: context.asAbsolutePath("resources/dark/workflow-enabled.svg"),
			};
		} else {
			this.iconPath = {
				light: context.asAbsolutePath("resources/light/workflow-disabled.svg"),
				dark: context.asAbsolutePath("resources/dark/workflow-disabled.svg"),
			};
		}
	}
}

/**
 * Containers for workflows
 */
export class RulesTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Rules", "connector-rules", tenantId, tenantName, tenantDisplayName);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const client = new IdentityNowClient(this.tenantId, this.tenantName);
		const rules = await client.getConnectorRules();
		const ruleTreeItems = rules.map(
			(r) => new RuleTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName, r.name, r.id)
		);
		return ruleTreeItems;
	}
}

export class RuleTreeItem extends IdentityNowResourceTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string) {
		super(
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			"connector-rules",
			id,
			TreeItemCollapsibleState.None,
			undefined,
			undefined,
			true
		);
	}

	contextValue = "connector-rule";
	iconPath = new ThemeIcon("file-code");
}

export class IdentityProfileTreeItem extends IdentityNowResourceTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string
	) {
		super(
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			"identity-profiles",
			id,
			TreeItemCollapsibleState.Collapsed
		);
	}

	contextValue = "identity-profile";

	iconPath = new ThemeIcon("person-add");

	async getChildren(): Promise<BaseTreeItem[]> {
		const results: BaseTreeItem[] = [];
		const client = new IdentityNowClient(this.tenantId, this.tenantName);
		const lifecycleStates = await client.getLifecycleStates(this.id as string);

		const lifecycleStateItems = lifecycleStates.map(
			(w) =>
				new LifecycleStateTreeItem(
					this.tenantId,
					this.tenantName,
					this.tenantDisplayName,
					w.name,
					this.id as string,
					w.id
				)
		);
		return lifecycleStateItems;
	}
}

export enum IdentityProfileSorting {
	name,
	priority,
}

export class LifecycleStateTreeItem extends IdentityNowResourceTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string,
		subId: string
	) {
		super(
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			"identity-profiles",
			id,
			TreeItemCollapsibleState.None,
			"lifecycle-states",
			subId
		);
	}

	iconPath = new ThemeIcon("activate-breakpoints");

	contextValue = "lifecycle-state";
}

/**
 * Containers for transforms
 */
export class ServiceDesksTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Service Desk", "service-desk-integrations", tenantId, tenantName, tenantDisplayName);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const results: BaseTreeItem[] = [];
		const client = new IdentityNowClient(this.tenantId, this.tenantName);
		const serviceDesks = await client.getServiceDesks();
		const serviceDeskItems = serviceDesks.map(
			(w) =>
				new ServiceDeskTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName, w.name, w.id)
		);
		return serviceDeskItems;
	}
}

export class ServiceDeskTreeItem extends IdentityNowResourceTreeItem {
	contextValue = "service-desk-integration";

	constructor(tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string) {
		super(
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			"service-desk-integrations",
			id
		);
	}

	iconPath = new ThemeIcon("gear");
}
