import * as vscode from "vscode";
import * as path from 'path';
import { ISCClient, TOTAL_COUNT_HEADER } from "../services/ISCClient.js";
import { getIdByUri, getPathByUri, getProvisioningPolicyUri, getResourceUri, getResourceWebUrl, getUIUrl } from "../utils/UriUtils.js";
import { compareByLabel, compareByName, compareByPriority } from "../utils.js";
import { AxiosHeaders, AxiosResponse } from "axios";
import { getConfigNumber } from '../utils/configurationUtils.js';
import * as commands from "../commands/constants.js";
import * as configuration from '../configurationConstants.js';
import { convertConstantToTitleCase, escapeFilter, isEmpty, isNotBlank, isNotEmpty } from "../utils/stringUtils.js";
import { TenantService } from "../services/TenantService.js";
import { CloudRuleService } from "../services/CloudRuleService.js";
import { convertToBaseTreeItem } from "../views/utils.js";
import { isAccountRemovable } from "../commands/account/accountUtils.js";
import { filterNotificationTemplates, mergeNotificationTemplates, notificationTemplateDescription, notificationTemplateWebUiSegments, NotificationTemplateListEntry } from "../utils/notificationTemplateList.js";
import { Campaign2StatusEnum } from "sailpoint-api-client/dist/certification_campaigns/api.js";
import { Account } from "sailpoint-api-client/dist/accounts/api.js";
import { Dimension } from "sailpoint-api-client/dist/dimensions/api.js";
import { SourceSubtypeWithSource } from "sailpoint-api-client/dist/machine_account_subtypes/api.js";
import { SourceDataset, SourceDatasetResource } from "sailpoint-api-client/dist/sources/index.js";
import { MachineIdentityResponse } from "sailpoint-api-client/dist/machine_identities/api.js";
import { truethy } from "../utils/booleanUtils.js";
import { schemaHasDatasetId, sourceResourceIconName } from "../utils/sourceResources.js";
import type { SegmentMemberType } from "../utils/segmentPatch.js";


/**
 * Base class to expose getChildren and updateIcon methods
 */
export abstract class BaseTreeItem extends vscode.TreeItem {

	constructor(
		label: string | vscode.TreeItemLabel,
		public readonly tenantId: string,
		public readonly tenantName: string,
		public tenantDisplayName: string,
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
		return this.contextValue ?? "";
	}

	getUrl(): vscode.Uri | undefined {
		return undefined
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
		this.id = tenantId
	}
	iconPath = new vscode.ThemeIcon("organization");
	contextValue = "tenant";
	private cachedChildren?: BaseTreeItem[];

	private buildChildren(): BaseTreeItem[] {
		const children: BaseTreeItem[] = [
			new SourcesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new TransformsTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new WorkflowsTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new RulesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new ServiceDesksTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new IdentityProfilesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new AccessProfilesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new RolesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new FormsTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new SegmentsTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new SodPoliciesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new GeneralPoliciesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new SearchAttributesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new IdentityAttributesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new IdentitiesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new MachineIdentitiesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new ApplicationsTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new CampaignsTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new CloudRulesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),
			new NotificationTemplatesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName),

		];

		for (const child of children) {
			if (child instanceof FolderTreeItem) {
				child.parentNode = this;
			}
		}

		return children.sort(compareByLabel);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		if (!this.cachedChildren) {
			this.cachedChildren = this.buildChildren();
		}
		return this.cachedChildren;
	}

	/**
	 * The tree keeps one TenantTreeItem per tenant id. A rename must update that
	 * instance, otherwise the next refresh still shows the previous label.
	 */
	applyDisplayName(name: string): void {
		this.label = name;
		this.tenantDisplayName = name;
		for (const child of this.cachedChildren ?? []) {
			child.tenantDisplayName = name;
		}
	}

	get computedContextValue() {
		const tenantInfo = this.tenantService.getTenant(this.tenantId);
		return tenantInfo && tenantInfo.readOnly ? "tenantReadOnly" : "tenantWritable";
	}

	getUrl(): vscode.Uri | undefined {
		return getUIUrl(this.tenantName, "/ui/admin")
	}

}

/**
 * Folder for tenants
 */
export class TenantFolderTreeItem extends BaseTreeItem {
	/**
	 * A tenant folder is not a file. A resourceUri makes VS Code handle the row as
	 * a file drop target, and an expanded folder that contains another folder then
	 * stops accepting tenants.
	 */
	iconPath = new vscode.ThemeIcon("folder");

	constructor(
		id: string,
		label: string,
		private readonly tenantService: TenantService
	) {
		super(label,
			"", "", "",
			vscode.TreeItemCollapsibleState.Collapsed);
		this.id = id
	}

	/**
	 * Folder instances are reused. A rename must update that instance, otherwise
	 * the next refresh still shows the previous label.
	 */
	applyName(name: string): void {
		this.label = name;
	}

	contextValue = "folder"

	async getChildren(): Promise<BaseTreeItem[]> {
		const children = this.tenantService.getChildren(this.id!)
		const results: BaseTreeItem[] = children?.map(x => convertToBaseTreeItem(x, this.tenantService)) ?? []
		return results.sort(compareByLabel)
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
	public parentNode?: BaseTreeItem;
	// collapsibleState is not updated. It's only for initial state.
	// Setting statically the icon
	iconPath = new vscode.ThemeIcon("folder");
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
					source.id!,
					source.type!,
					source.connectorAttributes?.["delimiter"],
					source.features,
					source.cluster !== null && source.cluster !== undefined,
					source.connectorName
				))
				.sort(compareByLabel);
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
					`${w.name} (${w.authoritativeSource?.name?.replace(
						/ \[source.*\]/,
						""
					)})`,
					w.id!
				)
		);
		return identityProfileItems;
	}
}

