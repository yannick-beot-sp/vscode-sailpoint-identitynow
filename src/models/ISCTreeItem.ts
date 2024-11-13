import * as vscode from "vscode";
import * as path from 'path';
import { ISCClient, TOTAL_COUNT_HEADER } from "../services/ISCClient";
import { getIdByUri, getPathByUri, getResourceUri } from "../utils/UriUtils";
import { compareByLabel, compareByName, compareByPriority } from "../utils";
import { AxiosHeaders, AxiosResponse } from "axios";
import { getConfigNumber } from '../utils/configurationUtils';
import * as commands from "../commands/constants";
import * as configuration from '../configurationConstants';
import { escapeFilter, isEmpty, isNotEmpty } from "../utils/stringUtils";
import { TenantService } from "../services/TenantService";


/**
 * Base class to expose getChildren and updateIcon methods
 */
export abstract class BaseTreeItem extends vscode.TreeItem {

	constructor(
		label: string | vscode.TreeItemLabel,
		public readonly tenantId: string,
		public readonly tenantName: string,
		public readonly tenantDisplayName: string,
		collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
	) {
		super(label, collapsibleState);
	}

	abstract getChildren(): Promise<BaseTreeItem[]>;

	reset(): void {
		// Do nothing by default
	}

	updateIcon(context: vscode.ExtensionContext) {
		// Do nothing by default
	}

	get computedContextValue(): string {
		return this.contextValue;
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
		private readonly tenantService: TenantService
	) {
		super(tenantLabel,
			tenantId,
			tenantName,
			tenantDisplayName,
			vscode.TreeItemCollapsibleState.Collapsed);
		this.tooltip = tenantName;
	}
	iconPath = new vscode.ThemeIcon("organization");
	contextValue = "tenant";

