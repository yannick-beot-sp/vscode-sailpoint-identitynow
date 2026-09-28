import { ExportPayloadIncludeTypesEnum as ExportPayloadIncludeTypes } from 'sailpoint-api-client/dist/sp_config/api.js';
import { CloudRuleTreeItem, FormTreeItem, ISCResourceTreeItem, IdentityProfileTreeItem, RuleTreeItem, ServiceDeskTreeItem, SourceTreeItem, TransformTreeItem } from '../../models/ISCTreeItem.js';
import { PathProposer } from '../../services/PathProposer.js';
import { askFile, openPreview } from '../../utils/vsCodeHelpers.js';
import { SPConfigExporter } from './SPConfigExporter.js';


/**
 * Entrypoint to export a Node (Source, Rule, Identity Profile or transform). Tenant is known.
 */
export class ExportConfigNodeTreeViewCommand {
    constructor() { }


    private getObjectType(node: ISCResourceTreeItem): ExportPayloadIncludeTypes {
        switch (node.constructor.name) {
            case SourceTreeItem.name:
                return ExportPayloadIncludeTypes.Source;
            case TransformTreeItem.name:
                return ExportPayloadIncludeTypes.Transform;
            case IdentityProfileTreeItem.name:
                return ExportPayloadIncludeTypes.IdentityProfile;
            case RuleTreeItem.name:
                return ExportPayloadIncludeTypes.ConnectorRule;
            case CloudRuleTreeItem.name:
                return ExportPayloadIncludeTypes.Rule;
            case FormTreeItem.name:
                return ExportPayloadIncludeTypes.FormDefinition;
            case ServiceDeskTreeItem.name:
                return ExportPayloadIncludeTypes.ServiceDeskIntegration;
            default:
                throw new Error("Invalid node type:" + node.label);

        }
    }

    async execute(node?: ISCResourceTreeItem): Promise<void> {

        console.log("> ExportNodeConfig.execute");
        if (node === undefined || !(node instanceof ISCResourceTreeItem)) {
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
        // FIXME
        // Issue while exporting FORM_DEFINITION: needs to rely on names instead of ids
        if (ExportPayloadIncludeTypes.FormDefinition === objectType
            || ExportPayloadIncludeTypes.ConnectorRule === objectType) {
            options[objectType] = {
                "includedNames": [
                    node.label
                ]
            };
        } else {
            options[objectType] = {
                "includedIds": [
                    node.id
                ]
            };
        }

        const exporter = new SPConfigExporter(
            node.tenantId as string,
            node.tenantName as string,
            node.tenantDisplayName as string,
            target,
            options,
            objectTypes
        );

        await exporter.exportConfigWithProgression();
        await openPreview(target);
    }
}