export class ISCResourceTreeItem extends BaseTreeItem {
	public readonly uri: vscode.Uri;
	public readonly resourceId: string;
	public readonly parentId: string;
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
		collapsible?: vscode.TreeItemCollapsibleState;
		parentId?: string;
		subId?: string;
		subResourceType?: string;
		resourceSubId?: string;
		uri?: vscode.Uri;
	}) {

		options = {
			...{
				// By default, a ISCResourceTreeItem will be a leaf, meaning that there will not be any childs
				collapsible: vscode.TreeItemCollapsibleState.None,
			},
			...options
		}
		super(options.label, options.tenantId, options.tenantName, options.tenantDisplayName, options.collapsible);
		this.id = options.id
		this.parentId = options.parentId

		if (options.uri) {
			this.uri = options.uri
			this.resourceId = options.resourceId ?? options.id
		} else if (options.subResourceType && options.subId) {
			this.uri = getResourceUri(options.tenantName,
				options.resourceType,
				options.parentId,
				options.label)
			this.uri = this.uri.with({
				path: path.posix.join(
					path.posix.dirname(this.uri.path),
					options.subResourceType,
					options.resourceSubId ?? options.subId,
					options.label
				),
			})
		} else {
			this.uri = getResourceUri(options.tenantName,
				options.resourceType,
				options.resourceId ?? options.id,
				options.label);
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

/**
 * Datasets and resources are exposed by machine-identity and AI-agent sources.
 */
const DATASET_SOURCE_FEATURES = ["MACHINE_IDENTITY_AGGREGATION", "AI_AGENT_AGGREGATION"];

function sourceHasDatasetFeature(features: Array<string> | undefined): boolean {
	return features?.some((feature) => DATASET_SOURCE_FEATURES.includes(feature)) === true;
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
		public readonly features: Array<string> | undefined,
		public readonly VABased: boolean,
		connectorName?: string,
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
		this.description = connectorName
		this.contextValue = (features?.find(x => x === "MACHINE_IDENTITY_AGGREGATION") ?? "")
			+ (type === "DelimitedFile" && VABased ? "VABased" : "")
			+ type.replaceAll(" ", "")
			+ "source"
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const results: BaseTreeItem[] = [];
		results.push(new SchemasTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName, this.uri));
		if (sourceHasDatasetFeature(this.features)) {
			results.push(new SourceDatasetsTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName, this.uri, this.label as string));
			results.push(new SourceResourcesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName, this.uri));
		}
		results.push(
			new ProvisioningPoliciesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName, this.uri)
		);
		// TODO Only show this depending on the tenant features
		results.push(
			new MachineAccountSubtypesTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName, this.uri)
		)
		try {
			const client = new ISCClient(this.tenantId, this.tenantName);
			const privilegeCriteriaConfigs = await client.getPrivilegeCriteriaConfigs(this.id as string);
			if (privilegeCriteriaConfigs && privilegeCriteriaConfigs.length > 0) {
				results.push(new PrivilegeClassificationTreeItem(
					this.tenantId,
					this.tenantName,
					this.tenantDisplayName,
					privilegeCriteriaConfigs[0].id!,
					this.id!
				));
			}
		} catch (error) {
			// The endpoint may return an error (403 or 500) if privilege classification is not available for the tenant
			console.log("Privilege classification not available:", error);
		}

		return results.sort(compareByLabel);
	}

	updateIcon(context: vscode.ExtensionContext): void {
		this.iconPath = {
			light: vscode.Uri.file(context.asAbsolutePath("resources/light/source.svg")),
			dark: vscode.Uri.file(context.asAbsolutePath("resources/dark/source.svg")),
		};
	}

	getUrl(): vscode.Uri | undefined {
		return getResourceWebUrl(this.tenantName, "source", this.id as string)
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
			).sort(compareByLabel);
		}
		return results;
	}
}

export class TransformTreeItem extends ISCResourceTreeItem {
	contextValue: "transform" = "transform";

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
			light: vscode.Uri.file(context.asAbsolutePath("resources/light/transform.svg")),
			dark: vscode.Uri.file(context.asAbsolutePath("resources/dark/transform.svg")),
		};
	}
}

/**
 * Containers for notification templates
 */
export class NotificationTemplatesTreeItem extends FolderTreeItem {
	/** Client-side text filter (name, key, description, locale). */
	filters = "";
	/** Selected mediums. Empty means every medium. */
	mediums: string[] = [];
	private templates?: NotificationTemplateListEntry[];

	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Notification Templates", "notification-templates", tenantId, tenantName, tenantDisplayName);
	}

	override reset(): void {
		this.templates = undefined;
	}

	get isNameFiltered(): boolean {
		return isNotEmpty(this.filters);
	}

	get isMediumFiltered(): boolean {
		return this.mediums.length > 0;
	}

	override get computedContextValue(): string {
		return this.contextValue
			+ (this.isNameFiltered ? "NameFiltered" : "")
			+ (this.isMediumFiltered ? "MediumFiltered" : "");
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		if (!this.templates) {
			const client = new ISCClient(this.tenantId, this.tenantName);
			const [defaults, custom] = await Promise.all([
				client.getNotificationTemplateDefaults(),
				client.getNotificationTemplates(),
			]);
			this.templates = mergeNotificationTemplates(defaults, custom);
		}

		const visible = filterNotificationTemplates(this.templates, {
			query: this.filters,
			mediums: this.mediums,
		});
		if (visible.length === 0) {
			const label = this.isNameFiltered || this.isMediumFiltered
				? "No notification template matches the filter"
				: "No notification template found";
			return [new MessageNode(label)];
		}

		return visible
			.map(t => new NotificationTemplateTreeItem(
				this.tenantId,
				this.tenantName,
				this.tenantDisplayName,
				t.name || t.key,
				t.id,
				t.key,
				t.medium,
				t.locale,
				t.customized,
			))
			.sort(compareByLabel);
	}
}