	async getChildren(): Promise<BaseTreeItem[]> {
		const results: BaseTreeItem[] = [];
		results.push(new SourcesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new TransformsTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new WorkflowsTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new RulesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new ServiceDesksTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new IdentityProfilesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new AccessProfilesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new RolesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new FormsTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new SearchAttributesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new IdentityAttributesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new IdentitiesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new ApplicationsTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));
		results.push(new CampaignsTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName));

		return results
	}

	get computedContextValue() {
		const tenantInfo = this.tenantService.getTenant(this.tenantId);
		return tenantInfo && tenantInfo.readOnly ? "tenantReadOnly" : "tenantWritable";
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
		public readonly parentUri?: vscode.Uri
	) {
		super(label,
			tenantId,
			tenantName,
			tenantDisplayName,
			vscode.TreeItemCollapsibleState.Collapsed);
	}

	updateIcon(): void {
		if (this.collapsibleState === vscode.TreeItemCollapsibleState.Expanded) {
			this.iconPath = new vscode.ThemeIcon("folder-opened");
		} else {
			this.iconPath = new vscode.ThemeIcon("folder");
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
		let results: BaseTreeItem[] = [];
		const client = new ISCClient(this.tenantId, this.tenantName);
		const sources = await client.getSources();
		if (sources !== undefined && sources instanceof Array) {
			results = sources
				.filter(source => source.name && source.id && source.type) // filter any source that does not have name or id
				.map(source => new SourceTreeItem(
					this.tenantId,
					this.tenantName,
					this.tenantDisplayName,
					source.name,
					source.id,
					source.type,
					source.connectorAttributes["delimiter"],
				));
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
		const client = new ISCClient(this.tenantId, this.tenantName);
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

export class ISCResourceTreeItem extends BaseTreeItem {
	public readonly uri: vscode.Uri;
	public readonly resourceId: string;
	/**
	 * Constructor
	 * @param tenantId 
	 * @param tenantName 
	 * @param tenantDisplayName 
	 * @param label Label of the node
	 * @param resourceType type of resource, used to build the URI
	 * @param id id of node in the tree. Must be globally unique in the tree. If resourceId is not defined, id is used to build the URI
	 * @param collapsible define if the node is collapsible, collapsed or not. By defaut, not collapsible
	 * @param subResourceType 
	 * @param subId 
	 * @param beta true if relying on beta API
	 * @param resourceId Id of the object if the id is globally unique. Used in the URI.
	 */
	constructor(options: {
		tenantId: string;
		tenantName: string;
		tenantDisplayName: string;
		label: string;
		resourceType: string;
		id: string;
		resourceId?: string,
		beta?: boolean;
		collapsible?: vscode.TreeItemCollapsibleState;
		parentId?: string;
		subId?: string;
		subResourceType?: string;
		resourceSubId?: string,
	}) {

		options = {
			...{
				// By default, a ISCResourceTreeItem will be a leaf, meaning that there will not be any childs
				collapsible: vscode.TreeItemCollapsibleState.None,
				beta: false // v3 by default
			},
			...options
		}
		super(options.label, options.tenantId, options.tenantName, options.tenantDisplayName, options.collapsible);
		this.id = options.id;

		if (options.subResourceType && options.subId) {
			this.uri = getResourceUri(options.tenantName,
				options.resourceType,
				options.parentId,
				options.label, options.beta)
			this.uri = this.uri.with({
				path: path.posix.join(
					getPathByUri(this.uri) || "",
					options.subResourceType,
					options.resourceSubId ?? options.subId,
					options.label
				),
			})
		} else {
			this.uri = getResourceUri(options.tenantName,
				options.resourceType,
				options.resourceId ?? options.id,
				options.label, options.beta);
			this.resourceId = options.resourceId ?? options.id
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

export class SourceTreeItem extends ISCResourceTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string,
		public readonly type: string,
		public readonly delimiter: string,
	) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "sources",
			id,
			collapsible: vscode.TreeItemCollapsibleState.Collapsed
		})
		this.contextValue = type.replaceAll(" ", "") + "source";
	}



	getChildren(): Promise<BaseTreeItem[]> {
		const results: BaseTreeItem[] = [];
		results.push(new SchemasTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName, this.uri));
		results.push(
			new ProvisioningPoliciesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName, this.uri)
		);
		return new Promise((resolve) => resolve(results));
	}

	updateIcon(context: vscode.ExtensionContext): void {
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
		const client = new ISCClient(this.tenantId, this.tenantName);
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

export class TransformTreeItem extends ISCResourceTreeItem {
	contextValue = "transform";

	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "transforms",
			id
		})
	}

	updateIcon(context: vscode.ExtensionContext): void {
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
		parentUri: vscode.Uri
	) {
		super("Schemas", "schemas", tenantId, tenantName, tenantDisplayName, parentUri);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		let results: BaseTreeItem[] = [];

		const client = new ISCClient(this.tenantId, this.tenantName);
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

export class SchemaTreeItem extends ISCResourceTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string,
		schemaId: string
	) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "sources",
			id: schemaId,
			parentId: id,
			subResourceType: "schemas",
			subId: schemaId
		})
	}

	iconPath = new vscode.ThemeIcon("symbol-class");

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
		parentUri: vscode.Uri
	) {
		super("Provisioning Policies", "provisioning-policies", tenantId, tenantName, tenantDisplayName, parentUri);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		let results: BaseTreeItem[] = [];
		const client = new ISCClient(this.tenantId, this.tenantName);
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
				.map((provisioningPolicy) => new ProvisioningPolicyTreeItem(
					this.tenantId,
					this.tenantName,
					this.tenantDisplayName,
					provisioningPolicy.name,
					getIdByUri(this.parentUri) || "",
					provisioningPolicy.usageType
				));
		}
		return results;
	}
}

export class ProvisioningPolicyTreeItem extends ISCResourceTreeItem {
	contextValue = "provisioning-policy";

	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		parentId: string,
		provisioningPolicyName: string
	) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "sources",
			id: `${parentId}/provisioning-policies/${provisioningPolicyName}`,
			parentId,
			subResourceType: "provisioning-policies",
			subId: provisioningPolicyName,
		})
	}

	updateIcon(context: vscode.ExtensionContext): void {
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
		const client = new ISCClient(this.tenantId, this.tenantName);
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

export class WorkflowTreeItem extends ISCResourceTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string,
		public enabled: boolean
	) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "workflows",
			id
		})
	}

	contextValue = "workflow";

	get computedContextValue() {
		return this.enabled ? "enabledWorkflow" : "disabledWorkflow";
	}

	updateIcon(context: vscode.ExtensionContext): void {
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
		const client = new ISCClient(this.tenantId, this.tenantName);
		const rules = await client.getConnectorRules();
		const ruleTreeItems = rules.map(
			(r) => new RuleTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName, r.name, r.id)
		);
		return ruleTreeItems;
	}
}

export class RuleTreeItem extends ISCResourceTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "connector-rules",
			id,
			beta: true
		})
	}

	contextValue = "connector-rule";
	iconPath = new vscode.ThemeIcon("file-code");
}

