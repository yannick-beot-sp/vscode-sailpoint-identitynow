/**
 * Identity fields the notification-template API uses for its upsert.
 * There is no PUT by id: create replaces the template that shares key, medium and locale.
 */
export interface NotificationTemplateIdentity {
    id?: string;
    key?: string;
    medium?: string;
    locale?: string;
    body?: string | null;
}

/**
 * Choose the template to show and save.
 *
 * GET /notification-templates/{id} can come back empty, or as an object whose
 * `body` is missing, while the list still has the stored body. Prefer whichever
 * copy has the longer body so a save cannot write a truncated copy back.
 */
export function selectNotificationTemplate<T extends NotificationTemplateIdentity>(
    fromGet: T | undefined,
    fromList: T | undefined,
): T | undefined {
    if (!fromGet) {
        return fromList;
    }
    if (!fromList) {
        return fromGet;
    }
    const getBody = fromGet.body ?? "";
    const listBody = fromList.body ?? "";
    if (listBody.length > getBody.length) {
        return { ...fromGet, body: listBody };
    }
    return fromGet;
}

export type NotificationTemplateIdentityField = "id" | "key" | "medium" | "locale";

/**
 * The upsert targets key + medium + locale, not the id in the editor URI.
 * A save whose identity fields differ from the template that was opened would
 * create a new template or overwrite a different one.
 */
export function notificationTemplateIdentityConflict(
    stored: NotificationTemplateIdentity,
    proposed: NotificationTemplateIdentity,
): NotificationTemplateIdentityField | undefined {
    if ((proposed.id ?? "") !== (stored.id ?? "")) {
        return "id";
    }
    if ((proposed.key ?? "") !== (stored.key ?? "")) {
        return "key";
    }
    if ((proposed.medium ?? "") !== (stored.medium ?? "")) {
        return "medium";
    }
    if ((proposed.locale ?? "") !== (stored.locale ?? "")) {
        return "locale";
    }
    return undefined;
}

/** True when a save would replace a stored body with an empty one. */
export function wouldReplaceNonEmptyBody(
    storedBody: string | null | undefined,
    nextBody: string | null | undefined,
): boolean {
    return (storedBody ?? "").trim().length > 0 && (nextBody ?? "").trim().length === 0;
}