const NOTIFICATION_TEMPLATE_MEDIUM_ICONS: Record<string, string> = {
	EMAIL: "mail",
	SLACK: "comment-discussion",
	TEAMS: "organization",
};

export class NotificationTemplateTreeItem extends ISCResourceTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string,
		readonly templateKey: string,
		readonly medium: string,
		locale: string,
		readonly customized: boolean) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "notification-templates",
			id
		})
		// Medium-specific so the "Edit body (HTML)" / "Preview body" menu items
		// only show for EMAIL - SLACK/TEAMS bodies are not HTML.
		this.contextValue = `notification-template-${medium}`;
		this.description = notificationTemplateDescription(medium);
		const origin = customized ? "Customized" : "Default";
		this.tooltip = `${label}\n${locale}\n${origin}`;
	}

	updateIcon(context: vscode.ExtensionContext): void {
		this.iconPath = new vscode.ThemeIcon(NOTIFICATION_TEMPLATE_MEDIUM_ICONS[this.medium] ?? "mail");
	}

	getUrl(): vscode.Uri | undefined {
		const segments = notificationTemplateWebUiSegments({
			medium: this.medium,
			customized: this.customized,
			id: this.resourceId,
			key: this.templateKey,
		});
		if (!segments) {
			return undefined;
		}
		// Defaults are opened by key. `resourceId` is a synthetic id and is not a Web UI segment.
		return getResourceWebUrl(this.tenantName, "notification-template", segments[1], { subtype: this.customized ? "customized" : "default" });
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
				.filter((element) => !schemaHasDatasetId(element))
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

/**
 * Resources defined on a source.
 * cf. GET /sources/v1/{sourceId}/resources
 */
export class SourceResourcesTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		parentUri: vscode.Uri
	) {
		super("Resources", "source-resources", tenantId, tenantName, tenantDisplayName, parentUri);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const client = new ISCClient(this.tenantId, this.tenantName);
		const sourceId = getIdByUri(this.parentUri) || "";
		const resources = await client.getSourceResources(sourceId);
		return resources
			.filter((resource): resource is SourceDatasetResource & { id: string; name: string } =>
				isNotBlank(resource.id) && isNotBlank(resource.name))
			.sort(compareByName)
			.map((resource) => new SourceResourceTreeItem(
				this.tenantId,
				this.tenantName,
				this.tenantDisplayName,
				resource.name,
				sourceId,
				resource.id,
				resource.type
			));
	}
}

export class SourceResourceTreeItem extends ISCResourceTreeItem {
	contextValue = "resource-item";

	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		sourceId: string,
		resourceId: string,
		public readonly type: string | undefined
	) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "sources",
			// Resource ids such as `aws:iam-role` can repeat across sources.
			id: `${sourceId}/resources/${resourceId}`,
			parentId: sourceId,
			subResourceType: "resources",
			subId: resourceId
		});
		this.description = type;
		this.tooltip = type ? `${label}\n${type}` : label;
		this.iconPath = new vscode.ThemeIcon(sourceResourceIconName(type));
	}
}

/**
 * Datasets defined on a source.
 * cf. GET /sources/v1/{sourceId}/datasets
 */
export class SourceDatasetsTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		parentUri: vscode.Uri,
		public readonly sourceName: string
	) {
		super("Datasets", "source-datasets", tenantId, tenantName, tenantDisplayName, parentUri);
	}

	get sourceId(): string {
		return getIdByUri(this.parentUri) || "";
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const client = new ISCClient(this.tenantId, this.tenantName);
		const sourceId = this.sourceId;
		const datasets = await client.getSourceDatasets(sourceId);
		return datasets
			.sort(compareByName)
			.map((dataset) => new SourceDatasetTreeItem(
				this.tenantId,
				this.tenantName,
				this.tenantDisplayName,
				dataset.name!,
				sourceId,
				dataset.id!,
				dataset.description
			));
	}
}

export class SourceDatasetTreeItem extends ISCResourceTreeItem {
	contextValue = "dataset";
	public readonly datasetId: string;

	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		sourceId: string,
		datasetId: string,
		description?: string
	) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "sources",
			id: `${sourceId}/datasets/${datasetId}`,
			parentId: sourceId,
			subResourceType: "datasets",
			subId: datasetId
		});
		this.datasetId = datasetId;
		this.tooltip = description ? `${label}\n${description}` : label;
	}

	iconPath = new vscode.ThemeIcon("database");
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

	iconPath = new vscode.ThemeIcon("database");

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
		const client = new ISCClient(this.tenantId, this.tenantName);
		const sourceId = getIdByUri(this.parentUri)
		const provisioningPolicies = await client.getProvisioningPolicies(sourceId!)

		const results = provisioningPolicies?.map((provisioningPolicy) => new ProvisioningPolicyTreeItem(
			{
				tenantId: this.tenantId,
				tenantName: this.tenantName,
				tenantDisplayName: this.tenantDisplayName,
				policyId: provisioningPolicy.id,
				usageType: provisioningPolicy.usageType,
				sourceId: sourceId!,
				name: provisioningPolicy.name
			})).sort(compareByLabel)
		return results;
	}
}

