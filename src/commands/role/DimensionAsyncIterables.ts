import { ISCClient } from "../../services/ISCClient.js";
import { GenericAsyncIterableIterator } from "../../utils/GenericAsyncIterableIterator.js";

import { Role, RolesApiListRolesV1Request } from "sailpoint-api-client/dist/roles/api.js";
import { Dimension, DimensionsApiListDimensionsV1Request } from "sailpoint-api-client/dist/dimensions/api.js";

export interface DimensionWithRoleNameName extends Dimension {
    roleName: string
}


export async function* addRoleName(
    dimIterator: AsyncIterable<Dimension[]>,
    roleName: string
): AsyncIterable<DimensionWithRoleNameName[]> {

    for await (const dimensions of dimIterator) {
        yield (dimensions.map(x => ({ ...x, roleName })))
    }
}


export async function* getAllDimensions(
    client: ISCClient
): AsyncIterable<DimensionWithRoleNameName[]> {
    const roleIterator = new GenericAsyncIterableIterator<Role, RolesApiListRolesV1Request>(
        client,
        client.getRoles,
        {
            filters: "dimensional eq true"
        }
    )
    let yieldEmpty = true
    for await (let roles of roleIterator) {
        for (let role of roles) {
            const dimIterator = new GenericAsyncIterableIterator<Dimension, DimensionsApiListDimensionsV1Request>(
                client,
                client.getPaginatedDimensions, { roleId: role.id!, sorters: "name" });
            for await (const dimensions of dimIterator) {
                if (dimensions && dimensions.length > 0) {
                    yieldEmpty = false
                    yield (dimensions.map(x => ({ ...x, roleName: role.name })))
                }
            }
        }
    }
    // Manage the case of no dimension in the tenant
    if (yieldEmpty) {
        yield []
    }

}
