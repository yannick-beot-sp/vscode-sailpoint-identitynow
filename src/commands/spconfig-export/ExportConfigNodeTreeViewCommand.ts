import { ExportPayloadBetaIncludeTypesBeta } from 'sailpoint-api-client';
import { FormTreeItem, ISCResourceTreeItem, IdentityProfileTreeItem, RuleTreeItem, ServiceDeskTreeItem, SourceTreeItem, TransformTreeItem } from '../../models/ISCTreeItem';
import { PathProposer } from '../../services/PathProposer';
import { askFile, openPreview } from '../../utils/vsCodeHelpers';
import { SPConfigExporter } from './SPConfigExporter';


/**
 * Entrypoint to export a Node (Source, Rule, Identity Profile or transform). Tenant is known.
 */
export class ExportConfigNodeTreeViewCommand {
    constructor() { }


    private getObjectType(node: ISCResourceTreeItem): ExportPayloadBetaIncludeTypesBeta {
        switch (node.constructor.name) {
            case SourceTreeItem.name:
                return ExportPayloadBetaIncludeTypesBeta.Source;
            case TransformTreeItem.name:
                return ExportPayloadBetaIncludeTypesBeta.Transform;
            case IdentityProfileTreeItem.name:
                return ExportPayloadBetaIncludeTypesBeta.IdentityProfile;
            case RuleTreeItem.name:
                return ExportPayloadBetaIncludeTypesBeta.ConnectorRule;
            case FormTreeItem.name:
                return ExportPayloadBetaIncludeTypesBeta.FormDefinition;
            case ServiceDeskTreeItem.name:
                return ExportPayloadBetaIncludeTypesBeta.ServiceDeskIntegration;
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
        if (ExportPayloadBetaIncludeTypesBeta.FormDefinition === objectType || ExportPayloadBetaIncludeTypesBeta.ConnectorRule === objectType) {
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