export class IdentityProfileTreeItem extends ISCResourceTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string
	) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "identity-profiles",
			id,
			collapsible: vscode.TreeItemCollapsibleState.Collapsed
		})
	}

	contextValue = "identity-profile";

	iconPath = new vscode.ThemeIcon("person-add");

	async getChildren(): Promise<BaseTreeItem[]> {
		const client = new ISCClient(this.tenantId, this.tenantName);
		const lifecycleStates = await client.getLifecycleStates(this.id);

		const lifecycleStateItems = lifecycleStates.map((w) => new LifecycleStateTreeItem(
			this.tenantId,
			this.tenantName,
			this.tenantDisplayName,
			w.name,
			this.id as string,
			w.id
		))
		return lifecycleStateItems;
	}
}

export enum IdentityProfileSorting {
	name,
	priority,
}

export class LifecycleStateTreeItem extends ISCResourceTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		parentId: string,
		lifecycleStateId: string
	) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "identity-profiles",
			id: lifecycleStateId,
			parentId,
			subResourceType: "lifecycle-states",
			subId: lifecycleStateId
		})
	}

	iconPath = new vscode.ThemeIcon("activate-breakpoints");

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
		const client = new ISCClient(this.tenantId, this.tenantName);
		const serviceDesks = await client.getServiceDesks();
		const serviceDeskItems = serviceDesks.map((w) =>
			new ServiceDeskTreeItem(this.tenantId,
				this.tenantName,
				this.tenantDisplayName,
				w.name,
				w.id,
				w.type
			)
		);
		return serviceDeskItems;
	}
}

export class ServiceDeskTreeItem extends ISCResourceTreeItem {
	contextValue = "service-desk-integration";

	constructor(tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string,
		public readonly type: string) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "service-desk-integrations",
			id
		})
	}

	iconPath = new vscode.ThemeIcon("gear");
}

export interface PageableNode {
	currentOffset: number
	limit?: number;
	readonly hasMore: boolean;
	filters?: string | undefined;
	filterType: FilterType;
	children: BaseTreeItem[];
	loadMore(): Promise<void>;
}

interface Document {
	/**
	 * The unique ID of the referenced object.
	 */
	id: string;
	/**
	 * The human readable name of the referenced object.
	 */
	name: string;
}

export enum FilterType {
	api = "API",
	search = "Search"
}

/**
 * Contains the roles in tree view
 */
export abstract class PageableFolderTreeItem<T> extends FolderTreeItem implements PageableNode {
	currentOffset = 0;
	filters?: string = "";
	filterType = FilterType.api;
	children: BaseTreeItem[] = [];
	client: ISCClient;

	protected _total = 0;

	/**
	 * 
	 * @param label 
	 * @param contextValue 
	 * @param tenantId 
	 * @param tenantName 
	 * @param tenantDisplayName 
	 * @param noEntries Message to be displayed if the search does not return anything, or if a search needs to be run (cf. identities)
	 * @param mapper 
	 */
	constructor(
		label: string,
		contextValue: string,
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		protected noEntries: string,
		private readonly mapper: (x: any) => BaseTreeItem,
	) {
		super(label, contextValue, tenantId, tenantName, tenantDisplayName);
		this.client = new ISCClient(this.tenantId, this.tenantName);
	}

	reset(): void {
		this.currentOffset = 0;
		this._total = 0;
		this.children = [];
	}

	protected abstract loadNext(): Promise<AxiosResponse<T[]>>;

	async loadMore(): Promise<void> {
		await vscode.window.withProgress({
			location: {
				viewId: commands.TREE_VIEW
			}
		}, async () => {
			const limit = getConfigNumber(configuration.TREEVIEW_PAGINATION).valueOf();
			if (this.children.length > 0) {
				// remove "Load More" or Message node 
				this.children.pop();
			}

			const response = await this.loadNext();

			if (this._total === 0) {
				this._total = Number(response.headers[TOTAL_COUNT_HEADER]);
			}

			if (this._total === 0) {
				this.children = [new MessageNode(this.noEntries)];
				return;
			}

			const results: BaseTreeItem[] = response.data.map(this.mapper);
			this.children.push(...results);

			if (this.hasMore) {
				this.children.push(new LoadMoreNode(
					this.tenantId,
					this.tenantName,
					this.tenantDisplayName,
					this
				));
				this.currentOffset += limit;
			}
		})
	}

	get hasMore(): boolean {
		return this._total > this.children.length;
	}


	get isFiltered(): boolean {
		return isNotEmpty(this.filters);
	}

