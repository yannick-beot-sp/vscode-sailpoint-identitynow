import { DimensionSchema } from "sailpoint-api-client/dist/roles/api.js";
import { convertPascalCase2SpaceBased, isEmpty } from "./stringUtils.js";
import { CSV_MULTIVALUE_SEPARATOR } from "../constants.js";

export function dimensionSchemaToString(dimensionSchema: DimensionSchema | undefined) {
    return dimensionSchema?.dimensionAttributes?.map(x => x.name).join(CSV_MULTIVALUE_SEPARATOR)
}

export function stringToDimensionAttributes(input: string | undefined): DimensionSchema | undefined {
    if (isEmpty(input)) {
        return undefined;
    }

    const dimensionAttributes = input!
        .split(CSV_MULTIVALUE_SEPARATOR)
        .map(name => ({
            name: name.trim(),
            displayName: convertPascalCase2SpaceBased(name.trim()),
            derived: true
        }))
        .filter(attr => attr.name !== '');

    return { dimensionAttributes };
}
