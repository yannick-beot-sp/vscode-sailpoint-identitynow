export interface OwnerRef {
	type: string;
	id: string;
	name: string;
}

export interface ClusterRef {
	type: string;
	id: string;
	name: string;
}

export interface ManagedResourceRef {
	type: string;
	id: string;
	name: string;
}

export interface PlanInitializerScript {
	source: string;
}

export interface ProvisioningConfig {
	universalManager: boolean;
	managedResourceRefs: ManagedResourceRef[];
	planInitializerScript: PlanInitializerScript;
}

export interface Attributes {}

export interface BeforeProvisioningRule {
	type: string;
	id: string;
	name: string;
}

export interface ServiceDesk {
	id: string;
	name: string;
	created: string;
	modified: string;
	description: string;
	type: string;
	ownerRef: OwnerRef;
	clusterRef: ClusterRef;
	provisioningConfig: ProvisioningConfig;
	attributes: Attributes;
	beforeProvisioningRule: BeforeProvisioningRule;
}