export class ProvisioningPolicyTreeItem extends ISCResourceTreeItem {
	contextValue = "provisioning-policy";

	constructor(options: {
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		sourceId: string,
		policyId: string,
		usageType: string,
		name: string
	}
	) {
		const label = isEmpty(options.name) ? convertConstantToTitleCase(options.usageType) : options.name
		super({
			...options,
			parentId: options.sourceId,
			label,
			resourceType: "sources",
			id: `${options.sourceId}/provisioning-policies/${options.policyId}`,
			resourceId: options.policyId,
			uri: getProvisioningPolicyUri(
				options.tenantName,
				options.sourceId,
				options.policyId,
				label
			),
		})
	}

	updateIcon(context: vscode.ExtensionContext): void {
		this.iconPath = {
			light: vscode.Uri.file(context.asAbsolutePath("resources/light/provisioning-policy.svg")),
			dark: vscode.Uri.file(context.asAbsolutePath("resources/dark/provisioning-policy.svg")),
		};
	}
}

/**
 * Containers for machine account subtypes
 */
export class MachineAccountSubtypesTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		parentUri: vscode.Uri
	) {
		super("Machine Account Subtypes", "machine-account-subtypes", tenantId, tenantName, tenantDisplayName, parentUri);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const client = new ISCClient(this.tenantId, this.tenantName);
		const sourceId = getIdByUri(this.parentUri) || "";
		// no pagination for now
		const subtypes = await client.listMachineAccountSubtypes(sourceId);

		return subtypes.map((subtype: SourceSubtypeWithSource) => new MachineAccountSubtypeTreeItem(
			this.tenantId,
			this.tenantName,
			this.tenantDisplayName,
			subtype.displayName!,
			subtype.id!,
			subtype.technicalName!
		)).sort(compareByLabel);
	}
}

export class MachineAccountSubtypeTreeItem extends ISCResourceTreeItem {
	contextValue = "machine-account-subtype";

	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		subtypeId: string,
		public readonly technicalName: string
	) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "source-subtypes",
			id: subtypeId
		})
	}

	iconPath = new vscode.ThemeIcon("symbol-misc");
}

/**
 * Privilege classification configuration of a source
 */
export class PrivilegeClassificationTreeItem extends ISCResourceTreeItem {
	contextValue = "privilege-classification";

	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		configId: string,
		private readonly sourceId: string
	) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label: "Privilege Classification",
			resourceType: "criteria-config/privilege",
			id: configId,
			collapsible: vscode.TreeItemCollapsibleState.Collapsed
		})
	}

	iconPath = new vscode.ThemeIcon("folder");

	async getChildren(): Promise<BaseTreeItem[]> {
		const client = new ISCClient(this.tenantId, this.tenantName);
		const privilegeCriteria = await client.getPrivilegeCriteria(this.sourceId);
		return privilegeCriteria.map((c) => new PrivilegeCriterionTreeItem(
			this.tenantId,
			this.tenantName,
			this.tenantDisplayName,
			c.id!,
			c.type!,
			c.privilegeLevel!
		)).sort(compareByLabel);
	}
}

export class PrivilegeCriterionTreeItem extends ISCResourceTreeItem {
	contextValue = "privilege-criterion";

	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		id: string,
		public readonly type: string,
		public readonly privilegeLevel: string
	) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label: `${type}-${privilegeLevel}`,
			resourceType: "criteria/privilege",
			id
		})
	}

	iconPath = new vscode.ThemeIcon("tag");
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
					w.name!,
					w.id!,
					truethy(w.enabled)
				)
		);
		return workflowTreeItems.sort(compareByLabel);
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
			resourceId: id,
			id: `${tenantId}-${id}`
		})
	}

	contextValue = "workflow";

	get computedContextValue() {
		return this.enabled ? "enabledWorkflow" : "disabledWorkflow";
	}

	updateIcon(context: vscode.ExtensionContext): void {
		if (this.enabled) {
			this.iconPath = {
				light: vscode.Uri.file(context.asAbsolutePath("resources/light/workflow-enabled.svg")),
				dark: vscode.Uri.file(context.asAbsolutePath("resources/dark/workflow-enabled.svg")),
			};
		} else {
			this.iconPath = {
				light: vscode.Uri.file(context.asAbsolutePath("resources/light/workflow-disabled.svg")),
				dark: vscode.Uri.file(context.asAbsolutePath("resources/dark/workflow-disabled.svg")),
			};
		}
	}

	getUrl(): vscode.Uri | undefined {
		return getResourceWebUrl(this.tenantName, "workflow", this.resourceId)
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
		super("Connector Rules", "connector-rules", tenantId, tenantName, tenantDisplayName);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const client = new ISCClient(this.tenantId, this.tenantName);
		const rules = await client.getConnectorRules();
		const ruleTreeItems = rules.map(
			(r) => new RuleTreeItem(this.tenantId, this.tenantName, this.tenantDisplayName, r.name, r.id)
		);
		return ruleTreeItems.sort(compareByLabel);
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
		})
	}

	contextValue = "connector-rule";
	iconPath = new vscode.ThemeIcon("file-code");
}

