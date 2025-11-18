import { RoleCriteriaLevel1 } from "sailpoint-api-client";
import { RoleMembershipSelectorConverter } from "./RoleMembershipSelectorConverter";
import { Literal } from "./ast";

export class DimensionMembershipSelectorConverter extends RoleMembershipSelectorConverter {

    constructor() {
        super(undefined);
    }

    visitLiteral(val: Literal, arg: RoleCriteriaLevel1): void | Promise<void> {
        // cf. https://github.com/sailpoint-oss/developer.sailpoint.com/issues/867
        // @ts-ignore
        arg.stringValue = val.values?.[0];
    }
}