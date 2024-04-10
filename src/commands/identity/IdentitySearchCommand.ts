import * as vscode from 'vscode';
import { SourceTreeItem } from '../../models/IdentityNowTreeItem';
import { PathProposer } from '../../services/PathProposer';
import { askFile } from '../../utils/vsCodeHelpers';
import { BaseCSVExporter } from '../BaseExporter';
//import EntitlementPaginator from './EntitlementPaginator';
import { Entitlement } from 'sailpoint-api-client';


export class IdentitySearchCommand {


    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node?: SourceTreeItem) {
        console.log("> IdentitySearchCommand.execute");

        if (node === undefined) {
            console.error("WARNING: IdentitySearchCommand: invalid item", node);
            throw new Error("IdentitySearchCommand: invalid item");
        }

        
        //await exporter.exportFileWithProgression();
    }
}




