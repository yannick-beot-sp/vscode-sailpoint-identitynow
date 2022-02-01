import * as vscode from 'vscode';
import { Disposable, Event, FileChangeEvent, FileStat, FileSystemProvider, FileType, Uri } from "vscode";
import { IdentityNowClient } from '../services/IdentityNowClient';
import { str2Uint8Array, toTimestamp, uint8Array2Str } from '../utils';
import { getIdByUri } from '../utils/UriUtils';

export class IdentityNowResourceProvider implements FileSystemProvider {
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    onDidChangeFile: Event<FileChangeEvent[]> = this._emitter.event;

    watch(uri: Uri, options: { recursive: boolean; excludes: string[]; }): Disposable {
        // ignore, fires for all changes...
        return new vscode.Disposable(() => { });
    }

    async stat(uri: Uri): FileStat | Thenable<FileStat> {
        console.log('> IdentityNowResourceProvider.stat', uri);
        // Not optimized here but do not 
        const data = await this.lookupResource(uri);
        return {
            type: FileType.File,
            ctime: toTimestamp(data.created),
            mtime: toTimestamp(data.modified),
            size: JSON.stringify(data, null, 4).length
        };
    }
    readDirectory(uri: Uri): [string, FileType][] | Thenable<[string, FileType][]> {
        throw new Error("Method readDirectory not implemented.");
    }
    createDirectory(uri: Uri): void | Thenable<void> {
        throw new Error("Method createDirectory not implemented.");
    }
    async readFile(uri: Uri): Uint8Array | Thenable<Uint8Array> {
        console.log('> IdentityNowResourceProvider.readFile', uri);
        const data = await this.lookupResource(uri);
        return str2Uint8Array(JSON.stringify(data, null, 4));
    }

    private async lookupResource(uri: Uri): Promise<any> {
        console.log('> IdentityNowResourceProvider.lookupResource', uri);
        const tenantName = uri.authority;
        console.log('tenantName =', tenantName);
        const id = getIdByUri(uri);
        console.log('id =', id);

        if (!id || !id.match(/[a-f0-9]{32}/)) {
            throw new Error("No id found or invalid:" + id);
        }
        const client = new IdentityNowClient(tenantName);

        if (uri.path.match('sources')) {
            const data = await client.getSource(id);
            if (!data) {
                throw vscode.FileSystemError.FileNotFound(uri);
            }
            return data;
        } else if (uri.path.match('transforms')) {
            throw new Error("Method not implemented.");
        }
        throw new Error("Unsupported URI: " + uri);
    }

    async writeFile(uri: Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): void | Thenable<void> {
        console.log('> IdentityNowResourceProvider.writeFile', uri, options);

        const tenantName = uri.authority;
        console.log('tenantName =', tenantName);
        const id = getIdByUri(uri);
        console.log('id =', id);

        if (!id || !id.match(/[a-f0-9]{32}/)) {
            throw new Error("No id found or invalid:" + id);
        }
        const client = new IdentityNowClient(tenantName);

        if (uri.path.match('sources')) {
            const data = uint8Array2Str(content);
            /*
            if (options.create) {
                throw new Error("Create source not implemented.");
            }*/
            const updatedData = await client.updateSource(id, data);
            if (!updatedData) {
                throw vscode.FileSystemError.FileNotFound(uri);
            }
            return;
        } else if (uri.path.match('transforms')) {
            throw new Error("transforms not implemented.");
        }
        throw new Error("Unsupported URI: " + uri);
    }
    delete(uri: Uri, options: { recursive: boolean; }): void | Thenable<void> {
        throw new Error("Method delete not implemented.");
    }
    rename(oldUri: Uri, newUri: Uri, options: { overwrite: boolean; }): void | Thenable<void> {
        throw new Error("Method rename not implemented.");
    }
}

