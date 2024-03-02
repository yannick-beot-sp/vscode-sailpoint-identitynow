import * as path from "path";
import * as vscode from "vscode";
import {
	Disposable,
	Event,
	FileChangeEvent,
	FileStat,
	FileSystemProvider,
	FileType,
	Uri,
} from "vscode";
import { NEW_ID } from "../constants";
import { IdentityNowClient } from "../services/IdentityNowClient";
import { TenantService } from "../services/TenantService";
import {
	convertToText,
	str2Uint8Array,
	toTimestamp,
	uint8Array2Str,
} from "../utils";
import { getIdByUri, getPathByUri } from "../utils/UriUtils";
import { Operation, compare } from "fast-json-patch";
import { FormDefinitionResponseBeta } from "sailpoint-api-client";

export class IdentityNowResourceProvider implements FileSystemProvider {
	private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();

	constructor(private readonly tenantService: TenantService) { }

	onDidChangeFile: Event<FileChangeEvent[]> = this._emitter.event;

	watch(
		uri: Uri,
		options: { recursive: boolean; excludes: string[] }
	): Disposable {
		// ignore, fires for all changes...
		return new vscode.Disposable(() => { });
	}

	async stat(uri: Uri): Promise<FileStat> {
		console.log("> IdentityNowResourceProvider.stat", uri);
		// Not optimized here but do not
		const data = await this.lookupResource(uri);
		const id = getIdByUri(uri);
		// const isFile = this.isUUID(id);
		const isFile = id !== "provisioning-policies" && id !== "schemas";
		return {
			type: (isFile ? FileType.File : FileType.Directory),
			ctime: toTimestamp(data.created),
			mtime: toTimestamp(data.modified),
			size: convertToText(data).length,
		};
	}
	readDirectory(
		uri: Uri
	): [string, FileType][] | Thenable<[string, FileType][]> {
		throw new Error("Method readDirectory not implemented.");
	}
	createDirectory(uri: Uri): void | Thenable<void> {
		throw new Error("Method createDirectory not implemented.");
	}
	async readFile(uri: Uri): Promise<Uint8Array> {
		console.log("> IdentityNowResourceProvider.readFile", uri);
		const data = await this.lookupResource(uri);
		return str2Uint8Array(convertToText(data));
	}

	private async lookupResource(uri: Uri): Promise<any> {
		console.log("> IdentityNowResourceProvider.lookupResource", uri);
		const tenantName = uri.authority;
		console.log("tenantName =", tenantName);
		const resourcePath = getPathByUri(uri);
		console.log("path =", resourcePath);
		if (!resourcePath) {
			throw Error("Invalid uri:" + uri);
		}
		const id = getIdByUri(uri);
		if (id === NEW_ID || id === "provisioning-policies" || id === "schemas") {
			console.log("New file");
			return "";
		}
		const tenantInfo = await this.tenantService.getTenantByTenantName(
			tenantName
		);
		if (tenantInfo === undefined) {
			throw new Error(`Could not find tenant ${tenantName}`);
		}
		const client = new IdentityNowClient(tenantInfo.id!, tenantName);

		const data = await client.getResource(resourcePath);
		if (!data) {
			throw vscode.FileSystemError.FileNotFound(uri);
		}
		return data;
	}