/**
 * Containers for cloud rules (SP-Config RULE objects)
 */
export class CloudRulesTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Cloud Rules", "cloud-rules", tenantId, tenantName, tenantDisplayName);
	}

	reset(): void {
		CloudRuleService.getInstance(this.tenantId, this.tenantName, this.tenantDisplayName).resetCache();
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const cloudRuleService = CloudRuleService.getInstance(
			this.tenantId,
			this.tenantName,
			this.tenantDisplayName
		);
		const rules = await cloudRuleService.listCloudRules();
		return rules.map(
			(rule) => new CloudRuleTreeItem(
				this.tenantId,
				this.tenantName,
				this.tenantDisplayName,
				rule.name,
				rule.id
			)
		).sort(compareByLabel);
	}
}

export class CloudRuleTreeItem extends ISCResourceTreeItem {
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
			resourceType: "cloud-rules",
			id,
		});
	}

	contextValue = "cloud-rule";
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
		const lifecycleStates = await client.getLifecycleStates(this.id!);

		const lifecycleStateItems = lifecycleStates.map((w) => new LifecycleStateTreeItem(
			this.tenantId,
			this.tenantName,
			this.tenantDisplayName,
			w.name!,
			this.id as string,
			w.id!
		))
		return lifecycleStateItems.sort(compareByLabel);
	}

	getUrl(): vscode.Uri | undefined {
		return getResourceWebUrl(this.tenantName, "identity-profile", this.id as string)
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

	getUrl(): vscode.Uri | undefined {
		return getResourceWebUrl(this.tenantName, "lifecycle-state", this.id as string, { parentId: this.parentId })
	}
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
				w.id!,
				w.type
			)
		);
		return serviceDeskItems.sort(compareByLabel);
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

	getUrl(): vscode.Uri | undefined {
		return getResourceWebUrl(this.tenantName, "service-desk-integration", this.id as string)
	}
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

	/**
	 * Total number of elements, read from the `X-Total-Count` header
	 */
	protected computeTotal(response: AxiosResponse<T[]>): number {
		return Number(response.headers[TOTAL_COUNT_HEADER]);
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

			if (this._total === 0) {
				this._total = this.computeTotal(response);
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
		// Campaign pages stay in creation order. The next page is the next
		// slice of that order, so a name sort would not match "Load more".
		if (this instanceof CampaignsTreeItem) {
			return this.children;
		}
		return sortLoadedTreeItems(this.children);
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
		const filters = isNotEmpty(this.filters) ? this.filters : "*"
		return await this.client.searchAccessProfiles(
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

	getUrl(): vscode.Uri | undefined {
		return getResourceWebUrl(this.tenantName, "access-profile", this.id as string)
	}
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
				role.id,
				role.dimensional
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
			const filters = isNotEmpty(this.filters) ? this.filters : "*";
			return await this.client.searchRoles(
				filters,
				limit,
				this.currentOffset,
				(this._total === 0)


			) as AxiosResponse<Document[]>;
		}
	}
}


export class RoleTreeItem extends PageableFolderTreeItem<Dimension> {
	public readonly uri: vscode.Uri
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string,
		private readonly dimensional: boolean) {
		super(label, "role", tenantId, tenantName, tenantDisplayName, 'No dimension found',
			(dimension => new DimensionTreeItem({
				tenantId,
				tenantName,
				tenantDisplayName,
				label: dimension.name,
				dimensionId: dimension.id,
				roleId: dimension.parentId
			}))
		)
		this.id = id
		this.collapsibleState = dimensional ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
		this.uri = getResourceUri(tenantName,
			"roles",
			id,
			label)

	}

	iconPath = new vscode.ThemeIcon("combine")

	getUrl(): vscode.Uri | undefined {
		return getResourceWebUrl(this.tenantName, "role", this.id!)
	}

	protected async loadNext(): Promise<AxiosResponse<Dimension[]>> {
		const limit = getConfigNumber(configuration.TREEVIEW_PAGINATION).valueOf();
		return await this.client.getPaginatedDimensions({
			roleId: this.id!,
			limit,
			offset: this.currentOffset,
			count: (this._total === 0),
			sorters: "name"
		})
	}

	/**
	 * Filtering not supported... yet
	 */
	get computedContextValue() {
		return this.dimensional ? `${this.contextValue}Dimensional` : this.contextValue
	}
	/**
	 * Need to force open command as it's not inhereting from ISCResourceTreeItem anymore
	 */
	command = {
		title: "open",
		command: commands.OPEN_RESOURCE,
		arguments: [this],
	};
}


export class DimensionTreeItem extends ISCResourceTreeItem {
	constructor(
		options: {
			tenantId: string;
			tenantName: string;
			tenantDisplayName: string;
			label: string,
			roleId: string,
			dimensionId: string
		}
	) {
		super({
			tenantId: options.tenantId,
			tenantName: options.tenantName,
			tenantDisplayName: options.tenantDisplayName,
			label: options.label,
			resourceType: "roles",
			id: options.dimensionId,
			parentId: options.roleId,
			subResourceType: "dimensions",
			subId: options.dimensionId,
		})
	}

	contextValue = "dimension";
	iconPath = new vscode.ThemeIcon("list-tree");

	getUrl(): vscode.Uri | undefined {
		return getResourceWebUrl(this.tenantName, "dimension", this.id as string, { parentId: this.parentId })
	}

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

