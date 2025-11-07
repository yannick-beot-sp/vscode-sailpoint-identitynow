import { AttributeDTOList } from "sailpoint-api-client";
import { CSV_MULTIVALUE_SEPARATOR } from "../constants";

export function metadataToString(m: AttributeDTOList): string | undefined {
    return m?.attributes?.
        map(attribute => `${attribute.key}:${attribute.values.map(v => v.value).join(",")}`)
        .join(CSV_MULTIVALUE_SEPARATOR)

}