	async writeFile(
		uri: Uri,
		content: Uint8Array,
		options: { create: boolean; overwrite: boolean }
	): Promise<void> {
		console.log("> IdentityNowResourceProvider.writeFile", uri, options);

		const tenantName = uri.authority;
		console.log("tenantName =", tenantName);
		const resourcePath = getPathByUri(uri);
		console.log("path =", resourcePath);
		if (!resourcePath) {
			throw Error("Invalid uri:" + uri);
		}
		const tenantInfo = await this.tenantService.getTenantByTenantName(
			tenantName
		);
		const client = new IdentityNowClient(tenantInfo?.id ?? "", tenantName);
		let data = uint8Array2Str(content);

		const id = path.posix.basename(resourcePath);
		if (id === NEW_ID) {
			console.log("New file");
			if (resourcePath.match("transform")) {
				const createdData = await client.createResource("/v3/transforms", data);
			} else if (
				resourcePath.match("schemas") ||
				resourcePath.match("provisioning-policies") ||
				resourcePath.match("connector-rules") ||
				resourcePath.match("access-profiles") ||
				resourcePath.match("roles")
			) {
				const createdData = await client.createResource(
					path.posix.dirname(resourcePath),
					data
				);
			} else {
				throw new Error("Cannot save: invalid uri " + uri);
			}

			this._emitter.fire([{ type: vscode.FileChangeType.Created, uri }]);
		} else {
			// Need to update the content to remove id and internal properties from the payload
			// to prevent a bad request error
			if (resourcePath.match("transform")) {
				let transform = JSON.parse(data);
				delete transform.id;
				delete transform.internal;
				data = JSON.stringify(transform);
			} else if (resourcePath.match("form-definitions")) {
				// UI is pushing all data as a Patch. Doing the same for form definitions
				const newData = JSON.parse(data) as FormDefinitionResponseBeta
				const jsonpatch: Operation[] = [
					{
						op: 'replace',
						path: "/formElements",
						value: newData.formElements ?? []
					},
					{
						op: 'replace',
						path: "/formConditions",
						value: newData.formConditions ?? []
					},
					{
						op: 'replace',
						path: "/formInput",
						value: newData.formInput ?? []
					},
					{
						op: 'replace',
						path: "/name",
						value: newData.name
					},
					{
						op: 'replace',
						path: "/description",
						value: newData.description
					},
					{
						op: 'replace',
						path: "/usedBy",
						value: newData.usedBy ?? []
					},

				]
				await client.patchResource(
					resourcePath,
					JSON.stringify(jsonpatch)
				);

			} else if (resourcePath.match("identity-profiles|access-profiles|roles|search-attribute-config")) {
				// special treatment to send patch as PUT is not supported
				const oldData = await client.getResource(resourcePath);
				const newData = JSON.parse(data);
				if (!oldData) {
					throw vscode.FileSystemError.FileNotFound(uri);
				}
				let jsonpatch = compare(oldData, newData);
				jsonpatch = jsonpatch.filter((p) => p.path !== "/modified" && p.path !== "/identityRefreshRequired");
				let patchResourcePath;
				// Patch support for identity profiles only in beta for now
				if (!resourcePath.match("lifecycle-states")) {
					patchResourcePath = resourcePath.replace("v3", "beta");
				} else {
					patchResourcePath = resourcePath;
				}

				if (resourcePath.match("search-attribute-config")) {
					// Supported patchable fields are: /displayName, /name, /applicationAttributes
					// @ts-ignore
					jsonpatch = jsonpatch.map(p => {
						if (p.path.match("\/applicationAttributes")) {
							const value: any = {};
							const appId = path.posix.basename(p.path)
							// @ts-ignore
							value[appId] = p.op === "add" ? p.value : oldData.applicationAttributes[appId]
							return {
								op: p.op,
								path: "/applicationAttributes",
								value
							}
						} else {
							return p
						}
					})

				}

				await client.patchResource(
					patchResourcePath,
					JSON.stringify(jsonpatch)
				);
			} else {
				const updatedData = await client.updateResource(resourcePath, data);
				if (!updatedData) {
					throw vscode.FileSystemError.FileNotFound(uri);
				}
			}
			this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
		}
	}

	delete(uri: Uri, options: { recursive: boolean }): void | Thenable<void> {
		throw new Error("Method delete not implemented.");
	}
	rename(
		oldUri: Uri,
		newUri: Uri,
		options: { overwrite: boolean }
	): void | Thenable<void> {
		throw new Error("Method rename not implemented.");
	}
}
