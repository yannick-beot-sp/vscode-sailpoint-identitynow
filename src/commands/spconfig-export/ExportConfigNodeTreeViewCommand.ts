import { ExportPayloadBetaIncludeTypesEnum } from 'sailpoint-api-client';
import { IdentityNowResourceTreeItem, IdentityProfileTreeItem, RuleTreeItem, SourceTreeItem, TransformTreeItem } from '../../models/IdentityNowTreeItem';
import { PathProposer } from '../../services/PathProposer';
import { askFile, openPreview } from '../../utils/vsCodeHelpers';
import { SPConfigExporter } from './SPConfigExporter';
import { Uri } from 'vscode';


/**
 * Entrypoint to export a Node (Source, Rule, Identity Profile or transform). Tenant is known.
 */
export class ExportConfigNodeTreeViewCommand {
    constructor() {}


    private getObjectType(node: IdentityNowResourceTreeItem): ExportPayloadBetaIncludeTypesEnum {
        switch (node.constructor.name) {
            case SourceTreeItem.name:
                return ExportPayloadBetaIncludeTypesEnum.Source;
            case TransformTreeItem.name:
                return ExportPayloadBetaIncludeTypesEnum.Transform;
            case IdentityProfileTreeItem.name:
                return ExportPayloadBetaIncludeTypesEnum.IdentityProfile;
            case RuleTreeItem.name:
                return ExportPayloadBetaIncludeTypesEnum.Rule;
            default:
                throw new Error("Invalid node type:" + node.label);

        }
    }

    async execute(node?: IdentityNowResourceTreeItem): Promise<void> {

        console.log("> ExportNodeConfig.execute");
        // assessing that item is a IdentityNowResourceTreeItem
        if (node === undefined || !(node instanceof IdentityNowResourceTreeItem)) {
            console.error("ExportNodeConfig: invalid item", node);
            throw new Error("ExportNodeConfig: invalid item");
        }

        const objectType = this.getObjectType(node);
        const objectTypes = [objectType];

        var label = '';
        if (typeof node.label === "string") {
            label = node.label;
        } else {
            label = node.label?.label || "";
        }

        const exportFile = PathProposer.getSPConfigSingleResourceFilename(
            node.tenantName,
            node.tenantDisplayName,
            objectType,
            label
        );

        const target = await askFile(
            `Enter the file to save ${label} to`,
            exportFile);
        if (target === undefined) {
            return;
        }
        const options: any = {};
        options[objectType] = {
            "includedIds": [
                node.id
            ]
        };

        const exporter = new SPConfigExporter(
            node.tenantId as string,
            node.tenantName as string,
            node.tenantDisplayName as string,
            target,
            options,
            objectTypes
        );

        await exporter.exportConfigWithProgression();
        await openPreview(Uri.file(target));
    }
}
