import { DimensionsV2025ApiListDimensionsRequest, DimensionV2025, Role, RolesApiListRolesRequest, RoleV2025 } from "sailpoint-api-client";
import { ISCClient } from "../../services/ISCClient";
import { GenericAsyncIterableIterator } from "../../utils/GenericAsyncIterableIterator";
import { UserCancelledError } from "../../errors";

export interface DimensionWithRoleNameName extends DimensionV2025 {
    roleName: string
}


export async function* addRoleName(
    dimIterator: AsyncIterable<DimensionV2025[]>,
    roleName: string
): AsyncIterable<DimensionWithRoleNameName[]> {

    for await (const dimensions of dimIterator) {
        yield (dimensions.map(x => ({ ...x, roleName })))
    }
}


export async function* getAllDimensions(
    client: ISCClient
): AsyncIterable<DimensionWithRoleNameName[]> {
    const roleIterator = new GenericAsyncIterableIterator<RoleV2025, RolesApiListRolesRequest>(
        client,
        client.getRoles,
        {
            filters: "dimensional eq true"
        }
    )
    let yieldEmpty = true
    for await (let roles of roleIterator) {
        for (let role of roles) {
            const dimIterator = new GenericAsyncIterableIterator<DimensionV2025, DimensionsV2025ApiListDimensionsRequest>(
                client,
                client.getPaginatedDimensions, { roleId: role.id });
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
