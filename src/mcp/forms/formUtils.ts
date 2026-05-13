import { z } from "zod";
import { refSchema } from "../inputFields";

type Ref = z.infer<typeof refSchema>;

// The Forms API sometimes returns fullName instead of name on owner objects.
export function getFormOwner(owner: (Ref & { fullName?: string }) | undefined): Ref {
    if (!owner) { return {} }
    return { ...owner, name: owner.name ?? owner.fullName };
}