	constructor(label: string) {
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
 * Alphabetical order of loaded rows. A trailing Load more or message row stays last,
 * and the stored list is left unchanged so pagination can still drop that trailer.
 */
function sortLoadedTreeItems(items: BaseTreeItem[]): BaseTreeItem[] {
	if (items.length <= 1) {
		return items;
	}
	const last = items[items.length - 1];
	const hasTrailer = last instanceof LoadMoreNode || last instanceof MessageNode;
	const sorted = (hasTrailer ? items.slice(0, -1) : items.slice()).sort(compareByLabel);
	return hasTrailer ? [...sorted, last] : sorted;
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
				form.name!,
				form.id!
			))
		}

		return forms.sort(compareByLabel);
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
			id: `${tenantId}-${id}`,
			resourceId: id
		})
	}

	iconPath = new vscode.ThemeIcon("preview");
	getUrl(): vscode.Uri | undefined {
		return getResourceWebUrl(this.tenantName, "form-definition", this.resourceId)
	}
}

/**
 * Contains the Segments in tree view
 */
export class SegmentsTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Segments", "segments", tenantId, tenantName, tenantDisplayName);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const client = new ISCClient(this.tenantId, this.tenantName);
		return (await client.getSegments())
			.filter(segment => segment.id && segment.name)
			.map(segment => new SegmentTreeItem(
				this.tenantId,
				this.tenantName,
				this.tenantDisplayName,
				segment.name!,
				segment.id!,
				segment.active !== false
			))
			.sort(compareByLabel);
	}
}

/**
 * A segment. Its content (access profiles, entitlements and roles) is below it.
 */
export class SegmentTreeItem extends ISCResourceTreeItem {
	contextValue = "segment";
	private cachedChildren?: SegmentContentTreeItem[];

	constructor(tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string,
		active: boolean = true) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "segments",
			id: `${tenantId}-${id}`,
			resourceId: id,
			collapsible: vscode.TreeItemCollapsibleState.Collapsed
		})
		if (!active) {
			this.description = "inactive";
		}
	}

	iconPath = new vscode.ThemeIcon("layers");

	getUrl(): vscode.Uri | undefined {
		return getResourceWebUrl(this.tenantName, "segment", this.resourceId)
	}

	reset(): void {
		this.cachedChildren?.forEach(child => child.reset());
	}

	/**
	 * The containers are kept so that a refresh of one of them targets the node known by the tree.
	 */
	async getChildren(): Promise<BaseTreeItem[]> {
		if (!this.cachedChildren) {
			this.cachedChildren = (["access-profiles", "entitlements", "roles"] as SegmentMemberType[])
				.map(memberType => new SegmentContentTreeItem(
					this.tenantId,
					this.tenantName,
					this.tenantDisplayName,
					this.resourceId,
					memberType
				));
		}
		return this.cachedChildren;
	}
}

const SEGMENT_MEMBER_SETTINGS: Record<SegmentMemberType, { label: string, noEntries: string, kind: string, icon: string }> = {
	"access-profiles": { label: "Access Profiles", noEntries: "No access profile in this segment", kind: "access-profile", icon: "archive" },
	"entitlements": { label: "Entitlements", noEntries: "No entitlement in this segment", kind: "entitlement", icon: "key" },
	"roles": { label: "Roles", noEntries: "No role in this segment", kind: "role", icon: "combine" },
};

/**
 * Lists the access profiles, entitlements or roles that belong to a segment
 * (`for-segment-ids=<segment id>&include-unsegmented=false`).
 */
export class SegmentContentTreeItem extends PageableFolderTreeItem<any> {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		public readonly segmentId: string,
		public readonly memberType: SegmentMemberType,
	) {
		super(
			SEGMENT_MEMBER_SETTINGS[memberType].label,
			`segment-${memberType}`,
			tenantId, tenantName, tenantDisplayName,
			SEGMENT_MEMBER_SETTINGS[memberType].noEntries,
			(item => new SegmentMemberTreeItem(
				tenantId,
				tenantName,
				tenantDisplayName,
				memberType,
				segmentId,
				item.name ?? item.id,
				item.id,
				item.source?.name
			))
		);
	}

	protected async loadNext(): Promise<AxiosResponse<any[]>> {
		const query = {
			forSegmentIds: this.segmentId,
			includeUnsegmented: false,
			limit: getConfigNumber(configuration.TREEVIEW_PAGINATION).valueOf(),
			offset: this.currentOffset,
			count: (this._total === 0)
		};
		switch (this.memberType) {
			case "access-profiles":
				return await this.client.getAccessProfiles(query) as AxiosResponse<any[]>;
			case "roles":
				return await this.client.getRoles(query) as AxiosResponse<any[]>;
			case "entitlements":
				return await this.client.getEntitlements(query) as AxiosResponse<any[]>;
		}
	}

	/**
	 * With `for-segment-ids`, the `X-Total-Count` header can be missing or equal to 0
	 * even though elements are returned. The content of the page is then the reference.
	 */
	protected computeTotal(response: AxiosResponse<any[]>): number {
		const total = super.computeTotal(response);
		const returned = Array.isArray(response.data) ? response.data.length : 0;
		if ((!Number.isFinite(total) || total < returned) && returned > 0) {
			console.log(`Segment ${this.memberType}: unreliable ${TOTAL_COUNT_HEADER} (${response.headers[TOTAL_COUNT_HEADER]}), using ${returned} returned elements`);
			return returned;
		}
		return total;
	}

	// No filter: the context value does not need the "Filtered"/"Unfiltered" suffix
	get computedContextValue() {
		return this.contextValue;
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const children = await super.getChildren();
		for (const child of children) {
			if (child instanceof SegmentMemberTreeItem) {
				child.parentNode = this;
			}
		}
		return children;
	}
}

