export interface WorkflowExecution {
    id: string
    workflowId: string
    startTime: string
    closeTime: string
    status: string
}

export interface Definition {
    start: string;
    steps: object;
}

export interface TriggerAttributes {
    id: string;
    filter: string;
}

export interface Trigger {
    type: string;
    attributes: TriggerAttributes;
}

export interface Workflow {
    id: string;
    executionCount: number;
    failureCount: number;
    created: string;
    name: string;
    description: string;
    definition: Definition;
    enabled: boolean;
    trigger: Trigger;
}
