import * as vscode from "vscode";
import { BaseTreeItem, FilterType, IdentitiesTreeItem, PageableNode } from "../models/ISCTreeItem";
import * as commands from "../commands/constants";
import { WizardContext } from "../wizard/wizardContext";
import { InputPromptStep } from "../wizard/inputPromptStep";
import { runWizard } from "../wizard/wizard";
import { QuickPickPromptStep } from "../wizard/quickPickPromptStep";
import { ISCTreeDataProvider } from "../views/ISCTreeDataProvider";
import { isNotEmpty } from "../utils/stringUtils";


const newFilter = (nodeFilterType: FilterType, searchFirst = false) => new QuickPickPromptStep({
    name: "filterType",
    displayName: "filter type",
    project: x => x.value,
    items: searchFirst ? [{
        label: FilterType.search,
        value: FilterType.search,
        picked: (nodeFilterType === FilterType.search)
    },
    {
        label: FilterType.api,
        value: FilterType.api,
        picked: (nodeFilterType === FilterType.api)
    }] : [{
        label: FilterType.api,
        value: FilterType.api,
        picked: (nodeFilterType === FilterType.api)
    },
    {
        label: FilterType.search,
        value: FilterType.search,
        picked: (nodeFilterType === FilterType.search)
    }]
});

class FilterInputStep extends InputPromptStep<WizardContext> {
    constructor(
        label: string,
        private filterType: FilterType,
        help: string) {
        super({
            name: "filter" + filterType,
            options: {
                placeHolder: `Filter using ${filterType}`,
                prompt: `Enter a filter for ${label}`,
                learnMoreLink: help
            },
        });
    }

    public shouldPrompt(wizardContext: WizardContext): boolean {
        return wizardContext["filterType"] === this.filterType;
    }
}

export abstract class FilterCommand {

    public async execute(node: PageableNode & BaseTreeItem): Promise<void> {
        const wizardContext: WizardContext = {};
        wizardContext["filter" + node.filterType] = node.filters;
        const values = await this.runWizard(node.filterType, wizardContext);
        
        if (values === undefined) { return; }

        node.filterType = values["filterType"];
        node.filters = values["filter" + node.filterType];
        vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
    }

    protected abstract runWizard(filterType: FilterType, wizardContext: WizardContext): Promise<WizardContext>;
}

export class AccessProfileFilterCommand extends FilterCommand {
    constructor() {
        super();
    }

    protected async runWizard(filterType: FilterType, wizardContext: WizardContext): Promise<WizardContext> {
        return await runWizard({
            title: "Filter access profiles",
            hideStepCount: true,
            promptSteps: [
                newFilter(filterType),
                new FilterInputStep("access profiles",
                    FilterType.search,
                    "https://documentation.sailpoint.com/saas/help/search/searchable-fields.html#searching-access-profile-data"),
                new FilterInputStep("access profiles",
                    FilterType.api,
                    "https://developer.sailpoint.com/idn/api/v3/list-access-profiles")
            ],
        }, wizardContext);
    }
}

export class RoleFilterCommand extends FilterCommand {
    constructor() {
        super();
    }

    protected async runWizard(filterType: FilterType, wizardContext: WizardContext): Promise<WizardContext> {
        return await runWizard({
            title: "Filter roles",
            hideStepCount: true,
            promptSteps: [
                newFilter(filterType),
                new FilterInputStep("roles",
                    FilterType.search,
                    "https://documentation.sailpoint.com/saas/help/search/searchable-fields.html#searching-role-data"),
                new FilterInputStep("roles",
                    FilterType.api,
                    "https://developer.sailpoint.com/idn/api/v3/list-roles")
            ],
        }, wizardContext);
    }
}

export class IdentityDefinitionFilterCommand extends FilterCommand {
	constructor(
		private readonly treeDataProvider?: ISCTreeDataProvider,
	) {
		super();
	}

	public async execute(node: PageableNode & BaseTreeItem): Promise<void> {
		const wizardContext: WizardContext = {};
		wizardContext["filter" + node.filterType] = node.filters;
		const values = await this.runWizard(node.filterType, wizardContext);

		if (values === undefined) {
			return;
		}

		const filterType = values["filterType"] as FilterType;
		const filters = values["filter" + filterType] as string;

		const identities = await this.treeDataProvider?.resolveIdentitiesTreeItem(node.tenantId)
			?? (node as IdentitiesTreeItem);
		identities.filterType = filterType;
		identities.filters = filters;

		vscode.commands.executeCommand(commands.REFRESH_FORCED, identities);

		if (isNotEmpty(filters)) {
			await this.treeDataProvider?.revealIdentities(identities);
		}
	}

	protected async runWizard(filterType: FilterType, wizardContext: WizardContext): Promise<WizardContext> {
        return await runWizard({
            title: "Search identities",
            hideStepCount: true,
            promptSteps: [
                newFilter(filterType, true),
                new FilterInputStep("identities",
                    FilterType.search,
                    "https://documentation.sailpoint.com/saas/help/search/searchable-fields.html#searching-identity-data"),
                new FilterInputStep("identities",
                    FilterType.api,
                    "https://developer.sailpoint.com/docs/api/identities/list-identities-v-1")
            ],
        }, wizardContext);
    }
}

