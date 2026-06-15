import * as vscode from "vscode";
import { MachineIdentitiesTreeItem } from "../../models/ISCTreeItem";
import { WizardContext } from "../../wizard/wizardContext";
import { InputPromptStep } from "../../wizard/inputPromptStep";
import { runWizard } from "../../wizard/wizard";
import { QuickPickPromptStep } from "../../wizard/quickPickPromptStep";
import { ISCClient } from "../../services/ISCClient";
import { isNotEmpty } from "../../utils/stringUtils";
import * as commands from "../constants";

const ALL_TYPES = ['AI Agent', 'Application'];

export class MachineIdentityFilterCommand {

    public async execute(node: MachineIdentitiesTreeItem): Promise<void> {
        const wizardContext: WizardContext = {
            _savedTypes: node.filterTypes,
            _savedSourceIds: node.filterSourceIds,
            filter: node.filterAdditional ?? '',
        };

        const values = await runWizard({
            title: "Filter machine identities",
            hideStepCount: true,
            promptSteps: [
                new QuickPickPromptStep({
                    name: "types",
                    displayName: "machine identity type",
                    options: { canPickMany: true },
                    storeString: true,
                    items: (context: WizardContext) => {
                        const saved = context['_savedTypes'] as string[] | undefined;
                        return ALL_TYPES.map(t => ({
                            label: t,
                            picked: saved ? saved.includes(t) : true,
                        }));
                    },
                }),
                new QuickPickPromptStep({
                    name: "sources",
                    displayName: "source",
                    options: {
                        canPickMany: true,
                        matchOnDescription: true,
                        matchOnDetail: true
                    },
                    project: (x: vscode.QuickPickItem) => (x as any).id as string,
                    items: async (context: WizardContext) => {
                        const saved = context['_savedSourceIds'] as string[] | undefined;
                        const client = new ISCClient(node.tenantId, node.tenantName);
                        const sources = await client.getSources();
                        context['_totalSourceCount'] = sources.length;
                        return sources.map(s => ({
                            ...s,
                            label: s.name ?? '',
                            detail: s.description ?? undefined,
                            description: s.connectorName ?? undefined,
                            picked: saved ? saved.includes(s.id ?? '') : true,
                        })) as vscode.QuickPickItem[];
                    }
                }),
                new InputPromptStep({
                    name: "filter",
                    options: {
                        placeHolder: "Additional API filter (optional)",
                        prompt: "Enter an additional filter for machine identities",
                        learnMoreLink: "https://developer.sailpoint.com/docs/api/v2025/list-machine-identities/"
                    }
                }),
            ],
        }, wizardContext);

        if (values === undefined) { return; }

        node.filterTypes = values['types'] as string[];
        node.filterSourceIds = values['sources'] as string[];
        node.filterAdditional = values['filter'] as string;

        node.filters = buildFilter(
            node.filterTypes ?? [],
            node.filterSourceIds ?? [],
            values['_totalSourceCount'] as number ?? 0,
            node.filterAdditional ?? ''
        );
        vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
    }
}

function buildFilter(
    selectedTypes: string[],
    selectedSourceIds: string[],
    totalSourceCount: number,
    additionalFilter: string
): string {
    const parts: string[] = [];

    if (selectedTypes.length > 0 && selectedTypes.length < ALL_TYPES.length) {
        if (selectedTypes.length === 1) {
            parts.push(`subtype eq "${selectedTypes[0]}"`);
        } else {
            const values = selectedTypes.map(t => `"${t}"`).join(', ');
            parts.push(`subtype in (${values})`);
        }
    }

    if (selectedSourceIds.length > 0 && selectedSourceIds.length < totalSourceCount) {
        if (selectedSourceIds.length === 1) {
            parts.push(`source.id eq "${selectedSourceIds[0]}"`);
        } else {
            const ids = selectedSourceIds.map(id => `"${id}"`).join(', ');
            parts.push(`source.id in (${ids})`);
        }
    }

    if (isNotEmpty(additionalFilter)) {
        parts.push(additionalFilter);
    }

    return parts.join(' and ');
}