	get computedContextValue() {
		return this.contextValue + (this.isFiltered ? "Filtered" : "Unfiltered");
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		if (this.children.length === 0) {
			await this.loadMore();
		}
		return this.children;
	}
}

/**
 * Contains the access profiles in tree view
 */
export class AccessProfilesTreeItem extends PageableFolderTreeItem<Document> {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Access Profiles", "access-profiles", tenantId, tenantName, tenantDisplayName, 'No access profile found',
			(role => new AccessProfileTreeItem(
				tenantId,
				tenantName,
				tenantDisplayName,
				role.name,
				role.id
			))
		);
	}

	protected async loadNext(): Promise<AxiosResponse<Document[]>> {
		const limit = getConfigNumber(configuration.TREEVIEW_PAGINATION).valueOf();
		if (this.filterType === FilterType.api) {
			return await this.client.getAccessProfiles({
				filters: this.filters,
				limit,
				offset: this.currentOffset,
				count: (this._total === 0)
			}) as AxiosResponse<Document[]>;
		}
		const filters = isEmpty(this.filters) ? "*" : this.filters;
		return await this.client.paginatedSearchAccessProfiles(
			filters,
			limit,
			this.currentOffset,
			(this._total === 0)
		) as AxiosResponse<Document[]>;
	}
}

/**
 * Represents a single access profile.
 */
export class AccessProfileTreeItem extends ISCResourceTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "access-profiles",
			id
		})
	}

	contextValue = "access-profile";
	iconPath = new vscode.ThemeIcon("archive");
}

/**
 * Contains the roles in tree view
 */
export class RolesTreeItem extends PageableFolderTreeItem<Document> {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Roles", "roles", tenantId, tenantName, tenantDisplayName, 'No role found',
			(role => new RoleTreeItem(
				tenantId,
				tenantName,
				tenantDisplayName,
				role.name,
				role.id
			))
		);
	}

	protected async loadNext(): Promise<AxiosResponse<Document[]>> {
		const limit = getConfigNumber(configuration.TREEVIEW_PAGINATION).valueOf();
		if (this.filterType === FilterType.api) {
			return await this.client.getRoles({
				filters: this.filters,
				limit,
				offset: this.currentOffset,
				count: (this._total === 0)
			}) as AxiosResponse<Document[]>;
		} else {
			const filters = isEmpty(this.filters) ? "*" : this.filters;
			return await this.client.paginatedSearchRoles(
				filters,
				limit,
				this.currentOffset,
				(this._total === 0)
			) as AxiosResponse<Document[]>;
		}
	}
}

/**
 * Represents the single role.
 * Added by richastral 06/07/2023
 */
export class RoleTreeItem extends ISCResourceTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "roles",
			id
		})
	}

	contextValue = "role";
	iconPath = new vscode.ThemeIcon("account");
}

export class LoadMoreNode extends BaseTreeItem {
	contextValue = "loadMore";

	command = {
		title: "Load More",
		command: commands.LOAD_MORE,
		arguments: [this],
	};

	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		private readonly parentNode: PageableNode) {
		super(
			'Load more',
			tenantId,
			tenantName,
			tenantDisplayName
		);

	}

	getChildren(): Promise<BaseTreeItem[]> {
		throw new Error("Method not implemented.");
	}

	async loadMore(): Promise<void> {
		await this.parentNode.loadMore();
		vscode.commands.executeCommand(commands.REFRESH, this.parentNode);
	}
}

export class MessageNode extends BaseTreeItem {
	contextValue = "message";

	constructor(label) {
		super(
			label,
			"", "", ""
		);

	}

	getChildren(): Promise<BaseTreeItem[]> {
		throw new Error("Method not implemented.");
	}
}

/**
 * Contains the Forms in tree view
 */
export class FormsTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Forms", "form-definitions", tenantId, tenantName, tenantDisplayName);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const client = new ISCClient(this.tenantId, this.tenantName);
		const forms: FormTreeItem[] = []
		for await (const form of client.getForms()) {
			forms.push(new FormTreeItem(
				this.tenantId,
				this.tenantName,
				this.tenantDisplayName,
				form.name,
				form.id
			))
		}

		return forms;
	}
}

export class FormTreeItem extends ISCResourceTreeItem {
	contextValue = "form-definition";

	constructor(tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "form-definitions",
			id,
			beta: true
		})
	}

	iconPath = new vscode.ThemeIcon("preview");
}

/**
 * Contains the Search Attributes in tree view
 */
