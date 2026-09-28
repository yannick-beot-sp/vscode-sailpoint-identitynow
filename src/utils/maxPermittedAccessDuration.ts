import { AccessDuration, AccessDurationTimeUnitEnum as AccessDurationTimeUnit } from "sailpoint-api-client/dist/access_profiles/api.js";
import { isNotBlank } from "./stringUtils.js";

function isTimeUnit(type: string | undefined): type is AccessDurationTimeUnit {
    if (type === undefined) return false;
    return Object.values(AccessDurationTimeUnit).includes(type as AccessDurationTimeUnit)
}


export function formatMaxPermittedAccessDuration(value: number | undefined, timeUnit: string | undefined): AccessDuration | null {

    if (!value || !isNotBlank(timeUnit)) {
        return null
    }
    if (!isTimeUnit(timeUnit)) {
        throw new Error("Invalid value for maxPermittedAccessDurationTimeUnit:" + timeUnit + ". Expecting one of " + Object.values(AccessDurationTimeUnit).join(", "))
    }

    return {
        value: Number(value),
        timeUnit: timeUnit
    }
}