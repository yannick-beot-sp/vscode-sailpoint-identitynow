import { AttributeDTO, AttributeDTOList } from "sailpoint-api-client/dist/access_profiles/api.js";
import { CSV_MULTIVALUE_SEPARATOR } from "../constants.js";
import { isEmpty } from "./stringUtils.js";

export function metadataToString(m: AttributeDTOList | undefined): string | undefined {
  return m?.attributes?.
    map(attribute => `${attribute.key}:${attribute.values?.map(v => v.value).join(",")}`)
    .join(CSV_MULTIVALUE_SEPARATOR)

}


export function stringToAttributeMetadata(input: string): AttributeDTO[] | undefined {
  if (isEmpty(input)) {
    return undefined
  }

  const groups = input.split(CSV_MULTIVALUE_SEPARATOR);
  return groups.map(group => {
    // split key and values
    const [key, valuesStr] = group.split(':');

    // split values and trime
    const values = valuesStr.split(',').map(v => ({
      value: v.trim()
    }));

    return {
      key: key.trim(),
      values
    };
  });
}