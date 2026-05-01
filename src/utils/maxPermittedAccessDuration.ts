import { AccessDurationV2025, AccessDurationV2025TimeUnitV2025 } from "sailpoint-api-client";
import { isNotBlank } from "./stringUtils";
import { isEmpty } from "lodash";

function isTimeUnit(type: string | undefined): type is AccessDurationV2025TimeUnitV2025 {
    if (type === undefined) return false;
    return Object.values(AccessDurationV2025TimeUnitV2025).includes(type as AccessDurationV2025TimeUnitV2025)
}


export function formatMaxPermittedAccessDuration(value: number | undefined, timeUnit: string | undefined): AccessDurationV2025 | null {

    if (!value || isEmpty(timeUnit)) {
        return null
    }
    if (!isTimeUnit(timeUnit)) {
        throw new Error("Invalid value for maxPermittedAccessDurationTimeUnit:" + timeUnit + ". Expecting one of " + Object.values(AccessDurationV2025TimeUnitV2025).join(", "))
    }

    return {
        value: Number(value),
        timeUnit: timeUnit
    }
}