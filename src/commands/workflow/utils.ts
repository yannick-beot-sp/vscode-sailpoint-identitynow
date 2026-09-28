import { Workflow } from "sailpoint-api-client/dist/workflows/api.js";

export function cleanUpWorkflow(workflow: Workflow): Workflow {
    let w = removeUnwantedProperties(workflow)
    w = removeSecret(w)
    return w
}

const propertiesToCleanUp = [
    "created", "creator", "modified", "modifiedBy", "owner"
]

export function removeUnwantedProperties(workflow: Workflow) {

    propertiesToCleanUp.forEach(p => delete workflow[p])
    return workflow
}

export function removeSecret(obj: any) {
    for (const prop in obj) {
        if (typeof obj[prop] === 'string' && obj[prop].startsWith("$.secrets.")) { obj[prop] = null; }
        else if (typeof obj[prop] === 'object') { removeSecret(obj[prop]); }
    }
    return obj;
}