/**
 * An access profile, entitlement or role that belongs to a segment.
 * The context value is different from the one of the "real" object on purpose:
 * the commands of these objects (e.g. delete) must not be available here.
 */
export class SegmentMemberTreeItem extends ISCResourceTreeItem {
	public parentNode?: BaseTreeItem;

	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		public readonly memberType: SegmentMemberType,
		public readonly segmentId: string,
		label: string,
		memberId: string,
		description?: string,
	) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: memberType,
			id: `${segmentId}-${memberId}`,
			resourceId: memberId
		})
		const settings = SEGMENT_MEMBER_SETTINGS[memberType];
		this.contextValue = `segment-${settings.kind}-item`;
		this.iconPath = new vscode.ThemeIcon(settings.icon);
		if (description) {
			this.description = description;
		}
	}

	getUrl(): vscode.Uri | undefined {
		const kind = SEGMENT_MEMBER_SETTINGS[this.memberType].kind;
		return kind === "entitlement" ? undefined : getResourceWebUrl(this.tenantName, kind, this.resourceId);
	}
}

const GENERAL_SOD_POLICY_TYPE = "GENERAL";

/**
 * Contains the SoD Policies of type CONFLICTING_ACCESS_BASED in tree view.
 * GENERAL policies are in their own folder.
 */
export class SodPoliciesTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("SoD Policies", "sod-policies", tenantId, tenantName, tenantDisplayName);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const client = new ISCClient(this.tenantId, this.tenantName);
		return (await client.getSoDPolicies())
			.filter(policy => policy.id && policy.name && policy.type !== GENERAL_SOD_POLICY_TYPE)
			.map(policy => new SodPolicyTreeItem(
				this.tenantId,
				this.tenantName,
				this.tenantDisplayName,
				policy.name!,
				policy.id!,
				policy.state !== "NOT_ENFORCED",
				policy.level
			))
			.sort(compareByLabel);
	}
}

export class SodPolicyTreeItem extends ISCResourceTreeItem {
	contextValue = "sod-policy";

	constructor(tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string,
		enforced: boolean = true,
		level?: string | null) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "sod-policies",
			id: `${tenantId}-${id}`,
			resourceId: id
		})
		// The description is the severity level, completed when the policy is not enforced
		const description = [level, enforced ? undefined : "not enforced"].filter(Boolean).join(" - ");
		if (description) {
			this.description = description;
		}
	}

	iconPath = new vscode.ThemeIcon("law");
}

/**
 * Contains the SoD Policies of type GENERAL in tree view
 */
export class GeneralPoliciesTreeItem extends FolderTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("General Policies", "general-policies", tenantId, tenantName, tenantDisplayName);
	}

	async getChildren(): Promise<BaseTreeItem[]> {
		const client = new ISCClient(this.tenantId, this.tenantName);
		return (await client.getSoDPolicies())
			.filter(policy => policy.id && policy.name && policy.type === GENERAL_SOD_POLICY_TYPE)
			.map(policy => new GeneralPolicyTreeItem(
				this.tenantId,
				this.tenantName,
				this.tenantDisplayName,
				policy.name!,
				policy.id!,
				policy.state !== "NOT_ENFORCED"
			))
			.sort(compareByLabel);
	}
}

/**
 * A GENERAL SoD policy. It is the same API object as a SoD policy, hence the `sod-policies` resource type.
 */
export class GeneralPolicyTreeItem extends ISCResourceTreeItem {
	contextValue = "general-policy";

	constructor(tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string,
		enforced: boolean = true) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "sod-policies",
			id: `${tenantId}-${id}`,
			resourceId: id
		})
		if (!enforced) {
			this.description = "not enforced";
		}
	}

	iconPath = new vscode.ThemeIcon("checklist");

	getUrl(): vscode.Uri | undefined {
		return getResourceWebUrl(this.tenantName, "general-policy", this.resourceId)
	}
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
			x.name!,
		)).sort(compareByLabel)

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
	contextValue: "identity-attribute" = "identity-attribute";

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
			resourceId: name
		})
	}

	iconPath = new vscode.ThemeIcon("list-selection");
}

/* Contain Identity Definition */
export class IdentitiesTreeItem extends PageableFolderTreeItem<Document> {
	filterType = FilterType.search;

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
		this.id = `${tenantId}/identities`;
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
				const filters = isNotEmpty(this.filters) ? this.filters : "*";
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
			collapsible: vscode.TreeItemCollapsibleState.Collapsed
		})
	}

	iconPath = new vscode.ThemeIcon("person");

	async getChildren(): Promise<BaseTreeItem[]> {
		const client = new ISCClient(this.tenantId, this.tenantName);
		const accounts = await client.getAccountsByIdentity(this.resourceId);

		if (accounts === undefined || accounts.length === 0) {
			return [new MessageNode("No accounts found")];
		}

		const sourceIds = [...new Set(accounts.map(account => account.sourceId).filter(x => !!x))];
		const featuresBySourceId = new Map<string, string[]>();
		await Promise.all(sourceIds.map(async (sourceId) => {
			try {
				const source = await client.getSourceById(sourceId);
				featuresBySourceId.set(sourceId, source.features ?? []);
			} catch (error) {
				// Without the source features, the account will simply not expose feature-based actions
				console.log(`Could not load features of source ${sourceId}:`, error);
			}
		}));

		const accountNodes = accounts
			.map(account => new AccountTreeItem(
				this.tenantId,
				this.tenantName,
				this.tenantDisplayName,
				this.resourceId,
				account,
				featuresBySourceId.get(account.sourceId),
				isAccountRemovable(account),
				this
			))
			.sort(compareByLabel);

		return accountNodes;
	}

	getUrl(): vscode.Uri | undefined {
		return getResourceWebUrl(this.tenantName, "identity", this.id as string)
	}
}

