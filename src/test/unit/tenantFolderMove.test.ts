import * as assert from "assert";
import { describe, it } from "mocha";
import type { ExtensionContext, Memento, SecretStorage } from "vscode";
import { AuthenticationMethod, TenantInfo } from "../../models/TenantInfo.js";
import { TenantFolderTreeItem, TenantTreeItem } from "../../models/ISCTreeItem.js";
import { FolderTreeNode } from "../../models/TreeNode.js";
import { TenantService } from "../../services/TenantService.js";
import { ISCTreeDataProvider } from "../../views/ISCTreeDataProvider.js";

class MemoryMemento implements Pick<Memento, "keys" | "get" | "update"> {
	private readonly values = new Map<string, unknown>();

	keys(): readonly string[] {
		return [...this.values.keys()];
	}

	get<T>(key: string, defaultValue?: T): T | undefined {
		return this.values.has(key) ? this.values.get(key) as T : defaultValue;
	}

	update(key: string, value: unknown): Promise<void> {
		this.values.set(key, value);
		return Promise.resolve();
	}
}

function tenant(id: string, name: string): TenantInfo {
	return {
		id,
		name,
		tenantName: name,
		authenticationMethod: AuthenticationMethod.personalAccessToken,
		readOnly: false,
		type: "TENANT",
	};
}

function folder(id: string, name: string): FolderTreeNode {
	return { id, name, type: "FOLDER" };
}

function childIds(service: TenantService, id?: string): string[] {
	const nodes = id ? service.getChildren(id) : service.getRoots();
	return (nodes ?? []).map(node => node.id).sort();
}

function createService(): TenantService {
	const secrets = {
		get: async () => undefined,
		store: async () => undefined,
		delete: async () => undefined,
		onDidChange: () => ({ dispose() { } }),
	};
	return new TenantService(new MemoryMemento() as Memento, secrets as unknown as SecretStorage);
}

