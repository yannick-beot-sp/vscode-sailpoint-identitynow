import { DimensionSchemaV2025 } from "sailpoint-api-client";
import { convertPascalCase2SpaceBased, isEmpty } from "./stringUtils";
import { CSV_MULTIVALUE_SEPARATOR } from "../constants";

export function dimensionSchemaToString(dimensionSchema: DimensionSchemaV2025) {

    return dimensionSchema?.dimensionAttributes?.map(x => x.name).join(CSV_MULTIVALUE_SEPARATOR)
}


export function stringToDimensionAttributes(input: string): DimensionSchemaV2025 | undefined {
    if (isEmpty(input)) {
        return undefined;
    }

    const dimensionAttributes = input
        .split(CSV_MULTIVALUE_SEPARATOR)
        .map(name => ({
            name: name.trim(),
            displayName: convertPascalCase2SpaceBased(name.trim()),
            derived: true
        }))
        .filter(attr => attr.name !== '');

    return { dimensionAttributes };
}
