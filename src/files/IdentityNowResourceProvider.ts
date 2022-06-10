import * as path from 'path';
import * as vscode from 'vscode';
import { Disposable, Event, FileChangeEvent, FileStat, FileSystemProvider, FileType, Uri } from "vscode";
import { NEW_ID } from '../constants';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { convertToText, str2Uint8Array, toTimestamp, uint8Array2Str } from '../utils';
import { getIdByUri, getNameByUri, getPathByUri } from '../utils/UriUtils';

export class IdentityNowResourceProvider implements FileSystemProvider {
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    onDidChangeFile: Event<FileChangeEvent[]> = this._emitter.event;

    watch(uri: Uri, options: { recursive: boolean; excludes: string[]; }): Disposable {
        // ignore, fires for all changes...
        return new vscode.Disposable(() => { });
    }

    async stat(uri: Uri): Promise<FileStat> {
        console.log('> IdentityNowResourceProvider.stat', uri);
        // Not optimized here but do not 
        const data = await this.lookupResource(uri);
        return {
            type: FileType.File,
            ctime: toTimestamp(data.created),
            mtime: toTimestamp(data.modified),
            size: convertToText(data).length
        };
    }
    readDirectory(uri: Uri): [string, FileType][] | Thenable<[string, FileType][]> {
        throw new Error("Method readDirectory not implemented.");
    }
    createDirectory(uri: Uri): void | Thenable<void> {
        throw new Error("Method createDirectory not implemented.");
    }
    async readFile(uri: Uri): Promise<Uint8Array> {
        console.log('> IdentityNowResourceProvider.readFile', uri);
        const data = await this.lookupResource(uri);
        return str2Uint8Array(convertToText(data));
    }

    private async lookupResource(uri: Uri): Promise<any> {
        console.log('> IdentityNowResourceProvider.lookupResource', uri);
        const tenantName = uri.authority;
        console.log('tenantName =', tenantName);
        const resourcePath = getPathByUri(uri);
        console.log('path =', resourcePath);
        if (!resourcePath) {
            throw Error("Invalid uri:" + uri);
        }
        const id = getIdByUri(uri);
        if (id === NEW_ID) {
            console.log('New file');
            return '';
        }

        const client = new IdentityNowClient(tenantName);

        const data = await client.getResource(resourcePath);
        if (!data) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }
        return data;
    }

    async writeFile(uri: Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): Promise<void> {
        console.log('> IdentityNowResourceProvider.writeFile', uri, options);

        const tenantName = uri.authority;
        console.log('tenantName =', tenantName);
        const resourcePath = getPathByUri(uri);
        console.log('path =', resourcePath);
        if (!resourcePath) {
            throw Error("Invalid uri:" + uri);
        }
        const client = new IdentityNowClient(tenantName);
        let data = uint8Array2Str(content);

        const id = path.posix.basename(resourcePath);
        if (id === NEW_ID) {
            console.log('New file');
            if (resourcePath.match("transform")) {
                const createdData = await client.createResource('/v3/transforms', data);
            } else if (resourcePath.match("schemas")
                || resourcePath.match("provisioning-policies")
                || resourcePath.match("connector-rules")) {
                const createdData = await client.createResource(path.posix.dirname(resourcePath), data);
            } else {
                throw new Error("Cannot save: invalid uri " + uri);
            }

            this._emitter.fire([({ type: vscode.FileChangeType.Created, uri })]);
        } else {

            // Need to update the content to remove id and internal properties from the payload
            // to prevent a bad request error
            if (resourcePath.match("transform")) {
                let transform = JSON.parse(data);
                delete transform.id;
                delete transform.internal;
                data = JSON.stringify(transform);
            }

            const updatedData = await client.updateResource(resourcePath, data);
            if (!updatedData) {
                throw vscode.FileSystemError.FileNotFound(uri);
            }
            this._emitter.fire([({ type: vscode.FileChangeType.Changed, uri })]);
        }
    }

    delete(uri: Uri, options: { recursive: boolean; }): void | Thenable<void> {
        throw new Error("Method delete not implemented.");
    }
    rename(oldUri: Uri, newUri: Uri, options: { overwrite: boolean; }): void | Thenable<void> {
        throw new Error("Method rename not implemented.");
    }
}