suite("Tenant folder move", () => {
	describe("nested tenants and folders", () => {
		const service = createService();
		service.updateOrCreateNode(folder("folder-a", "A"));
		service.updateOrCreateNode(folder("folder-b", "B"));
		service.updateOrCreateNode(tenant("tenant-1", "One"));
		service.updateOrCreateNode(tenant("tenant-2", "Two"));
		service.updateOrCreateNode(tenant("tenant-3", "Three"));
		service.updateOrCreateNode(tenant("tenant-4", "Four"));

		service.move("tenant-1", "folder-a");
		service.move("tenant-2", "folder-a");
		service.move("folder-b", "folder-a");
		service.move("tenant-3", "folder-b");

		it("keeps several tenants in the same folder", () => {
			assert.deepStrictEqual(childIds(service, "folder-a"), ["folder-b", "tenant-1", "tenant-2"]);
			assert.deepStrictEqual(childIds(service, "folder-b"), ["tenant-3"]);
			assert.deepStrictEqual(childIds(service), ["folder-a", "tenant-4"]);
		});

		it("reports the parent folder at each level", () => {
			assert.strictEqual(service.getParentId("tenant-1"), "folder-a");
			assert.strictEqual(service.getParentId("tenant-2"), "folder-a");
			assert.strictEqual(service.getParentId("folder-b"), "folder-a");
			assert.strictEqual(service.getParentId("tenant-3"), "folder-b");
			assert.strictEqual(service.getParentId("tenant-4"), undefined);
			assert.strictEqual(service.getParentId("folder-a"), undefined);
			assert.strictEqual(service.getParentId("missing"), undefined);
		});

		it("refuses to drop a folder into itself or into a descendant", () => {
			service.move("folder-a", "folder-a");
			service.move("folder-a", "folder-b");
			assert.strictEqual(service.getParentId("folder-a"), undefined);
			assert.strictEqual(service.getParentId("folder-b"), "folder-a");
			assert.deepStrictEqual(childIds(service, "folder-b"), ["tenant-3"]);
		});

		it("tells the tree view the same folder instance that contains the tenants", async () => {
			const provider = new ISCTreeDataProvider({} as ExtensionContext, service);
			const roots = await provider.getChildren();
			const folderA = roots.find(item => item.id === "folder-a");
			const tenant4 = roots.find(item => item.id === "tenant-4");
			assert.ok(folderA instanceof TenantFolderTreeItem);
			assert.ok(tenant4 instanceof TenantTreeItem);

			const children = await provider.getChildren(folderA);
			const tenant1 = children.find(item => item.id === "tenant-1");
			const tenant2 = children.find(item => item.id === "tenant-2");
			const folderB = children.find(item => item.id === "folder-b");
			assert.ok(tenant1 instanceof TenantTreeItem);
			assert.ok(tenant2 instanceof TenantTreeItem);
			assert.ok(folderB instanceof TenantFolderTreeItem);

			assert.strictEqual(provider.getParent(folderA), undefined);
			assert.strictEqual(provider.getParent(tenant4), undefined);
			assert.strictEqual(provider.getParent(tenant1), folderA);
			assert.strictEqual(provider.getParent(tenant2), folderA);
			assert.strictEqual(provider.getParent(folderB), folderA);

			const nested = await provider.getChildren(folderB);
			const tenant3 = nested.find(item => item.id === "tenant-3");
			assert.ok(tenant3 instanceof TenantTreeItem);
			assert.strictEqual(provider.getParent(tenant3), folderB);

			await provider.handleDrop(tenant1, { get: () => ({ value: [{ id: tenant4.id }] }) } as never, undefined as never);
			assert.strictEqual(service.getParentId("tenant-4"), "folder-a");
			assert.strictEqual(provider.getParent(tenant4), folderA);
			assert.deepStrictEqual(childIds(service, "folder-a"), ["folder-b", "tenant-1", "tenant-2", "tenant-4"]);
		});

		it("drops a tenant onto a folder that already contains a folder", async () => {
			const nested = createService();
			nested.updateOrCreateNode(folder("others", "Others"));
			nested.updateOrCreateNode(folder("tests", "tests"));
			nested.updateOrCreateNode(tenant("sofia", "Sofia"));
			nested.updateOrCreateNode(tenant("emirates", "Emirates"));
			nested.updateOrCreateNode(tenant("airliquide", "AIRLIQUIDE"));
			nested.move("tests", "others");
			nested.move("sofia", "others");
			nested.move("emirates", "tests");

			const provider = new ISCTreeDataProvider({} as ExtensionContext, nested);
			const roots = await provider.getChildren();
			const others = roots.find(item => item.id === "others");
			const airliquide = roots.find(item => item.id === "airliquide");
			assert.ok(others instanceof TenantFolderTreeItem);
			assert.ok(airliquide instanceof TenantTreeItem);
			assert.strictEqual(others.resourceUri, undefined);

			await provider.handleDrop(others, { get: () => ({ value: [{ id: airliquide.id }] }) } as never, undefined as never);
			assert.strictEqual(nested.getParentId("airliquide"), "others");
			assert.deepStrictEqual(childIds(nested, "tests"), ["emirates"]);
			assert.ok(childIds(nested, "others").includes("airliquide"));
			assert.ok(childIds(nested, "others").includes("tests"));

			const test1 = (await provider.getChildren(others)).find(item => item.id === "tests");
			assert.ok(test1 instanceof TenantFolderTreeItem);
			const dragged = { items: undefined as { id: string }[] | undefined };
			await airliquide.getChildren();
			provider.handleDrag([airliquide], {
				set: (_mime: string, item: { value: { id: string }[] }) => { dragged.items = item.value; },
			} as never, undefined as never);
			assert.deepStrictEqual(dragged.items, [{ id: "airliquide" }]);
			assert.doesNotThrow(() => JSON.stringify(dragged.items));

			await provider.handleDrop(test1, { get: () => ({ value: dragged.items }) } as never, undefined as never);
			assert.strictEqual(nested.getParentId("airliquide"), "tests");
		});
	});
});