export class AccountTreeItem extends ISCResourceTreeItem {
	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		identityId: string,
		account: Account,
		features: string[] | undefined,
		public readonly removable: boolean,
		public readonly parentNode: BaseTreeItem
	) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label: account.name ?? account.nativeIdentity ?? account.id,
			resourceType: "accounts",
			id: `${identityId}/accounts/${account.id}`,
			resourceId: account.id
		})
		this.description = account.sourceName ?? undefined
		this.contextValue = "account"
			+ (features?.includes("ENABLE") ? (account.disabled ? "-enable" : "-disable") : "")
			+ (features?.includes("UNLOCK") && account.locked ? "-unlock" : "")
			+ (removable ? "-remove" : "")
	}

	iconPath = new vscode.ThemeIcon("account");
}

export class MachineIdentitiesTreeItem extends PageableFolderTreeItem<MachineIdentityResponse> {
	filterTypes?: string[];
	filterSourceIds?: string[];
	filterAdditional?: string;

	constructor(
		tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
	) {
		super("Machine Identities", "machine-identities", tenantId, tenantName, tenantDisplayName, 'No machine identities found',
			(item => new MachineIdentityTreeItem(
				tenantId,
				tenantName,
				tenantDisplayName,
				item.name ?? item.id ?? "",
				item.id ?? "",
				item.subtype
			))
		);
	}

	protected async loadNext(): Promise<AxiosResponse<MachineIdentityResponse[]>> {
		const limit = getConfigNumber(configuration.TREEVIEW_PAGINATION).valueOf();
		return await this.client.listMachineIdentities({
			filters: this.filters || undefined,
			limit,
			offset: this.currentOffset,
			count: (this._total === 0),
			sorters: "name"
		});
	}
}

export class MachineIdentityTreeItem extends ISCResourceTreeItem {
	contextValue = "machine-identity";

	constructor(tenantId: string,
		tenantName: string,
		tenantDisplayName: string,
		label: string,
		id: string,
		public readonly subtype?: string) {
		super({
			tenantId,
			tenantName,
			tenantDisplayName,
			label,
			resourceType: "machine-identities",
			id,
		})
	}

	iconPath = new vscode.ThemeIcon("window");

	getUrl(): vscode.Uri | undefined {
		return getResourceWebUrl(this.tenantName, "machine-identity", this.resourceId, { subtype: this.subtype })
	}

	updateIcon(context: vscode.ExtensionContext): void {
		this.iconPath = this.subtype === "AI Agent" ?
			new vscode.ThemeIcon("robot") : new vscode.ThemeIcon("window")
	}
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
	filterType = FilterType.api; // unused

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
			this.id!,
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
				this.id!,
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
		return sortLoadedTreeItems(this.children);
	}

	get hasMore(): boolean {
		throw new Error("Unimplemented");
	}

	getUrl(): vscode.Uri | undefined {
		return getResourceWebUrl(this.tenantName, "application", this.id as string)
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
		public readonly parentNode: ApplicationTreeItem) {
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
	status: string[]

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
		// all by default
		this.status = Object.values(Campaign2StatusEnum)
	}

	protected async loadNext(): Promise<AxiosResponse<Document[]>> {
		const limit = getConfigNumber(configuration.TREEVIEW_PAGINATION).valueOf();

		let filters = `status in ("${this.status.join('","')}")`
		if (this.filters) {
			filters += `and name sw "${escapeFilter(this.filters)}"`
		}

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
 * List of supported campaign types for which the dashboard can be displayed
 */
const SUPPORTED_CAMPAIGN_TYPES = ["MACHINE_ACCOUNT", "SOURCE_OWNER", "SEARCH", "MANAGER"]
/**
 * Certification Campaign
 */
export class CampaignTreeItem extends ISCResourceTreeItem {

	iconPath = new vscode.ThemeIcon("checklist");
	client: ISCClient;

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
		this.contextValue = status + type + "campaign";

		this.command = SUPPORTED_CAMPAIGN_TYPES.includes(type) ? {
			title: "Dashboard",
			command: commands.VIEW_CAMPAIGN_PANEL,
			arguments: [this],
		} : {
			title: "open",
			command: commands.OPEN_RESOURCE,
			arguments: [this],
		};
	}

	getUrl(): vscode.Uri | undefined {
		return getResourceWebUrl(this.tenantName, "campaign", this.id as string)
	}
}


export function isTransformTreeItem(o: BaseTreeItem): o is TransformTreeItem {
	return o.contextValue === "transform";
}

export function isIdentityAttributeTreeItem(o: BaseTreeItem): o is IdentityAttributeTreeItem {
	return o.contextValue === "identity-attribute";
}

export function isSourceTreeItem(o: BaseTreeItem): o is SourceTreeItem {
	return o instanceof SourceTreeItem;
}