export class SearchAttributesTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Search Attribute Config", "search-attributes", tenantId, tenantName, tenantDisplayName);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const client = new ISCClient(this.tenantId, this.tenantName);
		return (await client.getSearchAttributes()).map(x => new SearchAttributeTreeItem(
			this.tenantId,
			this.tenantName,
			this.tenantDisplayName,
			x.name,
		))

	}
}

export class SearchAttributeTreeItem extends ISCResourceTreeItem {
	contextValue = "search-attribute";

	constructor(tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		name: string,
	) {
		const uniqueId = `${tenantId}/${name}`;
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label: name,
			resourceType: "accounts/search-attribute-config",
			id: uniqueId,
			beta: true,
			resourceId: name
		})
	}

	iconPath = new vscode.ThemeIcon("search");
}

/**
 * Contains the Identity Attributes in tree view
 */
export class IdentityAttributesTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Identity Attributes", "identity-attributes", tenantId, tenantName, tenantDisplayName);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const client = new ISCClient(this.tenantId, this.tenantName);
		return (await client.getIdentityAttributes()).map(x => new IdentityAttributeTreeItem(
			this.tenantId,
			this.tenantName,
			this.tenantDisplayName,
			x.name,
			`${x.displayName} (${x.name})`,
		)).sort(compareByLabel)

	}
}

export class IdentityAttributeTreeItem extends ISCResourceTreeItem {
	contextValue = "identity-attribute";

	constructor(tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		name: string,
		displayName: string,
	) {
		const uniqueId = `${tenantId}/${name}`;
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label: displayName,
			resourceType: "identity-attributes",
			id: uniqueId,
			beta: true,
			resourceId: name
		})
	}

	iconPath = new vscode.ThemeIcon("list-selection");
}

/* Contain Identity Definition */
export class IdentitiesTreeItem extends PageableFolderTreeItem<Document> {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Identities", "identities", tenantId, tenantName, tenantDisplayName, 'No identities found',
			(identity => new IdentityTreeItem(
				tenantId,
				tenantName,
				tenantDisplayName,
				identity.name,
				identity.id
			))
		);
	}
	protected async loadNext(): Promise<AxiosResponse<Document[]>> {
		const limit = getConfigNumber(configuration.TREEVIEW_PAGINATION).valueOf();
		if (!isEmpty(this.filters)) {
			this.noEntries = "No identities found";
			if (this.filterType === FilterType.api) {
				return await this.client.listIdentities({
					filters: this.filters,
					limit,
					offset: this.currentOffset,
					count: (this._total === 0)
				}) as AxiosResponse<Document[]>;
			} else {
				const filters = isEmpty(this.filters) ? "*" : this.filters;
				return await this.client.paginatedSearchIdentities(
					filters,
					limit,
					this.currentOffset,
					(this._total === 0)
				) as AxiosResponse<Document[]>;
			}
		}
		else {
			//Force return nothing
			this.noEntries = "Use search to load identities";
			return {
				headers: new AxiosHeaders({
					[TOTAL_COUNT_HEADER]: 0
				}),
				data: null,
				status: 200,
				statusText: "",
				config: null
			}
		}
	}
}

export class IdentityTreeItem extends ISCResourceTreeItem {
	contextValue = "identity";

	constructor(tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "identities",
			id,
			beta: true
		})
	}

	iconPath = new vscode.ThemeIcon("person");
}

/**
 * Contains the Applications in tree view
 */
// XXX TODO used type data
export class ApplicationsTreeItem extends PageableFolderTreeItem<any> {
	sourceId: string | undefined = undefined

	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Applications", "source-apps", tenantId, tenantName, tenantDisplayName, 'No application found',
			(app => new ApplicationTreeItem(
				tenantId,
				tenantName,
				tenantDisplayName,
				`${app.name} (${app?.accountSource?.name ?? ""})`,
				app.id,
				app.accountSource.id
			))
		);
	}

	protected async loadNext(): Promise<AxiosResponse<Document[]>> {
		const limit = getConfigNumber(configuration.TREEVIEW_PAGINATION).valueOf();
		const nameFilter = isNotEmpty(this.filters) ? `name co "${escapeFilter(this.filters)}"` : undefined
		const sourceFilter = isNotEmpty(this.sourceId) ? `accountSource.id eq "${this.sourceId}"` : undefined

		const filters = [nameFilter, sourceFilter]
			.filter(Boolean) // this line will remove any "undefined"
			.join(" and ")

		return await this.client.getPaginatedApplications(
			filters,
			limit,
			this.currentOffset,
			(this._total === 0)
		) as AxiosResponse<Document[]>;
	}


	get isFiltered(): boolean {
		return isNotEmpty(this.sourceId);
	}
}

