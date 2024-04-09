import { WorkflowTreeItem } from '../../models/ISCTreeItem';
import { WorkflowTesterWebviewViewProvider } from '../../views/WorkflowTesterWebviewViewProvider';



/**
 * Command used to open a source or a transform
 */
export class TestWorkflowCommand {

    constructor(private readonly workflowTester: WorkflowTesterWebviewViewProvider) {
    }

    async execute(node: WorkflowTreeItem,): Promise<void> {
        console.log("> testWorkflow", node);
        // assessing that item is a IdentityNowResourceTreeItem
        if (node === undefined || !(node instanceof WorkflowTreeItem)) {
            console.log("WARNING: testWorkflow: invalid item", node);
            throw new Error("testWorkflow: invalid item");
        }
        this.workflowTester.showWorkflow(node.tenantName, node.id);
        console.log("< testWorkflow");
    }
}