/**
 * ApplicationTreeItem is different from other pageable folder (roles, access profiles, etc.)
 * It has children and is clickable/can be opened itself
 */
export class ApplicationTreeItem extends ISCResourceTreeItem implements PageableNode {

	contextValue = "source-app";
	iconPath = new vscode.ThemeIcon("layers");

	currentOffset = 0;
	children: BaseTreeItem[] = [];
	client: ISCClient;
	filterType: FilterType; // unused

	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string,
		public readonly sourceId: string
	) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "source-apps",
			id,
			beta: true,
			collapsible: vscode.TreeItemCollapsibleState.Collapsed
		})
		this.client = new ISCClient(this.tenantId, this.tenantName);
	}

	reset(): void {
		this.currentOffset = 0;
		this.children = [];
	}

	protected async loadNext(): Promise<AxiosResponse<any[]>> {
		const limit = getConfigNumber(configuration.TREEVIEW_PAGINATION).valueOf();
		return await this.client.getPaginatedApplicationAccessProfiles(
			this.id,
			limit,
			this.currentOffset
		) as AxiosResponse<any[]>;
	}

	async loadMore(): Promise<void> {
		await vscode.window.withProgress({
			location: {
				viewId: commands.TREE_VIEW
			}
		}, async () => {
			const limit = getConfigNumber(configuration.TREEVIEW_PAGINATION).valueOf();
			if (this.children.length > 0) {
				// remove "Load More" or Message node 
				this.children.pop();
			}

			const response = await this.loadNext();
			const total = response.data?.length

			if (total === 0 && this.children.length === 0) {
				this.children = [new MessageNode('No access profile found')];
				return;
			}

			const results: BaseTreeItem[] = response.data.map(ap => new ApplicationAccessProfileTreeItem(
				this.tenantId,
				this.tenantName,
				this.tenantDisplayName,
				ap.name,
				this.id,
				ap.id,
				this
			));
			this.children.push(...results);

			if (total === limit) {
				this.children.push(new LoadMoreNode(
					this.tenantId,
					this.tenantName,
					this.tenantDisplayName,
					this
				));
				this.currentOffset += limit;
			}
		})
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		if (this.children.length === 0) {
			await this.loadMore();
		}
		return this.children;
	}

	get hasMore(): boolean {
		throw new Error("Unimplemented");

	}
}

/**
 * Represents an access profile for an application
 */
export class ApplicationAccessProfileTreeItem extends ISCResourceTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		public readonly appId: string,
		accessProfileId: string,
		public readonly parentNode) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "access-profiles",
			id: `${appId}-${accessProfileId}`,
			resourceId: accessProfileId
		})
	}

	contextValue = "access-profile-application";
	iconPath = new vscode.ThemeIcon("archive");
}

export class CampaignsTreeItem extends PageableFolderTreeItem<any> {
	sourceId: string | undefined = undefined

	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Campaigns", "campaigns", tenantId, tenantName, tenantDisplayName, 'No campaign found',
			(x => new CampaignTreeItem(
				tenantId,
				tenantName,
				tenantDisplayName,
				x.name,
				x.id,
				x.status,
				x.type
			))
		);
	}

	protected async loadNext(): Promise<AxiosResponse<Document[]>> {
		const limit = getConfigNumber(configuration.TREEVIEW_PAGINATION).valueOf();

		const filters = undefined // TODO

		return await this.client.getPaginatedCampaigns(
			filters,
			limit,
			this.currentOffset,
			(this._total === 0)
		) as AxiosResponse<Document[]>;
	}


	get isFiltered(): boolean {
		return false // TODO
	}
}

/**
 * Certification Campaign
 */
export class CampaignTreeItem extends ISCResourceTreeItem {

	iconPath = new vscode.ThemeIcon("checklist");
	client: ISCClient;
    label: string;
    id: string;


	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string,
		public readonly status: string,
		public readonly type: string
	) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "campaigns",
			id,
			collapsible: vscode.TreeItemCollapsibleState.None
		})
		this.client = new ISCClient(this.tenantId, this.tenantName);
		this.contextValue = type + "campaign";
	}

	command = {
		title: "Dashboard",
		command: commands.VIEW_CAMPAIGN_PANEL,
		arguments: [this],
	};

}