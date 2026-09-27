/**
 * Variables available in a notification template.
 *
 * Collected from the default templates:
 * GET /notification-template-defaults/v1
 * GET /notification-template-variables/v1/{key}/{medium}
 *
 * Email templates that the variables API does not describe are filled from
 * https://documentation.sailpoint.com/saas/help/common/emails/available_templates.html
 * Variables come from the default Body and from the Attributes table when present.
 *
 * Examples that identified a tenant or a person are placeholders.
 */
export interface NotificationTemplateVariable {
    key: string;
    type: string;
    description: string;
    example: NotificationTemplateVariableExample;
}

export type NotificationTemplateVariableExample =
    | string
    | number
    | boolean
    | null
    | NotificationTemplateVariableExample[]
    | { [key: string]: NotificationTemplateVariableExample };

export const globalVariables: NotificationTemplateVariable[] = [
    {
        "key": "__dateTool.format()",
        "type": "function",
        "description": "Converts the specified object to a date and returns a formatted string. Use a pattern (e.g. 'yyyy-MM-dd') or style (e.g. 'medium').",
        "example": "$__dateTool.format('yyyy-MM-dd', $date) or $__dateTool.format('medium', $myDate)"
    },
    {
        "key": "__dateTool.get()",
        "type": "function",
        "description": "Returns a formatted string for the current date, or with date/time styles (e.g. 'default', 'short').",
        "example": "$__dateTool.get('yyyy-M-d H:m:s') or $__dateTool.get('default', 'short')"
    },
    {
        "key": "__dateTool.getCalendar()",
        "type": "function",
        "description": "Returns a Calendar instance for the current date using the tool's timezone and locale.",
        "example": "$__dateTool.getCalendar()"
    },
    {
        "key": "__dateTool.getDate()",
        "type": "function",
        "description": "Returns a Date for the current moment derived from getCalendar().",
        "example": "$__dateTool.getDate()"
    },
    {
        "key": "__dateTool.getDateFormat()",
        "type": "function",
        "description": "Returns a DateFormat instance for the specified format, locale, and timezone.",
        "example": "$__dateTool.getDateFormat('yyyy-MM-dd', 'en-US', 'America/New_York')"
    },
    {
        "key": "__dateTool.getDay()",
        "type": "function",
        "description": "Returns the day-of-month value of the specified date or the current date.",
        "example": "$__dateTool.getDay($date)"
    },
    {
        "key": "__dateTool.getMonth()",
        "type": "function",
        "description": "Returns the month value of the specified date or the current date.",
        "example": "$__dateTool.getMonth($date)"
    },
    {
        "key": "__dateTool.getTimeZone()",
        "type": "function",
        "description": "Returns the configured TimeZone used for date formatting.",
        "example": "$__dateTool.getTimeZone()"
    },
    {
        "key": "__dateTool.getYear()",
        "type": "function",
        "description": "Returns the year value of the specified date or the current date.",
        "example": "$__dateTool.getYear($date)"
    },
    {
        "key": "__dateTool.setTimeZone()",
        "type": "function",
        "description": "Sets the timezone used for date formatting (e.g. 'America/New_York', 'UTC', etcetera).",
        "example": "$__dateTool.setTimeZone('America/New_York')"
    },
    {
        "key": "__dateTool.toCalendar()",
        "type": "function",
        "description": "Converts an object to a Calendar using the default or specified format, locale, and timezone.",
        "example": "$__dateTool.toCalendar($value) or $__dateTool.toCalendar('yyyy-MM-dd', $string)"
    },
    {
        "key": "__dateTool.toDate()",
        "type": "function",
        "description": "Converts an object to a Date using the default or specified format, locale, and timezone; returns as-is if already Date, Calendar, or Long.",
        "example": "$__dateTool.toDate($value) or $__dateTool.toDate('yyyy-MM-dd', $string)"
    },
    {
        "key": "__esc.html()",
        "type": "function",
        "description": "Escapes the characters in a string using HTML entities (e.g. &quot;, &amp;).",
        "example": "$__esc.html($value)"
    },
    {
        "key": "__esc.java()",
        "type": "function",
        "description": "Escapes the characters in a string using Java string rules (e.g. backslash and quotes).",
        "example": "$__esc.java($string)"
    },
    {
        "key": "__esc.javascript()",
        "type": "function",
        "description": "Escapes the characters in a string using JavaScript/JSON string rules.",
        "example": "$__esc.javascript($value)"
    },
    {
        "key": "__esc.json()",
        "type": "function",
        "description": "Escapes the characters in a string for safe use in JSON (in this context, same as javascript).",
        "example": "$__esc.json($value)"
    },
    {
        "key": "__esc.sql()",
        "type": "function",
        "description": "Escapes a string for suitable use in an SQL query (e.g. doubling single quotes).",
        "example": "$__esc.sql($string)"
    },
    {
        "key": "__esc.unicode()",
        "type": "function",
        "description": "Converts the specified Unicode and/or escape sequence into the associated Unicode character.",
        "example": "$__esc.unicode($string) or $__esc.unicode('\\u20AC')"
    },
    {
        "key": "__esc.unurl()",
        "type": "function",
        "description": "Unescapes a string encoded as an HTTP parameter value.",
        "example": "$__esc.unurl($string)"
    },
    {
        "key": "__esc.url()",
        "type": "function",
        "description": "Escapes a string for use as an HTTP parameter value.",
        "example": "$__esc.url($string)"
    },
    {
        "key": "__esc.velocity()",
        "type": "function",
        "description": "Escapes Apache Velocity '$' and '#' characters for display in Velocity templates post rendering (replaces $ with ${esc.d}, # with ${esc.h}).",
        "example": "$__esc.velocity($string)"
    },
    {
        "key": "__esc.xml()",
        "type": "function",
        "description": "Escapes the characters in a string using XML entities.",
        "example": "$__esc.xml($value)"
    },
    {
        "key": "__global.actionButtonColor",
        "type": "string",
        "description": "Hex color code for interactive action buttons across the UI.",
        "example": "FF5733"
    },
    {
        "key": "__global.activeLinkColor",
        "type": "string",
        "description": "Hex color code for active or selected navigation links and interactive elements.",
        "example": "0071CE"
    },
    {
        "key": "__global.brandingConfigs",
        "type": "object",
        "description": "Configuration object containing branding settings for different contexts or themes.",
        "example": {
            "default": {
                "productName": "SailPoint",
                "emailFromAddress": null,
                "actionButtonColor": "FF5733",
                "loginInformationalMessage": null,
                "standardLogoURL": "https://{tenant}.api.identitynow.com/ums/assets/custom-logos/00000000-0000-4000-8000-000000000000/00000000-0000-4000-8000-000000000000.png",
                "narrowLogoURL": null,
                "navigationColor": "0033a1",
                "activeLinkColor": "0071CE"
            }
        }
    },
    {
        "key": "__global.emailFromAddress",
        "type": "string",
        "description": "The default 'From' email address used for outgoing system notifications.",
        "example": "user@example.com"
    },
    {
        "key": "__global.emailOverride",
        "type": "string",
        "description": "An email address to override the default 'From' address for system-generated emails.",
        "example": null
    },
    {
        "key": "__global.loginInformationalMessage",
        "type": "string",
        "description": "An optional informational message to be displayed prominently on the login page.",
        "example": null
    },
    {
        "key": "__global.narrowLogoURL",
        "type": "string",
        "description": "URL for a narrow version of the logo, typically for compact displays or headers.",
        "example": null
    },
    {
        "key": "__global.navigationColor",
        "type": "string",
        "description": "Hex color code for the application's main navigation bar.",
        "example": "0033a1"
    },
    {
        "key": "__global.productName",
        "type": "string",
        "description": "The human-readable name of the product or application.",
        "example": "SailPoint"
    },
    {
        "key": "__global.productUrl",
        "type": "string",
        "description": "The base URL or entry point for the product or application.",
        "example": "https://{tenant}.identitynow.com"
    },
    {
        "key": "__global.standardLogoURL",
        "type": "string",
        "description": "URL for the standard size logo displayed on various pages.",
        "example": "https://{tenant}.api.identitynow.com/ums/assets/custom-logos/00000000-0000-4000-8000-000000000000/00000000-0000-4000-8000-000000000000.png"
    },
    {
        "key": "__numberTool.currency()",
        "type": "function",
        "description": "Convenience method equivalent to format(\"currency\", obj). Formats numbers as currency for the current locale.",
        "example": "$__numberTool.currency($myNumber)"
    },
    {
        "key": "__numberTool.format()",
        "type": "function",
        "description": "Converts the specified object to a number and returns a formatted string using a pattern or style (e.g. \"integer\", \"currency\", \"percent\").",
        "example": "$__numberTool.format('integer', $someNumber) or $__numberTool.format($myNumber)"
    },
    {
        "key": "__numberTool.getNumberFormat()",
        "type": "function",
        "description": "Returns a NumberFormat instance for the specified format and locale (e.g. 'integer', 'currency', 'percent', or 'number').",
        "example": "$__numberTool.getNumberFormat('integer', 'en-US')"
    },
    {
        "key": "__numberTool.integer()",
        "type": "function",
        "description": "Convenience method equivalent to format(\"integer\", obj). Formats numbers as integers.",
        "example": "$__numberTool.integer($myNumber)"
    },
    {
        "key": "__numberTool.number()",
        "type": "function",
        "description": "Convenience method equivalent to format(\"number\", obj). Formats numbers with locale-appropriate grouping and decimals.",
        "example": "$__numberTool.number($myNumber)"
    },
    {
        "key": "__numberTool.percent()",
        "type": "function",
        "description": "Convenience method equivalent to format(\"percent\", obj). Formats numbers as percentages.",
        "example": "$__numberTool.percent($myNumber)"
    },
    {
        "key": "__numberTool.toNumber()",
        "type": "function",
        "description": "Converts an object to a Number using the default or specified format and locale; returns as-is if already a Number.",
        "example": "$__numberTool.toNumber($value) or $__numberTool.toNumber('number', $string)"
    },
    {
        "key": "__recipient",
        "type": "object",
        "description": "Identity of the notification recipient.",
        "example": {
            "name": "user.name",
            "id": "00000000000040008000000000000000",
            "phone": "+15555550100",
            "email": "user@example.com"
        }
    },
    {
        "key": "__util.getIdentityDetailsByID()",
        "type": "function",
        "description": "Returns full identity attributes from Mice for a UUID id (no hyphens). Not the same as getUser() (preferences only).",
        "example": "$__util.getIdentityDetailsByID($someIdentityId)"
    },
    {
        "key": "__util.getIdentityRequestById()",
        "type": "function",
        "description": "Returns identity request details, including request items, from Mantis when extra template clients are enabled.",
        "example": "$__util.getIdentityRequestById($identityRequestId)"
    },
    {
        "key": "__util.getMultipleIdentitiesDetailsByID()",
        "type": "function",
        "description": "Returns a List of identity attribute maps from Mice for multiple ids in one batch request; order is undefined; missing ids are omitted.",
        "example": "$__util.getMultipleIdentitiesDetailsByID($id1, $id2) or $__util.getMultipleIdentitiesDetailsByID($myIdList)"
    },
    {
        "key": "__util.getObjectByJsonPath()",
        "type": "function",
        "description": "Returns a Java object from the given context by JSON path (e.g. $.path.to.field). Returns Map or List for nested structures.",
        "example": "$__util.getObjectByJsonPath($__contentJson, '$.path.to.object')"
    },
    {
        "key": "__util.getUser()",
        "type": "function",
        "description": "Gets a user (Recipient) from the repository by identity id. Same as CIS externalId.",
        "example": "$__util.getUser($__recipient.id)"
    },
    {
        "key": "__util.sanitizeAndValidateEmailAddress()",
        "type": "function",
        "description": "Sanitizes and validates an email address for safe use in templates.",
        "example": "$__util.sanitizeAndValidateEmailAddress($email)"
    },
    {
        "key": "date",
        "type": "object",
        "description": "Legacy alias for $__dateTool. Supports the same DateTool methods. A domain field named 'date' takes precedence.",
        "example": "$date.format('yyyy-MM-dd', $nowDate)"
    },
    {
        "key": "nowDate",
        "type": "object",
        "description": "Current java.util.Date supplied on the primary template context.",
        "example": "$nowDate"
    },
    {
        "key": "objectTypeToPrettyPrint",
        "type": "object",
        "description": "Map from requestable object type to display name, supplied on the primary template context.",
        "example": "$objectTypeToPrettyPrint.entrySet()"
    },
    {
        "key": "spTools.convertToTimeZone()",
        "type": "function",
        "description": "Returns a Calendar for a Date or Calendar in the requested timezone while preserving the instant. Blank or unknown timezone ids use the configured default.",
        "example": "$spTools.convertToTimeZone($nowDate, 'America/New_York')"
    },
    {
        "key": "spTools.escapeHtml()",
        "type": "function",
        "description": "Escapes a string for safe HTML output.",
        "example": "$spTools.escapeHtml($string)"
    },
    {
        "key": "spTools.formatDate()",
        "type": "function",
        "description": "Formats a Date or Calendar using default styles, style constants (SHORT=3, MEDIUM=2, LONG=1, FULL=0), or a pattern string. Calendar values use their own timezone.",
        "example": "1: $spTools.formatDate($nowDate) - 2: $spTools.formatDate($nowDate, 2, 2) - 3: $spTools.formatDate($calendar, 'MM/dd/yyyy HH:mm')"
    },
    {
        "key": "spTools.formatOffsetDateTimeForEmail()",
        "type": "function",
        "description": "Formats an OffsetDateTime for email (EEE MMM dd HH:mm:ss zzz yyyy).",
        "example": "$spTools.formatOffsetDateTimeForEmail($offsetDateTime)"
    },
    {
        "key": "spTools.formatURL()",
        "type": "function",
        "description": "Re-formats a URL to use the redirect service when it contains a named anchor and is under /ui/.",
        "example": "$spTools.formatURL($url)"
    }
];

export const templateVariables: Record<string, Record<string, NotificationTemplateVariable[]>> = {
    "access_profile_cleanup_notification": {
        "EMAIL": [
            {
                "key": "accessProfilesWithDeletedEntitlements",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example"
            },
            {
                "key": "disabledAccessProfiles",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example"
            }
        ]
    },
    "access_profile_owner_approval_notification": {
        "EMAIL": [
            {
                "key": "accessProfileName",
                "type": "string",
                "description": "The name of the access profile granted by the request.",
                "example": "Example Name"
            },
            {
                "key": "removeDate",
                "type": "string",
                "description": "The date on which this access will be removed.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "requestedForIdentityName",
                "type": "string",
                "description": "The name of the identity the role was requested for.",
                "example": "Example Name"
            },
            {
                "key": "requestedRoleName",
                "type": "string",
                "description": "The name of the role that contains the access profile that was granted.",
                "example": "Example Name"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "The name of the user who requested the role.",
                "example": "Example Name"
            }
        ]
    },
    "access_request_decision": {
        "EMAIL": [
            {
                "key": "accessProfileName",
                "type": "string",
                "description": "The access profile that was requested during this access request.",
                "example": "Example Name"
            },
            {
                "key": "accessRequestMetadata",
                "type": "object",
                "description": "A map of dimension attributes. Contains both Requested Dimension attributes and Matched Dimension attributes. By default, we show Requested Dimension Attributes. To use the Matched Dimension Attributes, please take reference on how requested attributes are used. Use the key “matchedRolesInformation”",
                "example": {
                    "requestContextInformation": "Example"
                }
            },
            {
                "key": "accessibleItems",
                "type": "array",
                "description": "A list of items the user can access as a result of their request being approved.",
                "example": [
                    "Example"
                ]
            },
            {
                "key": "activationRequired",
                "type": "boolean",
                "description": "Whether the requested entitlement requires activation before each use.",
                "example": true
            },
            {
                "key": "approved",
                "type": "boolean",
                "description": "Whether or not the request was approved.",
                "example": true
            },
            {
                "key": "approverName",
                "type": "string",
                "description": "The display name of the identity that approved the request.",
                "example": "Example Name"
            },
            {
                "key": "rejecterName",
                "type": "string",
                "description": "If applicable, the name of the reviewer who rejected this access request.",
                "example": "Example Name"
            },
            {
                "key": "removeDate",
                "type": "string",
                "description": "The date on which the access will be removed.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "requestedForIdentityName",
                "type": "string",
                "description": "The name of the user for whom access was requested.",
                "example": "Example Name"
            },
            {
                "key": "requestedObjectName",
                "type": "string",
                "description": "The name of item that was requested.",
                "example": "Example Name"
            },
            {
                "key": "requestedObjectType",
                "type": "string",
                "description": "The type of item that was requested.",
                "example": "Example"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "The display name of the identity that requested the app.",
                "example": "Example Name"
            },
            {
                "key": "reviewerComment",
                "type": "string",
                "description": "The comments the reviewer enters when they deny access, if applicable.",
                "example": "Example"
            },
            {
                "key": "roleRequestEnabled",
                "type": "boolean",
                "description": "Whether the role request feature is enabled for a site.",
                "example": true
            },
            {
                "key": "sourceInformation",
                "type": "array",
                "description": "A list of mapping for account source information in case of multi account request. Map contains the following keys: - sourceAccountName - sourceAccountId - sourceName Note: This is only populated if supplied as part of the account request payload. The Request Center will always provide this, though the account name and ID may be null if the user did not already have an account on the source. This will only be blank for requests submitted through an API call that omits account selection, which is allowed when the user has one or no accounts.",
                "example": [
                    {
                        "sourceAccountName": "Example Name",
                        "sourceAccountId": "00000000-0000-4000-8000-000000000000",
                        "sourceName": "Example Name"
                    }
                ]
            }
        ]
    },
    "access_request_decision_email_for_requested-for_identity": {
        "EMAIL": [
            {
                "key": "accessRequestMetadata",
                "type": "object",
                "description": "A map of dimension attributes. Contains both Requested Dimension attributes and Matched Dimension attributes. By default, we show Requested Dimension Attributes. To use the Matched Dimension Attributes, please take reference on how requested attributes are used. Use the key “matchedRolesInformation”",
                "example": {
                    "requestContextInformation": "Example"
                }
            },
            {
                "key": "activationRequired",
                "type": "boolean",
                "description": "Whether the requested entitlement requires activation before each use.",
                "example": true
            },
            {
                "key": "approved",
                "type": "boolean",
                "description": "Whether the access request was approved.",
                "example": true
            },
            {
                "key": "approverName",
                "type": "string",
                "description": "The display name of the identity that approved the request.",
                "example": "Example Name"
            },
            {
                "key": "dateRequested",
                "type": "string",
                "description": "The date the request was made.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "rejecterName",
                "type": "string",
                "description": "The display name of the identity who denied the request.",
                "example": "Example Name"
            },
            {
                "key": "removeDate",
                "type": "string",
                "description": "The date on which the access will be removed.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "requestedForIdentityName",
                "type": "string",
                "description": "The display name of the identity that the access was requested for.",
                "example": "Example Name"
            },
            {
                "key": "requestedObjectName",
                "type": "string",
                "description": "The name of item requested.",
                "example": "Example Name"
            },
            {
                "key": "requestedObjectType",
                "type": "string",
                "description": "The type of item requested.",
                "example": "Example"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "The display name of the identity who requested the access.",
                "example": "Example Name"
            },
            {
                "key": "reviewerComment",
                "type": "string",
                "description": "If available, any comments left by the reviewer.",
                "example": "Example"
            },
            {
                "key": "roleRequestEnabled",
                "type": "boolean",
                "description": "Whether the role request feature is enabled for a site.",
                "example": true
            },
            {
                "key": "sourceInformation",
                "type": "array",
                "description": "A list of mapping for account source information in case of multi account request. Map contains the following keys: - sourceAccountName - sourceAccountId - sourceName Note: This should only be used in case of multiple accounts. Otherwise, this variable will not be populated.",
                "example": [
                    {
                        "sourceAccountName": "Example Name",
                        "sourceAccountId": "00000000-0000-4000-8000-000000000000",
                        "sourceName": "Example Name"
                    }
                ]
            }
        ]
    },
    "access_request_for_identity_with_multiple_accounts_failed": {
        "EMAIL": [
            {
                "key": "recipientName",
                "type": "string",
                "description": "The name of the recipient.",
                "example": "Example Name"
            },
            {
                "key": "requestItemName",
                "type": "string",
                "description": "The name of the requested item.",
                "example": "Example Name"
            },
            {
                "key": "sourceName",
                "type": "string",
                "description": "The name of the source.",
                "example": "Example Name"
            }
        ]
    },
    "access_request_ready_for_review": {
        "SLACK": [
            {
                "key": "accessibleItems",
                "type": "array",
                "description": "Names of nested access items on a requested role. Empty for access profiles and entitlements.",
                "example": [
                    "Sales Access",
                    "Finance Reporting"
                ]
            },
            {
                "key": "accessProfileDescription",
                "type": "string",
                "description": "Description of the requested access profile. Present only for access profile requests.",
                "example": "This access allows viewing and managing sales records"
            },
            {
                "key": "accessProfileName",
                "type": "string",
                "description": "Name of the requested access profile. Present only for access profile requests.",
                "example": "Sales Access"
            },
            {
                "key": "accessRequestItemsWithApprovals",
                "type": "array",
                "description": "Requested access items and the approvals generated for each item.",
                "example": [
                    {
                        "accessRequestItem": {
                            "id": "00000000000040008000000000000000",
                            "name": "Finance Analyst",
                            "description": "Role granting finance reporting and sales-record access",
                            "type": "ROLE",
                            "removeDate": "2026-12-15T17:00:00Z",
                            "requesterComment": {
                                "comment": "Please review this access request",
                                "author": {
                                    "id": "00000000000040008000000000000000",
                                    "name": "Rebecca Requester",
                                    "type": "IDENTITY"
                                }
                            },
                            "clientMetadata": "{snowRITM=RITM001234, ticketId=INC009876}",
                            "dimensionContext": null
                        },
                        "approvals": [
                            {
                                "approvalScheme": "owner"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "accessRequestType",
                "type": "string",
                "description": "Access request operation.",
                "example": "GRANT_ACCESS"
            },
            {
                "key": "approvalName",
                "type": "string",
                "description": "Display name of the approval request",
                "example": "Request for Access to Sales Application"
            },
            {
                "key": "approverPath",
                "type": "string",
                "description": "URL path to the approver dashboard",
                "example": "approvals/requested-items"
            },
            {
                "key": "assignmentContext",
                "type": "object",
                "description": "Assignment context for a dynamic role request. Null or absent for a static role.",
                "example": {}
            },
            {
                "key": "attributes",
                "type": "object",
                "description": "Comprehensive attributes map containing approval details, identities, comments, history, configuration, and other custom fields specific to particular approval request types",
                "example": {
                    "approvalID": "00000000-0000-4000-8000-000000000000",
                    "type": "ACCESS_REQUEST_APPROVAL",
                    "approvers": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "serialOrder": 1,
                            "email": "user@example.com"
                        },
                        {
                            "identityID": "00000000-0000-4000-8000-000000000000",
                            "type": "GOVERNANCE_GROUP",
                            "name": "Test Group 1",
                            "members": [
                                {
                                    "id": "00000000000040008000000000000000",
                                    "type": "IDENTITY",
                                    "name": "Barry Member",
                                    "email": "user@example.com"
                                }
                            ],
                            "serialOrder": 2
                        }
                    ],
                    "assignedTo": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "email": "user@example.com"
                        }
                    ],
                    "createdDate": "2047-08-30T18:16:29.053371Z",
                    "dueDate": "2047-09-21T12:30:0.0Z",
                    "description": "This access allows viewing and managing sales records",
                    "requester": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Rebecca Requester",
                        "email": "user@example.com"
                    },
                    "requestee": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Ruby Requestee",
                        "email": "user@example.com"
                    },
                    "comments": [
                        {
                            "commentId": "00000000-0000-4000-8000-000000000000",
                            "author": {
                                "identityID": "00000000000040008000000000000000",
                                "name": "Rebecca Requester"
                            },
                            "comment": "Lorem ipsum dolor sit amet.",
                            "createdDate": "2026-02-13T18:48:54.452979Z"
                        }
                    ],
                    "approvalCriteria": {
                        "type": "SERIAL",
                        "rejection": {
                            "calculationType": "COUNT",
                            "value": 1
                        },
                        "approval": {
                            "calculationType": "PERCENT",
                            "value": 100
                        }
                    },
                    "reassignmentHistory": [
                        {
                            "reassignmentType": "ESCALATION",
                            "reassignedFrom": {
                                "identityID": "00000000000040008000000000000000",
                                "type": "IDENTITY",
                                "name": "Will Approver"
                            },
                            "reassignedTo": {
                                "identityID": "00000000-0000-4000-8000-000000000000",
                                "type": "GOVERNANCE_GROUP",
                                "name": "Test Group 1"
                            },
                            "reassigner": {
                                "identityID": "System Automation",
                                "type": "IDENTITY"
                            },
                            "reassignmentDate": "2047-08-30T18:23:52.817415Z"
                        }
                    ],
                    "approvedBy": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "decisionDate": "2026-02-13T18:54:09.981077Z",
                            "email": "user@example.com"
                        }
                    ],
                    "completedDate": "",
                    "status": "PENDING",
                    "approvalConfig": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "scope": "APPROVAL_REQUEST",
                        "reminderConfig": {
                            "enabled": true,
                            "daysUntilFirstReminder": 2,
                            "reminderCronSchedule": "0 8 * * *",
                            "maxReminders": 2
                        },
                        "escalationConfig": {
                            "enabled": true,
                            "daysUntilFirstEscalation": 4,
                            "escalationCronSchedule": "0 8 */4 * *"
                        },
                        "timeoutConfig": {
                            "enabled": true,
                            "daysUntilTimeout": 7,
                            "timeoutResult": "EXPIRED"
                        },
                        "requiresComment": "ALL",
                        "autoApprove": "OFF"
                    },
                    "requestedTarget": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "type": "ACCESS_PROFILE",
                        "name": "Sales Access"
                    },
                    "requestedAccounts": "[{\"sourceId\":\"00000000000040008000000000000000\",\"accounts\":[{\"accountUuid\":\"00000000-0000-4000-8000-000000000000\",\"nativeIdentity\":\"CN=Ruby Requestee,OU=Users,DC=example,DC=com\"}]}]",
                    "clientMetadata": {
                        "snowRITM": "RITM001234",
                        "ticketId": "INC009876"
                    },
                    "maxPermittedAccessDuration": {
                        "timeUnit": "HOURS",
                        "value": 4
                    },
                    "requireEndDate": true,
                    "timeoutDate": "2026-12-15T17:00:00Z",
                    "form": {
                        "formDefinitionId": "fd-00000000-0000-4000-8000-000000000000",
                        "formInstanceId": "fi-00000000-0000-4000-8000-000000000000",
                        "formData": {
                            "businessJustification": "Quarter-end close",
                            "managerAcknowledged": "yes"
                        },
                        "formElements": [
                            {
                                "id": "el-businessJustification",
                                "elementType": "TEXT"
                            }
                        ],
                        "formConditions": [
                            {
                                "condition": "always"
                            }
                        ],
                        "formInstanceInputs": {
                            "requestedFor": "00000000000040008000000000000000"
                        }
                    },
                    "sodViolationContext": {
                        "state": "SUCCESS",
                        "violationCheckResult": {
                            "message": {
                                "locale": "en-US",
                                "localeOrigin": "DEFAULT",
                                "text": ""
                            },
                            "violatedPolicies": [
                                {
                                    "type": "SOD_POLICY",
                                    "id": "00000000-0000-4000-8000-000000000000",
                                    "name": "SOD Policy Test"
                                }
                            ],
                            "violationContexts": [
                                {
                                    "policy": {
                                        "type": "SOD_POLICY",
                                        "id": "00000000-0000-4000-8000-000000000000",
                                        "name": "SOD Policy Test"
                                    },
                                    "conflictingAccessCriteria": {
                                        "leftCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Helpdesk"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "TestGroup"
                                                }
                                            ]
                                        },
                                        "rightCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Certifications"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Dashboard"
                                                }
                                            ]
                                        }
                                    }
                                }
                            ],
                            "clientMetadata": {
                                "targetIdentityName": "Ruby Requestee",
                                "accessRequestId": "00000000000040008000000000000000",
                                "identityRequestId": "00000000000040008000000000000000",
                                "workflowCaseId": "00000000000040008000000000000000"
                            }
                        },
                        "uuid": "00000000-0000-4000-8000-000000000000"
                    },
                    "preApprovalResult": {
                        "reviewer": "urn:identity:pre-approver",
                        "approved": true,
                        "comment": "Pre-approval trigger approved this request"
                    },
                    "privilegeLevel": "HIGH",
                    "privileged": "HIGH",
                    "jitDetails": [
                        {
                            "applicationId": "00000000000040008000000000000000",
                            "attributeName": "memberOf",
                            "attributeValues": [
                                "CN=Helpdesk,OU=Groups,DC=example,DC=com"
                            ]
                        }
                    ],
                    "timeoutComment": "Request for a change of assignment start date was expired by the system because the original start date/time was reached.",
                    "removeDateUpdateRequested": true,
                    "currentRemoveDate": "2026-12-01T17:00:00Z",
                    "startDateUpdateRequested": true,
                    "currentStartDate": "2026-09-01T08:00:00Z"
                }
            },
            {
                "key": "batchSize",
                "type": "number",
                "description": "Number of batched requests relating to this approval request",
                "example": 1
            },
            {
                "key": "clientMetadata",
                "type": "string",
                "description": "Java toString of client metadata. Use attributes.clientMetadata for the structured map.",
                "example": "{snowRITM=RITM001234, ticketId=INC009876}"
            },
            {
                "key": "commentRequiredWhenRejected",
                "type": "boolean",
                "description": "Whether a comment is required when the reviewer denies the request.",
                "example": true
            },
            {
                "key": "dimensionContext",
                "type": "object",
                "description": "Dimension context for a dynamic role request.",
                "example": {}
            },
            {
                "key": "dueDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the approval is due for completion",
                "example": "2047-09-21T12:30:0.0Z"
            },
            {
                "key": "fullNotificationConfigForSpApprovals",
                "type": "boolean",
                "description": "Whether the full notification configuration was passed through to sp-approvals.",
                "example": true
            },
            {
                "key": "id",
                "type": "string",
                "description": "Identity request identifier associated with this approval.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "latestComment",
                "type": "string",
                "description": "Most recent comment on the approval",
                "example": "Lorem ipsum dolor sit amet."
            },
            {
                "key": "latestCommentAuthor",
                "type": "object",
                "description": "Author of the most recent comment",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "name": "Rebecca Requester"
                }
            },
            {
                "key": "matchedRolesInformation",
                "type": "object",
                "description": "Matched dynamic-role attribute values keyed by attribute name. Empty for a static role.",
                "example": {}
            },
            {
                "key": "removeDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to end.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "requestContextInformation",
                "type": "object",
                "description": "Requested dynamic-role context attributes. Empty for a static role.",
                "example": {}
            },
            {
                "key": "requestedAppName",
                "type": "string",
                "description": "Application display name when an entitlement is requested through an application.",
                "example": "Active Directory"
            },
            {
                "key": "requestedBy",
                "type": "object",
                "description": "Identity who submitted the access request.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Rebecca Requester",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedFor",
                "type": "object",
                "description": "Identity for whom access was requested.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Ruby Requestee",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedForIdentityName",
                "type": "string",
                "description": "Display name of the identity for whom access was requested.",
                "example": "Ruby Requestee"
            },
            {
                "key": "requestedObject",
                "type": "object",
                "description": "Requested access object.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Finance Analyst",
                    "description": "Role granting finance reporting and sales-record access",
                    "type": "ROLE"
                }
            },
            {
                "key": "requestedObjectDescription",
                "type": "string",
                "description": "Description of the requested access object.",
                "example": "Role granting finance reporting and sales-record access"
            },
            {
                "key": "requestedObjectName",
                "type": "string",
                "description": "Name of the requested access object.",
                "example": "Finance Analyst"
            },
            {
                "key": "requestedObjectType",
                "type": "string",
                "description": "Display-cased type of the requested object.",
                "example": "Role"
            },
            {
                "key": "requestee",
                "type": "object",
                "description": "Identity for whom the approval request was made",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Ruby Requestee",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requester",
                "type": "object",
                "description": "Identity who submitted the approval request",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Rebecca Requester",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requesterComment",
                "type": "object",
                "description": "Requester comment captured when the access request was submitted.",
                "example": {
                    "comment": "Please review this access request",
                    "author": {
                        "id": "00000000000040008000000000000000",
                        "name": "Rebecca Requester",
                        "type": "IDENTITY"
                    }
                }
            },
            {
                "key": "requesterComments",
                "type": "string",
                "description": "Plain-text reason the requester gave when submitting the request.",
                "example": "Please review this access request"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "Display name of the identity who submitted the request.",
                "example": "Rebecca Requester"
            },
            {
                "key": "roleRequestEnabled",
                "type": "boolean",
                "description": "Whether role request handling is enabled for this notification context.",
                "example": true
            },
            {
                "key": "sourceInformation",
                "type": "array",
                "description": "Requested accounts grouped by source ID.",
                "example": [
                    {
                        "sourceId": "00000000000040008000000000000000",
                        "accounts": [
                            {
                                "accountUuid": "00000000-0000-4000-8000-000000000000",
                                "nativeIdentity": "CN=Ruby Requestee,OU=Users,DC=example,DC=com"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "startDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to start.",
                "example": "2026-09-15T08:00:00Z"
            },
            {
                "key": "type",
                "type": "string",
                "description": "Type of approval request",
                "example": "ACCESS_REQUEST_APPROVAL"
            }
        ],
        "TEAMS": [
            {
                "key": "accessibleItems",
                "type": "array",
                "description": "Names of nested access items on a requested role. Empty for access profiles and entitlements.",
                "example": [
                    "Sales Access",
                    "Finance Reporting"
                ]
            },
            {
                "key": "accessProfileDescription",
                "type": "string",
                "description": "Description of the requested access profile. Present only for access profile requests.",
                "example": "This access allows viewing and managing sales records"
            },
            {
                "key": "accessProfileName",
                "type": "string",
                "description": "Name of the requested access profile. Present only for access profile requests.",
                "example": "Sales Access"
            },
            {
                "key": "accessRequestItemsWithApprovals",
                "type": "array",
                "description": "Requested access items and the approvals generated for each item.",
                "example": [
                    {
                        "accessRequestItem": {
                            "id": "00000000000040008000000000000000",
                            "name": "Finance Analyst",
                            "description": "Role granting finance reporting and sales-record access",
                            "type": "ROLE",
                            "removeDate": "2026-12-15T17:00:00Z",
                            "requesterComment": {
                                "comment": "Please review this access request",
                                "author": {
                                    "id": "00000000000040008000000000000000",
                                    "name": "Rebecca Requester",
                                    "type": "IDENTITY"
                                }
                            },
                            "clientMetadata": "{snowRITM=RITM001234, ticketId=INC009876}",
                            "dimensionContext": null
                        },
                        "approvals": [
                            {
                                "approvalScheme": "owner"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "accessRequestType",
                "type": "string",
                "description": "Access request operation.",
                "example": "GRANT_ACCESS"
            },
            {
                "key": "approvalName",
                "type": "string",
                "description": "Display name of the approval request",
                "example": "Request for Access to Sales Application"
            },
            {
                "key": "approverPath",
                "type": "string",
                "description": "URL path to the approver dashboard",
                "example": "approvals/requested-items"
            },
            {
                "key": "assignmentContext",
                "type": "object",
                "description": "Assignment context for a dynamic role request. Null or absent for a static role.",
                "example": {}
            },
            {
                "key": "attributes",
                "type": "object",
                "description": "Comprehensive attributes map containing approval details, identities, comments, history, configuration, and other custom fields specific to particular approval request types",
                "example": {
                    "approvalID": "00000000-0000-4000-8000-000000000000",
                    "type": "ACCESS_REQUEST_APPROVAL",
                    "approvers": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "serialOrder": 1,
                            "email": "user@example.com"
                        },
                        {
                            "identityID": "00000000-0000-4000-8000-000000000000",
                            "type": "GOVERNANCE_GROUP",
                            "name": "Test Group 1",
                            "members": [
                                {
                                    "id": "00000000000040008000000000000000",
                                    "type": "IDENTITY",
                                    "name": "Barry Member",
                                    "email": "user@example.com"
                                }
                            ],
                            "serialOrder": 2
                        }
                    ],
                    "assignedTo": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "email": "user@example.com"
                        }
                    ],
                    "createdDate": "2047-08-30T18:16:29.053371Z",
                    "dueDate": "2047-09-21T12:30:0.0Z",
                    "description": "This access allows viewing and managing sales records",
                    "requester": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Rebecca Requester",
                        "email": "user@example.com"
                    },
                    "requestee": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Ruby Requestee",
                        "email": "user@example.com"
                    },
                    "comments": [
                        {
                            "commentId": "00000000-0000-4000-8000-000000000000",
                            "author": {
                                "identityID": "00000000000040008000000000000000",
                                "name": "Rebecca Requester"
                            },
                            "comment": "Lorem ipsum dolor sit amet.",
                            "createdDate": "2026-02-13T18:48:54.452979Z"
                        }
                    ],
                    "approvalCriteria": {
                        "type": "SERIAL",
                        "rejection": {
                            "calculationType": "COUNT",
                            "value": 1
                        },
                        "approval": {
                            "calculationType": "PERCENT",
                            "value": 100
                        }
                    },
                    "reassignmentHistory": [
                        {
                            "reassignmentType": "ESCALATION",
                            "reassignedFrom": {
                                "identityID": "00000000000040008000000000000000",
                                "type": "IDENTITY",
                                "name": "Will Approver"
                            },
                            "reassignedTo": {
                                "identityID": "00000000-0000-4000-8000-000000000000",
                                "type": "GOVERNANCE_GROUP",
                                "name": "Test Group 1"
                            },
                            "reassigner": {
                                "identityID": "System Automation",
                                "type": "IDENTITY"
                            },
                            "reassignmentDate": "2047-08-30T18:23:52.817415Z"
                        }
                    ],
                    "approvedBy": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "decisionDate": "2026-02-13T18:54:09.981077Z",
                            "email": "user@example.com"
                        }
                    ],
                    "completedDate": "",
                    "status": "PENDING",
                    "approvalConfig": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "scope": "APPROVAL_REQUEST",
                        "reminderConfig": {
                            "enabled": true,
                            "daysUntilFirstReminder": 2,
                            "reminderCronSchedule": "0 8 * * *",
                            "maxReminders": 2
                        },
                        "escalationConfig": {
                            "enabled": true,
                            "daysUntilFirstEscalation": 4,
                            "escalationCronSchedule": "0 8 */4 * *"
                        },
                        "timeoutConfig": {
                            "enabled": true,
                            "daysUntilTimeout": 7,
                            "timeoutResult": "EXPIRED"
                        },
                        "requiresComment": "ALL",
                        "autoApprove": "OFF"
                    },
                    "requestedTarget": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "type": "ACCESS_PROFILE",
                        "name": "Sales Access"
                    },
                    "requestedAccounts": "[{\"sourceId\":\"00000000000040008000000000000000\",\"accounts\":[{\"accountUuid\":\"00000000-0000-4000-8000-000000000000\",\"nativeIdentity\":\"CN=Ruby Requestee,OU=Users,DC=example,DC=com\"}]}]",
                    "clientMetadata": {
                        "snowRITM": "RITM001234",
                        "ticketId": "INC009876"
                    },
                    "maxPermittedAccessDuration": {
                        "timeUnit": "HOURS",
                        "value": 4
                    },
                    "requireEndDate": true,
                    "timeoutDate": "2026-12-15T17:00:00Z",
                    "form": {
                        "formDefinitionId": "fd-00000000-0000-4000-8000-000000000000",
                        "formInstanceId": "fi-00000000-0000-4000-8000-000000000000",
                        "formData": {
                            "businessJustification": "Quarter-end close",
                            "managerAcknowledged": "yes"
                        },
                        "formElements": [
                            {
                                "id": "el-businessJustification",
                                "elementType": "TEXT"
                            }
                        ],
                        "formConditions": [
                            {
                                "condition": "always"
                            }
                        ],
                        "formInstanceInputs": {
                            "requestedFor": "00000000000040008000000000000000"
                        }
                    },
                    "sodViolationContext": {
                        "state": "SUCCESS",
                        "violationCheckResult": {
                            "message": {
                                "locale": "en-US",
                                "localeOrigin": "DEFAULT",
                                "text": ""
                            },
                            "violatedPolicies": [
                                {
                                    "type": "SOD_POLICY",
                                    "id": "00000000-0000-4000-8000-000000000000",
                                    "name": "SOD Policy Test"
                                }
                            ],
                            "violationContexts": [
                                {
                                    "policy": {
                                        "type": "SOD_POLICY",
                                        "id": "00000000-0000-4000-8000-000000000000",
                                        "name": "SOD Policy Test"
                                    },
                                    "conflictingAccessCriteria": {
                                        "leftCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Helpdesk"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "TestGroup"
                                                }
                                            ]
                                        },
                                        "rightCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Certifications"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Dashboard"
                                                }
                                            ]
                                        }
                                    }
                                }
                            ],
                            "clientMetadata": {
                                "targetIdentityName": "Ruby Requestee",
                                "accessRequestId": "00000000000040008000000000000000",
                                "identityRequestId": "00000000000040008000000000000000",
                                "workflowCaseId": "00000000000040008000000000000000"
                            }
                        },
                        "uuid": "00000000-0000-4000-8000-000000000000"
                    },
                    "preApprovalResult": {
                        "reviewer": "urn:identity:pre-approver",
                        "approved": true,
                        "comment": "Pre-approval trigger approved this request"
                    },
                    "privilegeLevel": "HIGH",
                    "privileged": "HIGH",
                    "jitDetails": [
                        {
                            "applicationId": "00000000000040008000000000000000",
                            "attributeName": "memberOf",
                            "attributeValues": [
                                "CN=Helpdesk,OU=Groups,DC=example,DC=com"
                            ]
                        }
                    ],
                    "timeoutComment": "Request for a change of assignment start date was expired by the system because the original start date/time was reached.",
                    "removeDateUpdateRequested": true,
                    "currentRemoveDate": "2026-12-01T17:00:00Z",
                    "startDateUpdateRequested": true,
                    "currentStartDate": "2026-09-01T08:00:00Z"
                }
            },
            {
                "key": "batchSize",
                "type": "number",
                "description": "Number of batched requests relating to this approval request",
                "example": 1
            },
            {
                "key": "clientMetadata",
                "type": "string",
                "description": "Java toString of client metadata. Use attributes.clientMetadata for the structured map.",
                "example": "{snowRITM=RITM001234, ticketId=INC009876}"
            },
            {
                "key": "commentRequiredWhenRejected",
                "type": "boolean",
                "description": "Whether a comment is required when the reviewer denies the request.",
                "example": true
            },
            {
                "key": "dimensionContext",
                "type": "object",
                "description": "Dimension context for a dynamic role request.",
                "example": {}
            },
            {
                "key": "dueDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the approval is due for completion",
                "example": "2047-09-21T12:30:0.0Z"
            },
            {
                "key": "fullNotificationConfigForSpApprovals",
                "type": "boolean",
                "description": "Whether the full notification configuration was passed through to sp-approvals.",
                "example": true
            },
            {
                "key": "id",
                "type": "string",
                "description": "Identity request identifier associated with this approval.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "latestComment",
                "type": "string",
                "description": "Most recent comment on the approval",
                "example": "Lorem ipsum dolor sit amet."
            },
            {
                "key": "latestCommentAuthor",
                "type": "object",
                "description": "Author of the most recent comment",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "name": "Rebecca Requester"
                }
            },
            {
                "key": "matchedRolesInformation",
                "type": "object",
                "description": "Matched dynamic-role attribute values keyed by attribute name. Empty for a static role.",
                "example": {}
            },
            {
                "key": "removeDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to end.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "requestContextInformation",
                "type": "object",
                "description": "Requested dynamic-role context attributes. Empty for a static role.",
                "example": {}
            },
            {
                "key": "requestedAppName",
                "type": "string",
                "description": "Application display name when an entitlement is requested through an application.",
                "example": "Active Directory"
            },
            {
                "key": "requestedBy",
                "type": "object",
                "description": "Identity who submitted the access request.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Rebecca Requester",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedFor",
                "type": "object",
                "description": "Identity for whom access was requested.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Ruby Requestee",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedForIdentityName",
                "type": "string",
                "description": "Display name of the identity for whom access was requested.",
                "example": "Ruby Requestee"
            },
            {
                "key": "requestedObject",
                "type": "object",
                "description": "Requested access object.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Finance Analyst",
                    "description": "Role granting finance reporting and sales-record access",
                    "type": "ROLE"
                }
            },
            {
                "key": "requestedObjectDescription",
                "type": "string",
                "description": "Description of the requested access object.",
                "example": "Role granting finance reporting and sales-record access"
            },
            {
                "key": "requestedObjectName",
                "type": "string",
                "description": "Name of the requested access object.",
                "example": "Finance Analyst"
            },
            {
                "key": "requestedObjectType",
                "type": "string",
                "description": "Display-cased type of the requested object.",
                "example": "Role"
            },
            {
                "key": "requestee",
                "type": "object",
                "description": "Identity for whom the approval request was made",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Ruby Requestee",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requester",
                "type": "object",
                "description": "Identity who submitted the approval request",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Rebecca Requester",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requesterComment",
                "type": "object",
                "description": "Requester comment captured when the access request was submitted.",
                "example": {
                    "comment": "Please review this access request",
                    "author": {
                        "id": "00000000000040008000000000000000",
                        "name": "Rebecca Requester",
                        "type": "IDENTITY"
                    }
                }
            },
            {
                "key": "requesterComments",
                "type": "string",
                "description": "Plain-text reason the requester gave when submitting the request.",
                "example": "Please review this access request"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "Display name of the identity who submitted the request.",
                "example": "Rebecca Requester"
            },
            {
                "key": "roleRequestEnabled",
                "type": "boolean",
                "description": "Whether role request handling is enabled for this notification context.",
                "example": true
            },
            {
                "key": "sourceInformation",
                "type": "array",
                "description": "Requested accounts grouped by source ID.",
                "example": [
                    {
                        "sourceId": "00000000000040008000000000000000",
                        "accounts": [
                            {
                                "accountUuid": "00000000-0000-4000-8000-000000000000",
                                "nativeIdentity": "CN=Ruby Requestee,OU=Users,DC=example,DC=com"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "startDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to start.",
                "example": "2026-09-15T08:00:00Z"
            },
            {
                "key": "type",
                "type": "string",
                "description": "Type of approval request",
                "example": "ACCESS_REQUEST_APPROVAL"
            }
        ]
    },
    "access_request_reassignment": {
        "EMAIL": [
            {
                "key": "accessProfileDescription",
                "type": "string",
                "description": "Description of the requested access profile. Present only for access profile requests.",
                "example": "This access allows viewing and managing sales records"
            },
            {
                "key": "accessProfileName",
                "type": "string",
                "description": "Name of the requested access profile. Present only for access profile requests.",
                "example": "Sales Access"
            },
            {
                "key": "accessRequestItemsWithApprovals",
                "type": "array",
                "description": "Requested access items and the approvals generated for each item.",
                "example": [
                    {
                        "accessRequestItem": {
                            "id": "00000000000040008000000000000000",
                            "name": "Finance Analyst",
                            "description": "Role granting finance reporting and sales-record access",
                            "type": "ROLE",
                            "removeDate": "2026-12-15T17:00:00Z",
                            "requesterComment": {
                                "comment": "Please review this access request",
                                "author": {
                                    "id": "00000000000040008000000000000000",
                                    "name": "Rebecca Requester",
                                    "type": "IDENTITY"
                                }
                            },
                            "clientMetadata": "{snowRITM=RITM001234, ticketId=INC009876}",
                            "dimensionContext": null
                        },
                        "approvals": [
                            {
                                "approvalScheme": "owner"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "accessRequestType",
                "type": "string",
                "description": "Access request operation.",
                "example": "GRANT_ACCESS"
            },
            {
                "key": "accessibleItems",
                "type": "array",
                "description": "Names of nested access items on a requested role. Empty for access profiles and entitlements.",
                "example": [
                    "Sales Access",
                    "Finance Reporting"
                ]
            },
            {
                "key": "appName",
                "type": "string",
                "description": "The name of the app associated with the access profile.",
                "example": "Example Name"
            },
            {
                "key": "approvalName",
                "type": "string",
                "description": "Display name of the approval request",
                "example": "Request for Access to Sales Application"
            },
            {
                "key": "approverPath",
                "type": "string",
                "description": "URL path to the approver dashboard",
                "example": "approvals/requested-items"
            },
            {
                "key": "assignmentContext",
                "type": "object",
                "description": "Assignment context for a dynamic role request. Null or absent for a static role.",
                "example": {}
            },
            {
                "key": "attributes",
                "type": "object",
                "description": "Comprehensive attributes map containing approval details, identities, comments, history, configuration, and other custom fields specific to particular approval request types",
                "example": {
                    "approvalID": "00000000-0000-4000-8000-000000000000",
                    "type": "ACCESS_REQUEST_APPROVAL",
                    "approvers": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "serialOrder": 1,
                            "email": "user@example.com"
                        },
                        {
                            "identityID": "00000000-0000-4000-8000-000000000000",
                            "type": "GOVERNANCE_GROUP",
                            "name": "Test Group 1",
                            "members": [
                                {
                                    "id": "00000000000040008000000000000000",
                                    "type": "IDENTITY",
                                    "name": "Barry Member",
                                    "email": "user@example.com"
                                }
                            ],
                            "serialOrder": 2
                        }
                    ],
                    "assignedTo": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "email": "user@example.com"
                        }
                    ],
                    "createdDate": "2047-08-30T18:16:29.053371Z",
                    "dueDate": "2047-09-21T12:30:0.0Z",
                    "description": "This access allows viewing and managing sales records",
                    "requester": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Rebecca Requester",
                        "email": "user@example.com"
                    },
                    "requestee": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Ruby Requestee",
                        "email": "user@example.com"
                    },
                    "comments": [
                        {
                            "commentId": "00000000-0000-4000-8000-000000000000",
                            "author": {
                                "identityID": "00000000000040008000000000000000",
                                "name": "Rebecca Requester"
                            },
                            "comment": "Lorem ipsum dolor sit amet.",
                            "createdDate": "2026-02-13T18:48:54.452979Z"
                        }
                    ],
                    "approvalCriteria": {
                        "type": "SERIAL",
                        "rejection": {
                            "calculationType": "COUNT",
                            "value": 1
                        },
                        "approval": {
                            "calculationType": "PERCENT",
                            "value": 100
                        }
                    },
                    "reassignmentHistory": [
                        {
                            "reassignmentType": "ESCALATION",
                            "reassignedFrom": {
                                "identityID": "00000000000040008000000000000000",
                                "type": "IDENTITY",
                                "name": "Will Approver"
                            },
                            "reassignedTo": {
                                "identityID": "00000000-0000-4000-8000-000000000000",
                                "type": "GOVERNANCE_GROUP",
                                "name": "Test Group 1"
                            },
                            "reassigner": {
                                "identityID": "System Automation",
                                "type": "IDENTITY"
                            },
                            "reassignmentDate": "2047-08-30T18:23:52.817415Z"
                        }
                    ],
                    "approvedBy": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "decisionDate": "2026-02-13T18:54:09.981077Z",
                            "email": "user@example.com"
                        }
                    ],
                    "completedDate": "",
                    "status": "PENDING",
                    "approvalConfig": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "scope": "APPROVAL_REQUEST",
                        "reminderConfig": {
                            "enabled": true,
                            "daysUntilFirstReminder": 2,
                            "reminderCronSchedule": "0 8 * * *",
                            "maxReminders": 2
                        },
                        "escalationConfig": {
                            "enabled": true,
                            "daysUntilFirstEscalation": 4,
                            "escalationCronSchedule": "0 8 */4 * *"
                        },
                        "timeoutConfig": {
                            "enabled": true,
                            "daysUntilTimeout": 7,
                            "timeoutResult": "EXPIRED"
                        },
                        "requiresComment": "ALL",
                        "autoApprove": "OFF"
                    },
                    "requestedTarget": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "type": "ACCESS_PROFILE",
                        "name": "Sales Access"
                    },
                    "requestedAccounts": "[{\"sourceId\":\"00000000000040008000000000000000\",\"accounts\":[{\"accountUuid\":\"00000000-0000-4000-8000-000000000000\",\"nativeIdentity\":\"CN=Ruby Requestee,OU=Users,DC=example,DC=com\"}]}]",
                    "clientMetadata": {
                        "snowRITM": "RITM001234",
                        "ticketId": "INC009876"
                    },
                    "maxPermittedAccessDuration": {
                        "timeUnit": "HOURS",
                        "value": 4
                    },
                    "requireEndDate": true,
                    "timeoutDate": "2026-12-15T17:00:00Z",
                    "form": {
                        "formDefinitionId": "fd-00000000-0000-4000-8000-000000000000",
                        "formInstanceId": "fi-00000000-0000-4000-8000-000000000000",
                        "formData": {
                            "businessJustification": "Quarter-end close",
                            "managerAcknowledged": "yes"
                        },
                        "formElements": [
                            {
                                "id": "el-businessJustification",
                                "elementType": "TEXT"
                            }
                        ],
                        "formConditions": [
                            {
                                "condition": "always"
                            }
                        ],
                        "formInstanceInputs": {
                            "requestedFor": "00000000000040008000000000000000"
                        }
                    },
                    "sodViolationContext": {
                        "state": "SUCCESS",
                        "violationCheckResult": {
                            "message": {
                                "locale": "en-US",
                                "localeOrigin": "DEFAULT",
                                "text": ""
                            },
                            "violatedPolicies": [
                                {
                                    "type": "SOD_POLICY",
                                    "id": "00000000-0000-4000-8000-000000000000",
                                    "name": "SOD Policy Test"
                                }
                            ],
                            "violationContexts": [
                                {
                                    "policy": {
                                        "type": "SOD_POLICY",
                                        "id": "00000000-0000-4000-8000-000000000000",
                                        "name": "SOD Policy Test"
                                    },
                                    "conflictingAccessCriteria": {
                                        "leftCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Helpdesk"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "TestGroup"
                                                }
                                            ]
                                        },
                                        "rightCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Certifications"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Dashboard"
                                                }
                                            ]
                                        }
                                    }
                                }
                            ],
                            "clientMetadata": {
                                "targetIdentityName": "Ruby Requestee",
                                "accessRequestId": "00000000000040008000000000000000",
                                "identityRequestId": "00000000000040008000000000000000",
                                "workflowCaseId": "00000000000040008000000000000000"
                            }
                        },
                        "uuid": "00000000-0000-4000-8000-000000000000"
                    },
                    "preApprovalResult": {
                        "reviewer": "urn:identity:pre-approver",
                        "approved": true,
                        "comment": "Pre-approval trigger approved this request"
                    },
                    "privilegeLevel": "HIGH",
                    "privileged": "HIGH",
                    "jitDetails": [
                        {
                            "applicationId": "00000000000040008000000000000000",
                            "attributeName": "memberOf",
                            "attributeValues": [
                                "CN=Helpdesk,OU=Groups,DC=example,DC=com"
                            ]
                        }
                    ],
                    "timeoutComment": "Request for a change of assignment start date was expired by the system because the original start date/time was reached.",
                    "removeDateUpdateRequested": true,
                    "currentRemoveDate": "2026-12-01T17:00:00Z",
                    "startDateUpdateRequested": true,
                    "currentStartDate": "2026-09-01T08:00:00Z"
                }
            },
            {
                "key": "batchSize",
                "type": "number",
                "description": "Number of batched requests relating to this approval request",
                "example": 1
            },
            {
                "key": "clientMetadata",
                "type": "string",
                "description": "Java toString of client metadata. Use attributes.clientMetadata for the structured map.",
                "example": "{snowRITM=RITM001234, ticketId=INC009876}"
            },
            {
                "key": "commentRequiredWhenRejected",
                "type": "boolean",
                "description": "Whether a comment is required when the reviewer denies the request.",
                "example": true
            },
            {
                "key": "commentText",
                "type": "string",
                "description": "Reason given for the reassignment.",
                "example": "Please review while I am out of office."
            },
            {
                "key": "dimensionContext",
                "type": "object",
                "description": "Dimension context for a dynamic role request.",
                "example": {}
            },
            {
                "key": "dueDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the approval is due for completion",
                "example": "2047-09-21T12:30:0.0Z"
            },
            {
                "key": "fullNotificationConfigForSpApprovals",
                "type": "boolean",
                "description": "Whether the full notification configuration was passed through to sp-approvals.",
                "example": true
            },
            {
                "key": "id",
                "type": "string",
                "description": "Identity request identifier associated with this approval.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "latestComment",
                "type": "string",
                "description": "Most recent comment on the approval",
                "example": "Lorem ipsum dolor sit amet."
            },
            {
                "key": "latestCommentAuthor",
                "type": "object",
                "description": "Author of the most recent comment",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "name": "Rebecca Requester"
                }
            },
            {
                "key": "matchedRolesInformation",
                "type": "object",
                "description": "Matched dynamic-role attribute values keyed by attribute name. Empty for a static role.",
                "example": {}
            },
            {
                "key": "newOwnerName",
                "type": "string",
                "description": "Display name of the reviewer who received the reassignment.",
                "example": "Alex Newowner"
            },
            {
                "key": "previousApprover",
                "type": "object",
                "description": "Previous approver (populated when approval request is reassigned)",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Will Approver"
                }
            },
            {
                "key": "previousOwnerName",
                "type": "string",
                "description": "Display name of the previous reviewer.",
                "example": "Will Approver"
            },
            {
                "key": "removeDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to end.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "requestContextInformation",
                "type": "object",
                "description": "Requested dynamic-role context attributes. Empty for a static role.",
                "example": {}
            },
            {
                "key": "requestedAppName",
                "type": "string",
                "description": "Application display name when an entitlement is requested through an application.",
                "example": "Active Directory"
            },
            {
                "key": "requestedBy",
                "type": "object",
                "description": "Identity who submitted the access request.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Rebecca Requester",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedFor",
                "type": "object",
                "description": "Identity for whom access was requested.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Ruby Requestee",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedForIdentityName",
                "type": "string",
                "description": "Display name of the identity for whom access was requested.",
                "example": "Ruby Requestee"
            },
            {
                "key": "requestedObject",
                "type": "object",
                "description": "Requested access object.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Finance Analyst",
                    "description": "Role granting finance reporting and sales-record access",
                    "type": "ROLE"
                }
            },
            {
                "key": "requestedObjectDescription",
                "type": "string",
                "description": "Description of the requested access object.",
                "example": "Role granting finance reporting and sales-record access"
            },
            {
                "key": "requestedObjectName",
                "type": "string",
                "description": "Name of the requested access object.",
                "example": "Finance Analyst"
            },
            {
                "key": "requestedObjectType",
                "type": "string",
                "description": "Display-cased type of the requested object.",
                "example": "Role"
            },
            {
                "key": "requestee",
                "type": "object",
                "description": "Identity for whom the approval request was made",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Ruby Requestee",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requester",
                "type": "object",
                "description": "Identity who submitted the approval request",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Rebecca Requester",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requesterComment",
                "type": "object",
                "description": "Requester comment captured when the access request was submitted.",
                "example": {
                    "comment": "Please review this access request",
                    "author": {
                        "id": "00000000000040008000000000000000",
                        "name": "Rebecca Requester",
                        "type": "IDENTITY"
                    }
                }
            },
            {
                "key": "requesterComments",
                "type": "string",
                "description": "Plain-text reason the requester gave when submitting the request.",
                "example": "Please review this access request"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "Display name of the identity who submitted the request.",
                "example": "Rebecca Requester"
            },
            {
                "key": "roleRequestEnabled",
                "type": "boolean",
                "description": "Whether role request handling is enabled for this notification context.",
                "example": true
            },
            {
                "key": "sourceInformation",
                "type": "array",
                "description": "Requested accounts grouped by source ID.",
                "example": [
                    {
                        "sourceId": "00000000000040008000000000000000",
                        "accounts": [
                            {
                                "accountUuid": "00000000-0000-4000-8000-000000000000",
                                "nativeIdentity": "CN=Ruby Requestee,OU=Users,DC=example,DC=com"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "startDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to start.",
                "example": "2026-09-15T08:00:00Z"
            },
            {
                "key": "type",
                "type": "string",
                "description": "Type of approval request",
                "example": "ACCESS_REQUEST_APPROVAL"
            }
        ]
    },
    "access_request_reviewer": {
        "EMAIL": [
            {
                "key": "accessibleItems",
                "type": "array",
                "description": "Names of nested access items on a requested role. Empty for access profiles and entitlements.",
                "example": [
                    "Sales Access",
                    "Finance Reporting"
                ]
            },
            {
                "key": "accessProfileDescription",
                "type": "string",
                "description": "Description of the requested access profile. Present only for access profile requests.",
                "example": "This access allows viewing and managing sales records"
            },
            {
                "key": "accessProfileName",
                "type": "string",
                "description": "Name of the requested access profile. Present only for access profile requests.",
                "example": "Sales Access"
            },
            {
                "key": "accessRequestItemsWithApprovals",
                "type": "array",
                "description": "Requested access items and the approvals generated for each item.",
                "example": [
                    {
                        "accessRequestItem": {
                            "id": "00000000000040008000000000000000",
                            "name": "Finance Analyst",
                            "description": "Role granting finance reporting and sales-record access",
                            "type": "ROLE",
                            "removeDate": "2026-12-15T17:00:00Z",
                            "requesterComment": {
                                "comment": "Please review this access request",
                                "author": {
                                    "id": "00000000000040008000000000000000",
                                    "name": "Rebecca Requester",
                                    "type": "IDENTITY"
                                }
                            },
                            "clientMetadata": "{snowRITM=RITM001234, ticketId=INC009876}",
                            "dimensionContext": null
                        },
                        "approvals": [
                            {
                                "approvalScheme": "owner"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "accessRequestType",
                "type": "string",
                "description": "Access request operation.",
                "example": "GRANT_ACCESS"
            },
            {
                "key": "approvalName",
                "type": "string",
                "description": "Display name of the approval request",
                "example": "Request for Access to Sales Application"
            },
            {
                "key": "approverPath",
                "type": "string",
                "description": "URL path to the approver dashboard",
                "example": "approvals/requested-items"
            },
            {
                "key": "assignmentContext",
                "type": "object",
                "description": "Assignment context for a dynamic role request. Null or absent for a static role.",
                "example": {}
            },
            {
                "key": "attributes",
                "type": "object",
                "description": "Comprehensive attributes map containing approval details, identities, comments, history, configuration, and other custom fields specific to particular approval request types",
                "example": {
                    "approvalID": "00000000-0000-4000-8000-000000000000",
                    "type": "ACCESS_REQUEST_APPROVAL",
                    "approvers": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "serialOrder": 1,
                            "email": "user@example.com"
                        },
                        {
                            "identityID": "00000000-0000-4000-8000-000000000000",
                            "type": "GOVERNANCE_GROUP",
                            "name": "Test Group 1",
                            "members": [
                                {
                                    "id": "00000000000040008000000000000000",
                                    "type": "IDENTITY",
                                    "name": "Barry Member",
                                    "email": "user@example.com"
                                }
                            ],
                            "serialOrder": 2
                        }
                    ],
                    "assignedTo": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "email": "user@example.com"
                        }
                    ],
                    "createdDate": "2047-08-30T18:16:29.053371Z",
                    "dueDate": "2047-09-21T12:30:0.0Z",
                    "description": "This access allows viewing and managing sales records",
                    "requester": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Rebecca Requester",
                        "email": "user@example.com"
                    },
                    "requestee": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Ruby Requestee",
                        "email": "user@example.com"
                    },
                    "comments": [
                        {
                            "commentId": "00000000-0000-4000-8000-000000000000",
                            "author": {
                                "identityID": "00000000000040008000000000000000",
                                "name": "Rebecca Requester"
                            },
                            "comment": "Lorem ipsum dolor sit amet.",
                            "createdDate": "2026-02-13T18:48:54.452979Z"
                        }
                    ],
                    "approvalCriteria": {
                        "type": "SERIAL",
                        "rejection": {
                            "calculationType": "COUNT",
                            "value": 1
                        },
                        "approval": {
                            "calculationType": "PERCENT",
                            "value": 100
                        }
                    },
                    "reassignmentHistory": [
                        {
                            "reassignmentType": "ESCALATION",
                            "reassignedFrom": {
                                "identityID": "00000000000040008000000000000000",
                                "type": "IDENTITY",
                                "name": "Will Approver"
                            },
                            "reassignedTo": {
                                "identityID": "00000000-0000-4000-8000-000000000000",
                                "type": "GOVERNANCE_GROUP",
                                "name": "Test Group 1"
                            },
                            "reassigner": {
                                "identityID": "System Automation",
                                "type": "IDENTITY"
                            },
                            "reassignmentDate": "2047-08-30T18:23:52.817415Z"
                        }
                    ],
                    "approvedBy": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "decisionDate": "2026-02-13T18:54:09.981077Z",
                            "email": "user@example.com"
                        }
                    ],
                    "completedDate": "",
                    "status": "PENDING",
                    "approvalConfig": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "scope": "APPROVAL_REQUEST",
                        "reminderConfig": {
                            "enabled": true,
                            "daysUntilFirstReminder": 2,
                            "reminderCronSchedule": "0 8 * * *",
                            "maxReminders": 2
                        },
                        "escalationConfig": {
                            "enabled": true,
                            "daysUntilFirstEscalation": 4,
                            "escalationCronSchedule": "0 8 */4 * *"
                        },
                        "timeoutConfig": {
                            "enabled": true,
                            "daysUntilTimeout": 7,
                            "timeoutResult": "EXPIRED"
                        },
                        "requiresComment": "ALL",
                        "autoApprove": "OFF"
                    },
                    "requestedTarget": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "type": "ACCESS_PROFILE",
                        "name": "Sales Access"
                    },
                    "requestedAccounts": "[{\"sourceId\":\"00000000000040008000000000000000\",\"accounts\":[{\"accountUuid\":\"00000000-0000-4000-8000-000000000000\",\"nativeIdentity\":\"CN=Ruby Requestee,OU=Users,DC=example,DC=com\"}]}]",
                    "clientMetadata": {
                        "snowRITM": "RITM001234",
                        "ticketId": "INC009876"
                    },
                    "maxPermittedAccessDuration": {
                        "timeUnit": "HOURS",
                        "value": 4
                    },
                    "requireEndDate": true,
                    "timeoutDate": "2026-12-15T17:00:00Z",
                    "form": {
                        "formDefinitionId": "fd-00000000-0000-4000-8000-000000000000",
                        "formInstanceId": "fi-00000000-0000-4000-8000-000000000000",
                        "formData": {
                            "businessJustification": "Quarter-end close",
                            "managerAcknowledged": "yes"
                        },
                        "formElements": [
                            {
                                "id": "el-businessJustification",
                                "elementType": "TEXT"
                            }
                        ],
                        "formConditions": [
                            {
                                "condition": "always"
                            }
                        ],
                        "formInstanceInputs": {
                            "requestedFor": "00000000000040008000000000000000"
                        }
                    },
                    "sodViolationContext": {
                        "state": "SUCCESS",
                        "violationCheckResult": {
                            "message": {
                                "locale": "en-US",
                                "localeOrigin": "DEFAULT",
                                "text": ""
                            },
                            "violatedPolicies": [
                                {
                                    "type": "SOD_POLICY",
                                    "id": "00000000-0000-4000-8000-000000000000",
                                    "name": "SOD Policy Test"
                                }
                            ],
                            "violationContexts": [
                                {
                                    "policy": {
                                        "type": "SOD_POLICY",
                                        "id": "00000000-0000-4000-8000-000000000000",
                                        "name": "SOD Policy Test"
                                    },
                                    "conflictingAccessCriteria": {
                                        "leftCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Helpdesk"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "TestGroup"
                                                }
                                            ]
                                        },
                                        "rightCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Certifications"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Dashboard"
                                                }
                                            ]
                                        }
                                    }
                                }
                            ],
                            "clientMetadata": {
                                "targetIdentityName": "Ruby Requestee",
                                "accessRequestId": "00000000000040008000000000000000",
                                "identityRequestId": "00000000000040008000000000000000",
                                "workflowCaseId": "00000000000040008000000000000000"
                            }
                        },
                        "uuid": "00000000-0000-4000-8000-000000000000"
                    },
                    "preApprovalResult": {
                        "reviewer": "urn:identity:pre-approver",
                        "approved": true,
                        "comment": "Pre-approval trigger approved this request"
                    },
                    "privilegeLevel": "HIGH",
                    "privileged": "HIGH",
                    "jitDetails": [
                        {
                            "applicationId": "00000000000040008000000000000000",
                            "attributeName": "memberOf",
                            "attributeValues": [
                                "CN=Helpdesk,OU=Groups,DC=example,DC=com"
                            ]
                        }
                    ],
                    "timeoutComment": "Request for a change of assignment start date was expired by the system because the original start date/time was reached.",
                    "removeDateUpdateRequested": true,
                    "currentRemoveDate": "2026-12-01T17:00:00Z",
                    "startDateUpdateRequested": true,
                    "currentStartDate": "2026-09-01T08:00:00Z"
                }
            },
            {
                "key": "batchSize",
                "type": "number",
                "description": "Number of batched requests relating to this approval request",
                "example": 1
            },
            {
                "key": "clientMetadata",
                "type": "string",
                "description": "Java toString of client metadata. Use attributes.clientMetadata for the structured map.",
                "example": "{snowRITM=RITM001234, ticketId=INC009876}"
            },
            {
                "key": "commentRequiredWhenRejected",
                "type": "boolean",
                "description": "Whether a comment is required when the reviewer denies the request.",
                "example": true
            },
            {
                "key": "createdDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the approval request was created",
                "example": "2047-08-30T18:16:29.053371Z"
            },
            {
                "key": "dimensionContext",
                "type": "object",
                "description": "Dimension context for a dynamic role request.",
                "example": {}
            },
            {
                "key": "dueDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the approval is due for completion",
                "example": "2047-09-21T12:30:0.0Z"
            },
            {
                "key": "escalatedApprover",
                "type": "object",
                "description": "Approver to whom this request was escalated",
                "example": {
                    "identityID": "00000000-0000-4000-8000-000000000000",
                    "type": "GOVERNANCE_GROUP",
                    "name": "Test Group 1"
                }
            },
            {
                "key": "escalationDelay",
                "type": "string",
                "description": "Human-readable duration that passed before escalation",
                "example": "4 days, 6 hours, 30 minutes"
            },
            {
                "key": "fullNotificationConfigForSpApprovals",
                "type": "boolean",
                "description": "Whether the full notification configuration was passed through to sp-approvals.",
                "example": true
            },
            {
                "key": "id",
                "type": "string",
                "description": "Identity request identifier associated with this approval.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "latestComment",
                "type": "string",
                "description": "Most recent comment on the approval",
                "example": "Lorem ipsum dolor sit amet."
            },
            {
                "key": "latestCommentAuthor",
                "type": "object",
                "description": "Author of the most recent comment",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "name": "Rebecca Requester"
                }
            },
            {
                "key": "matchedRolesInformation",
                "type": "object",
                "description": "Matched dynamic-role attribute values keyed by attribute name. Empty for a static role.",
                "example": {}
            },
            {
                "key": "previousApprover",
                "type": "object",
                "description": "Previous approver (when approval request is reassigned)",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Will Approver"
                }
            },
            {
                "key": "removeDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to end.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "requestContextInformation",
                "type": "object",
                "description": "Requested dynamic-role context attributes. Empty for a static role.",
                "example": {}
            },
            {
                "key": "requestedAppName",
                "type": "string",
                "description": "Application display name when an entitlement is requested through an application.",
                "example": "Active Directory"
            },
            {
                "key": "requestedBy",
                "type": "object",
                "description": "Identity who submitted the access request.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Rebecca Requester",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedFor",
                "type": "object",
                "description": "Identity for whom access was requested.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Ruby Requestee",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedForIdentityName",
                "type": "string",
                "description": "Display name of the identity for whom access was requested.",
                "example": "Ruby Requestee"
            },
            {
                "key": "requestedObject",
                "type": "object",
                "description": "Requested access object.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Finance Analyst",
                    "description": "Role granting finance reporting and sales-record access",
                    "type": "ROLE"
                }
            },
            {
                "key": "requestedObjectDescription",
                "type": "string",
                "description": "Description of the requested access object.",
                "example": "Role granting finance reporting and sales-record access"
            },
            {
                "key": "requestedObjectName",
                "type": "string",
                "description": "Name of the requested access object.",
                "example": "Finance Analyst"
            },
            {
                "key": "requestedObjectType",
                "type": "string",
                "description": "Display-cased type of the requested object.",
                "example": "Role"
            },
            {
                "key": "requestee",
                "type": "object",
                "description": "Identity for whom the approval request was made",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Ruby Requestee",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requester",
                "type": "object",
                "description": "Identity who submitted the approval request",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Rebecca Requester",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requesterComment",
                "type": "object",
                "description": "Requester comment captured when the access request was submitted.",
                "example": {
                    "comment": "Please review this access request",
                    "author": {
                        "id": "00000000000040008000000000000000",
                        "name": "Rebecca Requester",
                        "type": "IDENTITY"
                    }
                }
            },
            {
                "key": "requesterComments",
                "type": "string",
                "description": "Plain-text reason the requester gave when submitting the request.",
                "example": "Please review this access request"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "Display name of the identity who submitted the request.",
                "example": "Rebecca Requester"
            },
            {
                "key": "requesterPath",
                "type": "string",
                "description": "URL path to the requester dashboard",
                "example": "requests/my-requests"
            },
            {
                "key": "roleRequestEnabled",
                "type": "boolean",
                "description": "Whether role request handling is enabled for this notification context.",
                "example": true
            },
            {
                "key": "sourceInformation",
                "type": "array",
                "description": "Requested accounts grouped by source ID.",
                "example": [
                    {
                        "sourceId": "00000000000040008000000000000000",
                        "accounts": [
                            {
                                "accountUuid": "00000000-0000-4000-8000-000000000000",
                                "nativeIdentity": "CN=Ruby Requestee,OU=Users,DC=example,DC=com"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "startDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to start.",
                "example": "2026-09-15T08:00:00Z"
            },
            {
                "key": "type",
                "type": "string",
                "description": "Type of approval request",
                "example": "ACCESS_REQUEST_APPROVAL"
            }
        ]
    },
    "access_request_submitted_email_for_requested-for_identity": {
        "EMAIL": [
            {
                "key": "dimensionDetails",
                "type": "object",
                "description": "A map of dimension details about the requested object. It contains the item name as key and a map of (dimension attribute, dimension attribute values) as a value.",
                "example": {}
            },
            {
                "key": "requestedObjectDetailsByType",
                "type": "object",
                "description": "A list of the details about each item requested, in order of the object type.",
                "example": [
                    {
                        "name": "Example Name",
                        "removeDate": "2026-12-15T17:00:00Z",
                        "requesterComment": "Example"
                    }
                ]
            },
            {
                "key": "requestedObjectNamesByType",
                "type": "object",
                "description": "The names of each item requested, in order of the object type.",
                "example": {}
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "The display name of the identity who submitted the request.",
                "example": "Example Name"
            }
        ]
    },
    "access_request_submitted_email_for_requester_after_validation": {
        "EMAIL": [
            {
                "key": "requestDetails",
                "type": "array",
                "description": "Each map contains - identityName - successDetails - exclusionDetails",
                "example": [
                    {
                        "identityName": "Example Name",
                        "getSuccessDetails": "Example",
                        "getExclusionDetails": "Example"
                    }
                ]
            }
        ]
    },
    "access_request_submitted_with_approvers": {
        "SLACK": [
            {
                "key": "accessibleItems",
                "type": "array",
                "description": "Names of nested access items on a requested role. Empty for access profiles and entitlements.",
                "example": [
                    "Sales Access",
                    "Finance Reporting"
                ]
            },
            {
                "key": "accessProfileDescription",
                "type": "string",
                "description": "Description of the requested access profile. Present only for access profile requests.",
                "example": "This access allows viewing and managing sales records"
            },
            {
                "key": "accessProfileName",
                "type": "string",
                "description": "Name of the requested access profile. Present only for access profile requests.",
                "example": "Sales Access"
            },
            {
                "key": "accessRequestItemsWithApprovals",
                "type": "array",
                "description": "Requested access items and the approvals generated for each item.",
                "example": [
                    {
                        "accessRequestItem": {
                            "id": "00000000000040008000000000000000",
                            "name": "Finance Analyst",
                            "description": "Role granting finance reporting and sales-record access",
                            "type": "ROLE",
                            "removeDate": "2026-12-15T17:00:00Z",
                            "requesterComment": {
                                "comment": "Please review this access request",
                                "author": {
                                    "id": "00000000000040008000000000000000",
                                    "name": "Rebecca Requester",
                                    "type": "IDENTITY"
                                }
                            },
                            "clientMetadata": "{snowRITM=RITM001234, ticketId=INC009876}",
                            "dimensionContext": null
                        },
                        "approvals": [
                            {
                                "approvalScheme": "owner"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "accessRequestType",
                "type": "string",
                "description": "Access request operation.",
                "example": "GRANT_ACCESS"
            },
            {
                "key": "approvalName",
                "type": "string",
                "description": "Display name of the approval request",
                "example": "Request for Access to Sales Application"
            },
            {
                "key": "approverPath",
                "type": "string",
                "description": "URL path to the approver dashboard",
                "example": "approvals/requested-items"
            },
            {
                "key": "assignmentContext",
                "type": "object",
                "description": "Assignment context for a dynamic role request. Null or absent for a static role.",
                "example": {}
            },
            {
                "key": "attributes",
                "type": "object",
                "description": "Comprehensive attributes map containing approval details, identities, comments, history, configuration, and other custom fields specific to particular approval request types",
                "example": {
                    "approvalID": "00000000-0000-4000-8000-000000000000",
                    "type": "ACCESS_REQUEST_APPROVAL",
                    "approvers": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "serialOrder": 1,
                            "email": "user@example.com"
                        },
                        {
                            "identityID": "00000000-0000-4000-8000-000000000000",
                            "type": "GOVERNANCE_GROUP",
                            "name": "Test Group 1",
                            "members": [
                                {
                                    "id": "00000000000040008000000000000000",
                                    "type": "IDENTITY",
                                    "name": "Barry Member",
                                    "email": "user@example.com"
                                }
                            ],
                            "serialOrder": 2
                        }
                    ],
                    "assignedTo": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "email": "user@example.com"
                        }
                    ],
                    "createdDate": "2047-08-30T18:16:29.053371Z",
                    "dueDate": "2047-09-21T12:30:0.0Z",
                    "description": "This access allows viewing and managing sales records",
                    "requester": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Rebecca Requester",
                        "email": "user@example.com"
                    },
                    "requestee": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Ruby Requestee",
                        "email": "user@example.com"
                    },
                    "comments": [
                        {
                            "commentId": "00000000-0000-4000-8000-000000000000",
                            "author": {
                                "identityID": "00000000000040008000000000000000",
                                "name": "Rebecca Requester"
                            },
                            "comment": "Lorem ipsum dolor sit amet.",
                            "createdDate": "2026-02-13T18:48:54.452979Z"
                        }
                    ],
                    "approvalCriteria": {
                        "type": "SERIAL",
                        "rejection": {
                            "calculationType": "COUNT",
                            "value": 1
                        },
                        "approval": {
                            "calculationType": "PERCENT",
                            "value": 100
                        }
                    },
                    "reassignmentHistory": [
                        {
                            "reassignmentType": "ESCALATION",
                            "reassignedFrom": {
                                "identityID": "00000000000040008000000000000000",
                                "type": "IDENTITY",
                                "name": "Will Approver"
                            },
                            "reassignedTo": {
                                "identityID": "00000000-0000-4000-8000-000000000000",
                                "type": "GOVERNANCE_GROUP",
                                "name": "Test Group 1"
                            },
                            "reassigner": {
                                "identityID": "System Automation",
                                "type": "IDENTITY"
                            },
                            "reassignmentDate": "2047-08-30T18:23:52.817415Z"
                        }
                    ],
                    "approvedBy": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "decisionDate": "2026-02-13T18:54:09.981077Z",
                            "email": "user@example.com"
                        }
                    ],
                    "completedDate": "",
                    "status": "PENDING",
                    "approvalConfig": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "scope": "APPROVAL_REQUEST",
                        "reminderConfig": {
                            "enabled": true,
                            "daysUntilFirstReminder": 2,
                            "reminderCronSchedule": "0 8 * * *",
                            "maxReminders": 2
                        },
                        "escalationConfig": {
                            "enabled": true,
                            "daysUntilFirstEscalation": 4,
                            "escalationCronSchedule": "0 8 */4 * *"
                        },
                        "timeoutConfig": {
                            "enabled": true,
                            "daysUntilTimeout": 7,
                            "timeoutResult": "EXPIRED"
                        },
                        "requiresComment": "ALL",
                        "autoApprove": "OFF"
                    },
                    "requestedTarget": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "type": "ACCESS_PROFILE",
                        "name": "Sales Access"
                    },
                    "requestedAccounts": "[{\"sourceId\":\"00000000000040008000000000000000\",\"accounts\":[{\"accountUuid\":\"00000000-0000-4000-8000-000000000000\",\"nativeIdentity\":\"CN=Ruby Requestee,OU=Users,DC=example,DC=com\"}]}]",
                    "clientMetadata": {
                        "snowRITM": "RITM001234",
                        "ticketId": "INC009876"
                    },
                    "maxPermittedAccessDuration": {
                        "timeUnit": "HOURS",
                        "value": 4
                    },
                    "requireEndDate": true,
                    "timeoutDate": "2026-12-15T17:00:00Z",
                    "form": {
                        "formDefinitionId": "fd-00000000-0000-4000-8000-000000000000",
                        "formInstanceId": "fi-00000000-0000-4000-8000-000000000000",
                        "formData": {
                            "businessJustification": "Quarter-end close",
                            "managerAcknowledged": "yes"
                        },
                        "formElements": [
                            {
                                "id": "el-businessJustification",
                                "elementType": "TEXT"
                            }
                        ],
                        "formConditions": [
                            {
                                "condition": "always"
                            }
                        ],
                        "formInstanceInputs": {
                            "requestedFor": "00000000000040008000000000000000"
                        }
                    },
                    "sodViolationContext": {
                        "state": "SUCCESS",
                        "violationCheckResult": {
                            "message": {
                                "locale": "en-US",
                                "localeOrigin": "DEFAULT",
                                "text": ""
                            },
                            "violatedPolicies": [
                                {
                                    "type": "SOD_POLICY",
                                    "id": "00000000-0000-4000-8000-000000000000",
                                    "name": "SOD Policy Test"
                                }
                            ],
                            "violationContexts": [
                                {
                                    "policy": {
                                        "type": "SOD_POLICY",
                                        "id": "00000000-0000-4000-8000-000000000000",
                                        "name": "SOD Policy Test"
                                    },
                                    "conflictingAccessCriteria": {
                                        "leftCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Helpdesk"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "TestGroup"
                                                }
                                            ]
                                        },
                                        "rightCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Certifications"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Dashboard"
                                                }
                                            ]
                                        }
                                    }
                                }
                            ],
                            "clientMetadata": {
                                "targetIdentityName": "Ruby Requestee",
                                "accessRequestId": "00000000000040008000000000000000",
                                "identityRequestId": "00000000000040008000000000000000",
                                "workflowCaseId": "00000000000040008000000000000000"
                            }
                        },
                        "uuid": "00000000-0000-4000-8000-000000000000"
                    },
                    "preApprovalResult": {
                        "reviewer": "urn:identity:pre-approver",
                        "approved": true,
                        "comment": "Pre-approval trigger approved this request"
                    },
                    "privilegeLevel": "HIGH",
                    "privileged": "HIGH",
                    "jitDetails": [
                        {
                            "applicationId": "00000000000040008000000000000000",
                            "attributeName": "memberOf",
                            "attributeValues": [
                                "CN=Helpdesk,OU=Groups,DC=example,DC=com"
                            ]
                        }
                    ],
                    "timeoutComment": "Request for a change of assignment start date was expired by the system because the original start date/time was reached.",
                    "removeDateUpdateRequested": true,
                    "currentRemoveDate": "2026-12-01T17:00:00Z",
                    "startDateUpdateRequested": true,
                    "currentStartDate": "2026-09-01T08:00:00Z"
                }
            },
            {
                "key": "batchSize",
                "type": "number",
                "description": "Number of batched requests relating to this approval request",
                "example": 1
            },
            {
                "key": "clientMetadata",
                "type": "string",
                "description": "Java toString of client metadata. Use attributes.clientMetadata for the structured map.",
                "example": "{snowRITM=RITM001234, ticketId=INC009876}"
            },
            {
                "key": "commentRequiredWhenRejected",
                "type": "boolean",
                "description": "Whether a comment is required when the reviewer denies the request.",
                "example": true
            },
            {
                "key": "dimensionContext",
                "type": "object",
                "description": "Dimension context for a dynamic role request.",
                "example": {}
            },
            {
                "key": "dueDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the approval is due for completion",
                "example": "2047-09-21T12:30:0.0Z"
            },
            {
                "key": "fullNotificationConfigForSpApprovals",
                "type": "boolean",
                "description": "Whether the full notification configuration was passed through to sp-approvals.",
                "example": true
            },
            {
                "key": "id",
                "type": "string",
                "description": "Identity request identifier associated with this approval.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "latestComment",
                "type": "string",
                "description": "Most recent comment on the approval",
                "example": "Lorem ipsum dolor sit amet."
            },
            {
                "key": "latestCommentAuthor",
                "type": "object",
                "description": "Author of the most recent comment",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "name": "Rebecca Requester"
                }
            },
            {
                "key": "matchedRolesInformation",
                "type": "object",
                "description": "Matched dynamic-role attribute values keyed by attribute name. Empty for a static role.",
                "example": {}
            },
            {
                "key": "removeDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to end.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "requestContextInformation",
                "type": "object",
                "description": "Requested dynamic-role context attributes. Empty for a static role.",
                "example": {}
            },
            {
                "key": "requestedAppName",
                "type": "string",
                "description": "Application display name when an entitlement is requested through an application.",
                "example": "Active Directory"
            },
            {
                "key": "requestedBy",
                "type": "object",
                "description": "Identity who submitted the access request.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Rebecca Requester",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedFor",
                "type": "object",
                "description": "Identity for whom access was requested.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Ruby Requestee",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedForIdentityName",
                "type": "string",
                "description": "Display name of the identity for whom access was requested.",
                "example": "Ruby Requestee"
            },
            {
                "key": "requestedObject",
                "type": "object",
                "description": "Requested access object.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Finance Analyst",
                    "description": "Role granting finance reporting and sales-record access",
                    "type": "ROLE"
                }
            },
            {
                "key": "requestedObjectDescription",
                "type": "string",
                "description": "Description of the requested access object.",
                "example": "Role granting finance reporting and sales-record access"
            },
            {
                "key": "requestedObjectName",
                "type": "string",
                "description": "Name of the requested access object.",
                "example": "Finance Analyst"
            },
            {
                "key": "requestedObjectType",
                "type": "string",
                "description": "Display-cased type of the requested object.",
                "example": "Role"
            },
            {
                "key": "requestee",
                "type": "object",
                "description": "Identity for whom the approval request was made",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Ruby Requestee",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requester",
                "type": "object",
                "description": "Identity who submitted the approval request",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Rebecca Requester",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requesterComment",
                "type": "object",
                "description": "Requester comment captured when the access request was submitted.",
                "example": {
                    "comment": "Please review this access request",
                    "author": {
                        "id": "00000000000040008000000000000000",
                        "name": "Rebecca Requester",
                        "type": "IDENTITY"
                    }
                }
            },
            {
                "key": "requesterComments",
                "type": "string",
                "description": "Plain-text reason the requester gave when submitting the request.",
                "example": "Please review this access request"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "Display name of the identity who submitted the request.",
                "example": "Rebecca Requester"
            },
            {
                "key": "roleRequestEnabled",
                "type": "boolean",
                "description": "Whether role request handling is enabled for this notification context.",
                "example": true
            },
            {
                "key": "sourceInformation",
                "type": "array",
                "description": "Requested accounts grouped by source ID.",
                "example": [
                    {
                        "sourceId": "00000000000040008000000000000000",
                        "accounts": [
                            {
                                "accountUuid": "00000000-0000-4000-8000-000000000000",
                                "nativeIdentity": "CN=Ruby Requestee,OU=Users,DC=example,DC=com"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "startDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to start.",
                "example": "2026-09-15T08:00:00Z"
            },
            {
                "key": "type",
                "type": "string",
                "description": "Type of approval request",
                "example": "ACCESS_REQUEST_APPROVAL"
            }
        ],
        "TEAMS": [
            {
                "key": "accessibleItems",
                "type": "array",
                "description": "Names of nested access items on a requested role. Empty for access profiles and entitlements.",
                "example": [
                    "Sales Access",
                    "Finance Reporting"
                ]
            },
            {
                "key": "accessProfileDescription",
                "type": "string",
                "description": "Description of the requested access profile. Present only for access profile requests.",
                "example": "This access allows viewing and managing sales records"
            },
            {
                "key": "accessProfileName",
                "type": "string",
                "description": "Name of the requested access profile. Present only for access profile requests.",
                "example": "Sales Access"
            },
            {
                "key": "accessRequestItemsWithApprovals",
                "type": "array",
                "description": "Requested access items and the approvals generated for each item.",
                "example": [
                    {
                        "accessRequestItem": {
                            "id": "00000000000040008000000000000000",
                            "name": "Finance Analyst",
                            "description": "Role granting finance reporting and sales-record access",
                            "type": "ROLE",
                            "removeDate": "2026-12-15T17:00:00Z",
                            "requesterComment": {
                                "comment": "Please review this access request",
                                "author": {
                                    "id": "00000000000040008000000000000000",
                                    "name": "Rebecca Requester",
                                    "type": "IDENTITY"
                                }
                            },
                            "clientMetadata": "{snowRITM=RITM001234, ticketId=INC009876}",
                            "dimensionContext": null
                        },
                        "approvals": [
                            {
                                "approvalScheme": "owner"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "accessRequestType",
                "type": "string",
                "description": "Access request operation.",
                "example": "GRANT_ACCESS"
            },
            {
                "key": "approvalName",
                "type": "string",
                "description": "Display name of the approval request",
                "example": "Request for Access to Sales Application"
            },
            {
                "key": "approverPath",
                "type": "string",
                "description": "URL path to the approver dashboard",
                "example": "approvals/requested-items"
            },
            {
                "key": "assignmentContext",
                "type": "object",
                "description": "Assignment context for a dynamic role request. Null or absent for a static role.",
                "example": {}
            },
            {
                "key": "attributes",
                "type": "object",
                "description": "Comprehensive attributes map containing approval details, identities, comments, history, configuration, and other custom fields specific to particular approval request types",
                "example": {
                    "approvalID": "00000000-0000-4000-8000-000000000000",
                    "type": "ACCESS_REQUEST_APPROVAL",
                    "approvers": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "serialOrder": 1,
                            "email": "user@example.com"
                        },
                        {
                            "identityID": "00000000-0000-4000-8000-000000000000",
                            "type": "GOVERNANCE_GROUP",
                            "name": "Test Group 1",
                            "members": [
                                {
                                    "id": "00000000000040008000000000000000",
                                    "type": "IDENTITY",
                                    "name": "Barry Member",
                                    "email": "user@example.com"
                                }
                            ],
                            "serialOrder": 2
                        }
                    ],
                    "assignedTo": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "email": "user@example.com"
                        }
                    ],
                    "createdDate": "2047-08-30T18:16:29.053371Z",
                    "dueDate": "2047-09-21T12:30:0.0Z",
                    "description": "This access allows viewing and managing sales records",
                    "requester": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Rebecca Requester",
                        "email": "user@example.com"
                    },
                    "requestee": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Ruby Requestee",
                        "email": "user@example.com"
                    },
                    "comments": [
                        {
                            "commentId": "00000000-0000-4000-8000-000000000000",
                            "author": {
                                "identityID": "00000000000040008000000000000000",
                                "name": "Rebecca Requester"
                            },
                            "comment": "Lorem ipsum dolor sit amet.",
                            "createdDate": "2026-02-13T18:48:54.452979Z"
                        }
                    ],
                    "approvalCriteria": {
                        "type": "SERIAL",
                        "rejection": {
                            "calculationType": "COUNT",
                            "value": 1
                        },
                        "approval": {
                            "calculationType": "PERCENT",
                            "value": 100
                        }
                    },
                    "reassignmentHistory": [
                        {
                            "reassignmentType": "ESCALATION",
                            "reassignedFrom": {
                                "identityID": "00000000000040008000000000000000",
                                "type": "IDENTITY",
                                "name": "Will Approver"
                            },
                            "reassignedTo": {
                                "identityID": "00000000-0000-4000-8000-000000000000",
                                "type": "GOVERNANCE_GROUP",
                                "name": "Test Group 1"
                            },
                            "reassigner": {
                                "identityID": "System Automation",
                                "type": "IDENTITY"
                            },
                            "reassignmentDate": "2047-08-30T18:23:52.817415Z"
                        }
                    ],
                    "approvedBy": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "decisionDate": "2026-02-13T18:54:09.981077Z",
                            "email": "user@example.com"
                        }
                    ],
                    "completedDate": "",
                    "status": "PENDING",
                    "approvalConfig": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "scope": "APPROVAL_REQUEST",
                        "reminderConfig": {
                            "enabled": true,
                            "daysUntilFirstReminder": 2,
                            "reminderCronSchedule": "0 8 * * *",
                            "maxReminders": 2
                        },
                        "escalationConfig": {
                            "enabled": true,
                            "daysUntilFirstEscalation": 4,
                            "escalationCronSchedule": "0 8 */4 * *"
                        },
                        "timeoutConfig": {
                            "enabled": true,
                            "daysUntilTimeout": 7,
                            "timeoutResult": "EXPIRED"
                        },
                        "requiresComment": "ALL",
                        "autoApprove": "OFF"
                    },
                    "requestedTarget": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "type": "ACCESS_PROFILE",
                        "name": "Sales Access"
                    },
                    "requestedAccounts": "[{\"sourceId\":\"00000000000040008000000000000000\",\"accounts\":[{\"accountUuid\":\"00000000-0000-4000-8000-000000000000\",\"nativeIdentity\":\"CN=Ruby Requestee,OU=Users,DC=example,DC=com\"}]}]",
                    "clientMetadata": {
                        "snowRITM": "RITM001234",
                        "ticketId": "INC009876"
                    },
                    "maxPermittedAccessDuration": {
                        "timeUnit": "HOURS",
                        "value": 4
                    },
                    "requireEndDate": true,
                    "timeoutDate": "2026-12-15T17:00:00Z",
                    "form": {
                        "formDefinitionId": "fd-00000000-0000-4000-8000-000000000000",
                        "formInstanceId": "fi-00000000-0000-4000-8000-000000000000",
                        "formData": {
                            "businessJustification": "Quarter-end close",
                            "managerAcknowledged": "yes"
                        },
                        "formElements": [
                            {
                                "id": "el-businessJustification",
                                "elementType": "TEXT"
                            }
                        ],
                        "formConditions": [
                            {
                                "condition": "always"
                            }
                        ],
                        "formInstanceInputs": {
                            "requestedFor": "00000000000040008000000000000000"
                        }
                    },
                    "sodViolationContext": {
                        "state": "SUCCESS",
                        "violationCheckResult": {
                            "message": {
                                "locale": "en-US",
                                "localeOrigin": "DEFAULT",
                                "text": ""
                            },
                            "violatedPolicies": [
                                {
                                    "type": "SOD_POLICY",
                                    "id": "00000000-0000-4000-8000-000000000000",
                                    "name": "SOD Policy Test"
                                }
                            ],
                            "violationContexts": [
                                {
                                    "policy": {
                                        "type": "SOD_POLICY",
                                        "id": "00000000-0000-4000-8000-000000000000",
                                        "name": "SOD Policy Test"
                                    },
                                    "conflictingAccessCriteria": {
                                        "leftCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Helpdesk"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "TestGroup"
                                                }
                                            ]
                                        },
                                        "rightCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Certifications"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Dashboard"
                                                }
                                            ]
                                        }
                                    }
                                }
                            ],
                            "clientMetadata": {
                                "targetIdentityName": "Ruby Requestee",
                                "accessRequestId": "00000000000040008000000000000000",
                                "identityRequestId": "00000000000040008000000000000000",
                                "workflowCaseId": "00000000000040008000000000000000"
                            }
                        },
                        "uuid": "00000000-0000-4000-8000-000000000000"
                    },
                    "preApprovalResult": {
                        "reviewer": "urn:identity:pre-approver",
                        "approved": true,
                        "comment": "Pre-approval trigger approved this request"
                    },
                    "privilegeLevel": "HIGH",
                    "privileged": "HIGH",
                    "jitDetails": [
                        {
                            "applicationId": "00000000000040008000000000000000",
                            "attributeName": "memberOf",
                            "attributeValues": [
                                "CN=Helpdesk,OU=Groups,DC=example,DC=com"
                            ]
                        }
                    ],
                    "timeoutComment": "Request for a change of assignment start date was expired by the system because the original start date/time was reached.",
                    "removeDateUpdateRequested": true,
                    "currentRemoveDate": "2026-12-01T17:00:00Z",
                    "startDateUpdateRequested": true,
                    "currentStartDate": "2026-09-01T08:00:00Z"
                }
            },
            {
                "key": "batchSize",
                "type": "number",
                "description": "Number of batched requests relating to this approval request",
                "example": 1
            },
            {
                "key": "clientMetadata",
                "type": "string",
                "description": "Java toString of client metadata. Use attributes.clientMetadata for the structured map.",
                "example": "{snowRITM=RITM001234, ticketId=INC009876}"
            },
            {
                "key": "commentRequiredWhenRejected",
                "type": "boolean",
                "description": "Whether a comment is required when the reviewer denies the request.",
                "example": true
            },
            {
                "key": "dimensionContext",
                "type": "object",
                "description": "Dimension context for a dynamic role request.",
                "example": {}
            },
            {
                "key": "dueDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the approval is due for completion",
                "example": "2047-09-21T12:30:0.0Z"
            },
            {
                "key": "fullNotificationConfigForSpApprovals",
                "type": "boolean",
                "description": "Whether the full notification configuration was passed through to sp-approvals.",
                "example": true
            },
            {
                "key": "id",
                "type": "string",
                "description": "Identity request identifier associated with this approval.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "latestComment",
                "type": "string",
                "description": "Most recent comment on the approval",
                "example": "Lorem ipsum dolor sit amet."
            },
            {
                "key": "latestCommentAuthor",
                "type": "object",
                "description": "Author of the most recent comment",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "name": "Rebecca Requester"
                }
            },
            {
                "key": "matchedRolesInformation",
                "type": "object",
                "description": "Matched dynamic-role attribute values keyed by attribute name. Empty for a static role.",
                "example": {}
            },
            {
                "key": "removeDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to end.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "requestContextInformation",
                "type": "object",
                "description": "Requested dynamic-role context attributes. Empty for a static role.",
                "example": {}
            },
            {
                "key": "requestedAppName",
                "type": "string",
                "description": "Application display name when an entitlement is requested through an application.",
                "example": "Active Directory"
            },
            {
                "key": "requestedBy",
                "type": "object",
                "description": "Identity who submitted the access request.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Rebecca Requester",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedFor",
                "type": "object",
                "description": "Identity for whom access was requested.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Ruby Requestee",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedForIdentityName",
                "type": "string",
                "description": "Display name of the identity for whom access was requested.",
                "example": "Ruby Requestee"
            },
            {
                "key": "requestedObject",
                "type": "object",
                "description": "Requested access object.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Finance Analyst",
                    "description": "Role granting finance reporting and sales-record access",
                    "type": "ROLE"
                }
            },
            {
                "key": "requestedObjectDescription",
                "type": "string",
                "description": "Description of the requested access object.",
                "example": "Role granting finance reporting and sales-record access"
            },
            {
                "key": "requestedObjectName",
                "type": "string",
                "description": "Name of the requested access object.",
                "example": "Finance Analyst"
            },
            {
                "key": "requestedObjectType",
                "type": "string",
                "description": "Display-cased type of the requested object.",
                "example": "Role"
            },
            {
                "key": "requestee",
                "type": "object",
                "description": "Identity for whom the approval request was made",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Ruby Requestee",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requester",
                "type": "object",
                "description": "Identity who submitted the approval request",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Rebecca Requester",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requesterComment",
                "type": "object",
                "description": "Requester comment captured when the access request was submitted.",
                "example": {
                    "comment": "Please review this access request",
                    "author": {
                        "id": "00000000000040008000000000000000",
                        "name": "Rebecca Requester",
                        "type": "IDENTITY"
                    }
                }
            },
            {
                "key": "requesterComments",
                "type": "string",
                "description": "Plain-text reason the requester gave when submitting the request.",
                "example": "Please review this access request"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "Display name of the identity who submitted the request.",
                "example": "Rebecca Requester"
            },
            {
                "key": "roleRequestEnabled",
                "type": "boolean",
                "description": "Whether role request handling is enabled for this notification context.",
                "example": true
            },
            {
                "key": "sourceInformation",
                "type": "array",
                "description": "Requested accounts grouped by source ID.",
                "example": [
                    {
                        "sourceId": "00000000000040008000000000000000",
                        "accounts": [
                            {
                                "accountUuid": "00000000-0000-4000-8000-000000000000",
                                "nativeIdentity": "CN=Ruby Requestee,OU=Users,DC=example,DC=com"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "startDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to start.",
                "example": "2026-09-15T08:00:00Z"
            },
            {
                "key": "type",
                "type": "string",
                "description": "Type of approval request",
                "example": "ACCESS_REQUEST_APPROVAL"
            }
        ]
    },
    "access_request_submitted_with_approvers_with_robo": {
        "SLACK": [
            {
                "key": "accessibleItems",
                "type": "array",
                "description": "Names of nested access items on a requested role. Empty for access profiles and entitlements.",
                "example": [
                    "Sales Access",
                    "Finance Reporting"
                ]
            },
            {
                "key": "accessProfileDescription",
                "type": "string",
                "description": "Description of the requested access profile. Present only for access profile requests.",
                "example": "This access allows viewing and managing sales records"
            },
            {
                "key": "accessProfileName",
                "type": "string",
                "description": "Name of the requested access profile. Present only for access profile requests.",
                "example": "Sales Access"
            },
            {
                "key": "accessRequestItemsWithApprovals",
                "type": "array",
                "description": "Requested access items and the approvals generated for each item.",
                "example": [
                    {
                        "accessRequestItem": {
                            "id": "00000000000040008000000000000000",
                            "name": "Finance Analyst",
                            "description": "Role granting finance reporting and sales-record access",
                            "type": "ROLE",
                            "removeDate": "2026-12-15T17:00:00Z",
                            "requesterComment": {
                                "comment": "Please review this access request",
                                "author": {
                                    "id": "00000000000040008000000000000000",
                                    "name": "Rebecca Requester",
                                    "type": "IDENTITY"
                                }
                            },
                            "clientMetadata": "{snowRITM=RITM001234, ticketId=INC009876}",
                            "dimensionContext": null
                        },
                        "approvals": [
                            {
                                "approvalScheme": "owner"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "accessRequestType",
                "type": "string",
                "description": "Access request operation.",
                "example": "GRANT_ACCESS"
            },
            {
                "key": "approvalName",
                "type": "string",
                "description": "Display name of the approval request",
                "example": "Request for Access to Sales Application"
            },
            {
                "key": "approverPath",
                "type": "string",
                "description": "URL path to the approver dashboard",
                "example": "approvals/requested-items"
            },
            {
                "key": "assignmentContext",
                "type": "object",
                "description": "Assignment context for a dynamic role request. Null or absent for a static role.",
                "example": {}
            },
            {
                "key": "attributes",
                "type": "object",
                "description": "Comprehensive attributes map containing approval details, identities, comments, history, configuration, and other custom fields specific to particular approval request types",
                "example": {
                    "approvalID": "00000000-0000-4000-8000-000000000000",
                    "type": "ACCESS_REQUEST_APPROVAL",
                    "approvers": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "serialOrder": 1,
                            "email": "user@example.com"
                        },
                        {
                            "identityID": "00000000-0000-4000-8000-000000000000",
                            "type": "GOVERNANCE_GROUP",
                            "name": "Test Group 1",
                            "members": [
                                {
                                    "id": "00000000000040008000000000000000",
                                    "type": "IDENTITY",
                                    "name": "Barry Member",
                                    "email": "user@example.com"
                                }
                            ],
                            "serialOrder": 2
                        }
                    ],
                    "assignedTo": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "email": "user@example.com"
                        }
                    ],
                    "createdDate": "2047-08-30T18:16:29.053371Z",
                    "dueDate": "2047-09-21T12:30:0.0Z",
                    "description": "This access allows viewing and managing sales records",
                    "requester": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Rebecca Requester",
                        "email": "user@example.com"
                    },
                    "requestee": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Ruby Requestee",
                        "email": "user@example.com"
                    },
                    "comments": [
                        {
                            "commentId": "00000000-0000-4000-8000-000000000000",
                            "author": {
                                "identityID": "00000000000040008000000000000000",
                                "name": "Rebecca Requester"
                            },
                            "comment": "Lorem ipsum dolor sit amet.",
                            "createdDate": "2026-02-13T18:48:54.452979Z"
                        }
                    ],
                    "approvalCriteria": {
                        "type": "SERIAL",
                        "rejection": {
                            "calculationType": "COUNT",
                            "value": 1
                        },
                        "approval": {
                            "calculationType": "PERCENT",
                            "value": 100
                        }
                    },
                    "reassignmentHistory": [
                        {
                            "reassignmentType": "ESCALATION",
                            "reassignedFrom": {
                                "identityID": "00000000000040008000000000000000",
                                "type": "IDENTITY",
                                "name": "Will Approver"
                            },
                            "reassignedTo": {
                                "identityID": "00000000-0000-4000-8000-000000000000",
                                "type": "GOVERNANCE_GROUP",
                                "name": "Test Group 1"
                            },
                            "reassigner": {
                                "identityID": "System Automation",
                                "type": "IDENTITY"
                            },
                            "reassignmentDate": "2047-08-30T18:23:52.817415Z"
                        }
                    ],
                    "approvedBy": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "decisionDate": "2026-02-13T18:54:09.981077Z",
                            "email": "user@example.com"
                        }
                    ],
                    "completedDate": "",
                    "status": "PENDING",
                    "approvalConfig": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "scope": "APPROVAL_REQUEST",
                        "reminderConfig": {
                            "enabled": true,
                            "daysUntilFirstReminder": 2,
                            "reminderCronSchedule": "0 8 * * *",
                            "maxReminders": 2
                        },
                        "escalationConfig": {
                            "enabled": true,
                            "daysUntilFirstEscalation": 4,
                            "escalationCronSchedule": "0 8 */4 * *"
                        },
                        "timeoutConfig": {
                            "enabled": true,
                            "daysUntilTimeout": 7,
                            "timeoutResult": "EXPIRED"
                        },
                        "requiresComment": "ALL",
                        "autoApprove": "OFF"
                    },
                    "requestedTarget": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "type": "ACCESS_PROFILE",
                        "name": "Sales Access"
                    },
                    "requestedAccounts": "[{\"sourceId\":\"00000000000040008000000000000000\",\"accounts\":[{\"accountUuid\":\"00000000-0000-4000-8000-000000000000\",\"nativeIdentity\":\"CN=Ruby Requestee,OU=Users,DC=example,DC=com\"}]}]",
                    "clientMetadata": {
                        "snowRITM": "RITM001234",
                        "ticketId": "INC009876"
                    },
                    "maxPermittedAccessDuration": {
                        "timeUnit": "HOURS",
                        "value": 4
                    },
                    "requireEndDate": true,
                    "timeoutDate": "2026-12-15T17:00:00Z",
                    "form": {
                        "formDefinitionId": "fd-00000000-0000-4000-8000-000000000000",
                        "formInstanceId": "fi-00000000-0000-4000-8000-000000000000",
                        "formData": {
                            "businessJustification": "Quarter-end close",
                            "managerAcknowledged": "yes"
                        },
                        "formElements": [
                            {
                                "id": "el-businessJustification",
                                "elementType": "TEXT"
                            }
                        ],
                        "formConditions": [
                            {
                                "condition": "always"
                            }
                        ],
                        "formInstanceInputs": {
                            "requestedFor": "00000000000040008000000000000000"
                        }
                    },
                    "sodViolationContext": {
                        "state": "SUCCESS",
                        "violationCheckResult": {
                            "message": {
                                "locale": "en-US",
                                "localeOrigin": "DEFAULT",
                                "text": ""
                            },
                            "violatedPolicies": [
                                {
                                    "type": "SOD_POLICY",
                                    "id": "00000000-0000-4000-8000-000000000000",
                                    "name": "SOD Policy Test"
                                }
                            ],
                            "violationContexts": [
                                {
                                    "policy": {
                                        "type": "SOD_POLICY",
                                        "id": "00000000-0000-4000-8000-000000000000",
                                        "name": "SOD Policy Test"
                                    },
                                    "conflictingAccessCriteria": {
                                        "leftCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Helpdesk"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "TestGroup"
                                                }
                                            ]
                                        },
                                        "rightCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Certifications"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Dashboard"
                                                }
                                            ]
                                        }
                                    }
                                }
                            ],
                            "clientMetadata": {
                                "targetIdentityName": "Ruby Requestee",
                                "accessRequestId": "00000000000040008000000000000000",
                                "identityRequestId": "00000000000040008000000000000000",
                                "workflowCaseId": "00000000000040008000000000000000"
                            }
                        },
                        "uuid": "00000000-0000-4000-8000-000000000000"
                    },
                    "preApprovalResult": {
                        "reviewer": "urn:identity:pre-approver",
                        "approved": true,
                        "comment": "Pre-approval trigger approved this request"
                    },
                    "privilegeLevel": "HIGH",
                    "privileged": "HIGH",
                    "jitDetails": [
                        {
                            "applicationId": "00000000000040008000000000000000",
                            "attributeName": "memberOf",
                            "attributeValues": [
                                "CN=Helpdesk,OU=Groups,DC=example,DC=com"
                            ]
                        }
                    ],
                    "timeoutComment": "Request for a change of assignment start date was expired by the system because the original start date/time was reached.",
                    "removeDateUpdateRequested": true,
                    "currentRemoveDate": "2026-12-01T17:00:00Z",
                    "startDateUpdateRequested": true,
                    "currentStartDate": "2026-09-01T08:00:00Z"
                }
            },
            {
                "key": "batchSize",
                "type": "number",
                "description": "Number of batched requests relating to this approval request",
                "example": 1
            },
            {
                "key": "clientMetadata",
                "type": "string",
                "description": "Java toString of client metadata. Use attributes.clientMetadata for the structured map.",
                "example": "{snowRITM=RITM001234, ticketId=INC009876}"
            },
            {
                "key": "commentRequiredWhenRejected",
                "type": "boolean",
                "description": "Whether a comment is required when the reviewer denies the request.",
                "example": true
            },
            {
                "key": "dimensionContext",
                "type": "object",
                "description": "Dimension context for a dynamic role request.",
                "example": {}
            },
            {
                "key": "dueDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the approval is due for completion",
                "example": "2047-09-21T12:30:0.0Z"
            },
            {
                "key": "fullNotificationConfigForSpApprovals",
                "type": "boolean",
                "description": "Whether the full notification configuration was passed through to sp-approvals.",
                "example": true
            },
            {
                "key": "id",
                "type": "string",
                "description": "Identity request identifier associated with this approval.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "latestComment",
                "type": "string",
                "description": "Most recent comment on the approval",
                "example": "Lorem ipsum dolor sit amet."
            },
            {
                "key": "latestCommentAuthor",
                "type": "object",
                "description": "Author of the most recent comment",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "name": "Rebecca Requester"
                }
            },
            {
                "key": "matchedRolesInformation",
                "type": "object",
                "description": "Matched dynamic-role attribute values keyed by attribute name. Empty for a static role.",
                "example": {}
            },
            {
                "key": "removeDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to end.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "requestContextInformation",
                "type": "object",
                "description": "Requested dynamic-role context attributes. Empty for a static role.",
                "example": {}
            },
            {
                "key": "requestedAppName",
                "type": "string",
                "description": "Application display name when an entitlement is requested through an application.",
                "example": "Active Directory"
            },
            {
                "key": "requestedBy",
                "type": "object",
                "description": "Identity who submitted the access request.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Rebecca Requester",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedFor",
                "type": "object",
                "description": "Identity for whom access was requested.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Ruby Requestee",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedForIdentityName",
                "type": "string",
                "description": "Display name of the identity for whom access was requested.",
                "example": "Ruby Requestee"
            },
            {
                "key": "requestedObject",
                "type": "object",
                "description": "Requested access object.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Finance Analyst",
                    "description": "Role granting finance reporting and sales-record access",
                    "type": "ROLE"
                }
            },
            {
                "key": "requestedObjectDescription",
                "type": "string",
                "description": "Description of the requested access object.",
                "example": "Role granting finance reporting and sales-record access"
            },
            {
                "key": "requestedObjectName",
                "type": "string",
                "description": "Name of the requested access object.",
                "example": "Finance Analyst"
            },
            {
                "key": "requestedObjectType",
                "type": "string",
                "description": "Display-cased type of the requested object.",
                "example": "Role"
            },
            {
                "key": "requestee",
                "type": "object",
                "description": "Identity for whom the approval request was made",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Ruby Requestee",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requester",
                "type": "object",
                "description": "Identity who submitted the approval request",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Rebecca Requester",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requesterComment",
                "type": "object",
                "description": "Requester comment captured when the access request was submitted.",
                "example": {
                    "comment": "Please review this access request",
                    "author": {
                        "id": "00000000000040008000000000000000",
                        "name": "Rebecca Requester",
                        "type": "IDENTITY"
                    }
                }
            },
            {
                "key": "requesterComments",
                "type": "string",
                "description": "Plain-text reason the requester gave when submitting the request.",
                "example": "Please review this access request"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "Display name of the identity who submitted the request.",
                "example": "Rebecca Requester"
            },
            {
                "key": "roleRequestEnabled",
                "type": "boolean",
                "description": "Whether role request handling is enabled for this notification context.",
                "example": true
            },
            {
                "key": "sourceInformation",
                "type": "array",
                "description": "Requested accounts grouped by source ID.",
                "example": [
                    {
                        "sourceId": "00000000000040008000000000000000",
                        "accounts": [
                            {
                                "accountUuid": "00000000-0000-4000-8000-000000000000",
                                "nativeIdentity": "CN=Ruby Requestee,OU=Users,DC=example,DC=com"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "startDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to start.",
                "example": "2026-09-15T08:00:00Z"
            },
            {
                "key": "type",
                "type": "string",
                "description": "Type of approval request",
                "example": "ACCESS_REQUEST_APPROVAL"
            }
        ],
        "TEAMS": [
            {
                "key": "accessibleItems",
                "type": "array",
                "description": "Names of nested access items on a requested role. Empty for access profiles and entitlements.",
                "example": [
                    "Sales Access",
                    "Finance Reporting"
                ]
            },
            {
                "key": "accessProfileDescription",
                "type": "string",
                "description": "Description of the requested access profile. Present only for access profile requests.",
                "example": "This access allows viewing and managing sales records"
            },
            {
                "key": "accessProfileName",
                "type": "string",
                "description": "Name of the requested access profile. Present only for access profile requests.",
                "example": "Sales Access"
            },
            {
                "key": "accessRequestItemsWithApprovals",
                "type": "array",
                "description": "Requested access items and the approvals generated for each item.",
                "example": [
                    {
                        "accessRequestItem": {
                            "id": "00000000000040008000000000000000",
                            "name": "Finance Analyst",
                            "description": "Role granting finance reporting and sales-record access",
                            "type": "ROLE",
                            "removeDate": "2026-12-15T17:00:00Z",
                            "requesterComment": {
                                "comment": "Please review this access request",
                                "author": {
                                    "id": "00000000000040008000000000000000",
                                    "name": "Rebecca Requester",
                                    "type": "IDENTITY"
                                }
                            },
                            "clientMetadata": "{snowRITM=RITM001234, ticketId=INC009876}",
                            "dimensionContext": null
                        },
                        "approvals": [
                            {
                                "approvalScheme": "owner"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "accessRequestType",
                "type": "string",
                "description": "Access request operation.",
                "example": "GRANT_ACCESS"
            },
            {
                "key": "approvalName",
                "type": "string",
                "description": "Display name of the approval request",
                "example": "Request for Access to Sales Application"
            },
            {
                "key": "approverPath",
                "type": "string",
                "description": "URL path to the approver dashboard",
                "example": "approvals/requested-items"
            },
            {
                "key": "assignmentContext",
                "type": "object",
                "description": "Assignment context for a dynamic role request. Null or absent for a static role.",
                "example": {}
            },
            {
                "key": "attributes",
                "type": "object",
                "description": "Comprehensive attributes map containing approval details, identities, comments, history, configuration, and other custom fields specific to particular approval request types",
                "example": {
                    "approvalID": "00000000-0000-4000-8000-000000000000",
                    "type": "ACCESS_REQUEST_APPROVAL",
                    "approvers": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "serialOrder": 1,
                            "email": "user@example.com"
                        },
                        {
                            "identityID": "00000000-0000-4000-8000-000000000000",
                            "type": "GOVERNANCE_GROUP",
                            "name": "Test Group 1",
                            "members": [
                                {
                                    "id": "00000000000040008000000000000000",
                                    "type": "IDENTITY",
                                    "name": "Barry Member",
                                    "email": "user@example.com"
                                }
                            ],
                            "serialOrder": 2
                        }
                    ],
                    "assignedTo": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "email": "user@example.com"
                        }
                    ],
                    "createdDate": "2047-08-30T18:16:29.053371Z",
                    "dueDate": "2047-09-21T12:30:0.0Z",
                    "description": "This access allows viewing and managing sales records",
                    "requester": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Rebecca Requester",
                        "email": "user@example.com"
                    },
                    "requestee": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Ruby Requestee",
                        "email": "user@example.com"
                    },
                    "comments": [
                        {
                            "commentId": "00000000-0000-4000-8000-000000000000",
                            "author": {
                                "identityID": "00000000000040008000000000000000",
                                "name": "Rebecca Requester"
                            },
                            "comment": "Lorem ipsum dolor sit amet.",
                            "createdDate": "2026-02-13T18:48:54.452979Z"
                        }
                    ],
                    "approvalCriteria": {
                        "type": "SERIAL",
                        "rejection": {
                            "calculationType": "COUNT",
                            "value": 1
                        },
                        "approval": {
                            "calculationType": "PERCENT",
                            "value": 100
                        }
                    },
                    "reassignmentHistory": [
                        {
                            "reassignmentType": "ESCALATION",
                            "reassignedFrom": {
                                "identityID": "00000000000040008000000000000000",
                                "type": "IDENTITY",
                                "name": "Will Approver"
                            },
                            "reassignedTo": {
                                "identityID": "00000000-0000-4000-8000-000000000000",
                                "type": "GOVERNANCE_GROUP",
                                "name": "Test Group 1"
                            },
                            "reassigner": {
                                "identityID": "System Automation",
                                "type": "IDENTITY"
                            },
                            "reassignmentDate": "2047-08-30T18:23:52.817415Z"
                        }
                    ],
                    "approvedBy": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "decisionDate": "2026-02-13T18:54:09.981077Z",
                            "email": "user@example.com"
                        }
                    ],
                    "completedDate": "",
                    "status": "PENDING",
                    "approvalConfig": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "scope": "APPROVAL_REQUEST",
                        "reminderConfig": {
                            "enabled": true,
                            "daysUntilFirstReminder": 2,
                            "reminderCronSchedule": "0 8 * * *",
                            "maxReminders": 2
                        },
                        "escalationConfig": {
                            "enabled": true,
                            "daysUntilFirstEscalation": 4,
                            "escalationCronSchedule": "0 8 */4 * *"
                        },
                        "timeoutConfig": {
                            "enabled": true,
                            "daysUntilTimeout": 7,
                            "timeoutResult": "EXPIRED"
                        },
                        "requiresComment": "ALL",
                        "autoApprove": "OFF"
                    },
                    "requestedTarget": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "type": "ACCESS_PROFILE",
                        "name": "Sales Access"
                    },
                    "requestedAccounts": "[{\"sourceId\":\"00000000000040008000000000000000\",\"accounts\":[{\"accountUuid\":\"00000000-0000-4000-8000-000000000000\",\"nativeIdentity\":\"CN=Ruby Requestee,OU=Users,DC=example,DC=com\"}]}]",
                    "clientMetadata": {
                        "snowRITM": "RITM001234",
                        "ticketId": "INC009876"
                    },
                    "maxPermittedAccessDuration": {
                        "timeUnit": "HOURS",
                        "value": 4
                    },
                    "requireEndDate": true,
                    "timeoutDate": "2026-12-15T17:00:00Z",
                    "form": {
                        "formDefinitionId": "fd-00000000-0000-4000-8000-000000000000",
                        "formInstanceId": "fi-00000000-0000-4000-8000-000000000000",
                        "formData": {
                            "businessJustification": "Quarter-end close",
                            "managerAcknowledged": "yes"
                        },
                        "formElements": [
                            {
                                "id": "el-businessJustification",
                                "elementType": "TEXT"
                            }
                        ],
                        "formConditions": [
                            {
                                "condition": "always"
                            }
                        ],
                        "formInstanceInputs": {
                            "requestedFor": "00000000000040008000000000000000"
                        }
                    },
                    "sodViolationContext": {
                        "state": "SUCCESS",
                        "violationCheckResult": {
                            "message": {
                                "locale": "en-US",
                                "localeOrigin": "DEFAULT",
                                "text": ""
                            },
                            "violatedPolicies": [
                                {
                                    "type": "SOD_POLICY",
                                    "id": "00000000-0000-4000-8000-000000000000",
                                    "name": "SOD Policy Test"
                                }
                            ],
                            "violationContexts": [
                                {
                                    "policy": {
                                        "type": "SOD_POLICY",
                                        "id": "00000000-0000-4000-8000-000000000000",
                                        "name": "SOD Policy Test"
                                    },
                                    "conflictingAccessCriteria": {
                                        "leftCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Helpdesk"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "TestGroup"
                                                }
                                            ]
                                        },
                                        "rightCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Certifications"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Dashboard"
                                                }
                                            ]
                                        }
                                    }
                                }
                            ],
                            "clientMetadata": {
                                "targetIdentityName": "Ruby Requestee",
                                "accessRequestId": "00000000000040008000000000000000",
                                "identityRequestId": "00000000000040008000000000000000",
                                "workflowCaseId": "00000000000040008000000000000000"
                            }
                        },
                        "uuid": "00000000-0000-4000-8000-000000000000"
                    },
                    "preApprovalResult": {
                        "reviewer": "urn:identity:pre-approver",
                        "approved": true,
                        "comment": "Pre-approval trigger approved this request"
                    },
                    "privilegeLevel": "HIGH",
                    "privileged": "HIGH",
                    "jitDetails": [
                        {
                            "applicationId": "00000000000040008000000000000000",
                            "attributeName": "memberOf",
                            "attributeValues": [
                                "CN=Helpdesk,OU=Groups,DC=example,DC=com"
                            ]
                        }
                    ],
                    "timeoutComment": "Request for a change of assignment start date was expired by the system because the original start date/time was reached.",
                    "removeDateUpdateRequested": true,
                    "currentRemoveDate": "2026-12-01T17:00:00Z",
                    "startDateUpdateRequested": true,
                    "currentStartDate": "2026-09-01T08:00:00Z"
                }
            },
            {
                "key": "batchSize",
                "type": "number",
                "description": "Number of batched requests relating to this approval request",
                "example": 1
            },
            {
                "key": "clientMetadata",
                "type": "string",
                "description": "Java toString of client metadata. Use attributes.clientMetadata for the structured map.",
                "example": "{snowRITM=RITM001234, ticketId=INC009876}"
            },
            {
                "key": "commentRequiredWhenRejected",
                "type": "boolean",
                "description": "Whether a comment is required when the reviewer denies the request.",
                "example": true
            },
            {
                "key": "dimensionContext",
                "type": "object",
                "description": "Dimension context for a dynamic role request.",
                "example": {}
            },
            {
                "key": "dueDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the approval is due for completion",
                "example": "2047-09-21T12:30:0.0Z"
            },
            {
                "key": "fullNotificationConfigForSpApprovals",
                "type": "boolean",
                "description": "Whether the full notification configuration was passed through to sp-approvals.",
                "example": true
            },
            {
                "key": "id",
                "type": "string",
                "description": "Identity request identifier associated with this approval.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "latestComment",
                "type": "string",
                "description": "Most recent comment on the approval",
                "example": "Lorem ipsum dolor sit amet."
            },
            {
                "key": "latestCommentAuthor",
                "type": "object",
                "description": "Author of the most recent comment",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "name": "Rebecca Requester"
                }
            },
            {
                "key": "matchedRolesInformation",
                "type": "object",
                "description": "Matched dynamic-role attribute values keyed by attribute name. Empty for a static role.",
                "example": {}
            },
            {
                "key": "removeDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to end.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "requestContextInformation",
                "type": "object",
                "description": "Requested dynamic-role context attributes. Empty for a static role.",
                "example": {}
            },
            {
                "key": "requestedAppName",
                "type": "string",
                "description": "Application display name when an entitlement is requested through an application.",
                "example": "Active Directory"
            },
            {
                "key": "requestedBy",
                "type": "object",
                "description": "Identity who submitted the access request.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Rebecca Requester",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedFor",
                "type": "object",
                "description": "Identity for whom access was requested.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Ruby Requestee",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedForIdentityName",
                "type": "string",
                "description": "Display name of the identity for whom access was requested.",
                "example": "Ruby Requestee"
            },
            {
                "key": "requestedObject",
                "type": "object",
                "description": "Requested access object.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Finance Analyst",
                    "description": "Role granting finance reporting and sales-record access",
                    "type": "ROLE"
                }
            },
            {
                "key": "requestedObjectDescription",
                "type": "string",
                "description": "Description of the requested access object.",
                "example": "Role granting finance reporting and sales-record access"
            },
            {
                "key": "requestedObjectName",
                "type": "string",
                "description": "Name of the requested access object.",
                "example": "Finance Analyst"
            },
            {
                "key": "requestedObjectType",
                "type": "string",
                "description": "Display-cased type of the requested object.",
                "example": "Role"
            },
            {
                "key": "requestee",
                "type": "object",
                "description": "Identity for whom the approval request was made",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Ruby Requestee",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requester",
                "type": "object",
                "description": "Identity who submitted the approval request",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Rebecca Requester",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requesterComment",
                "type": "object",
                "description": "Requester comment captured when the access request was submitted.",
                "example": {
                    "comment": "Please review this access request",
                    "author": {
                        "id": "00000000000040008000000000000000",
                        "name": "Rebecca Requester",
                        "type": "IDENTITY"
                    }
                }
            },
            {
                "key": "requesterComments",
                "type": "string",
                "description": "Plain-text reason the requester gave when submitting the request.",
                "example": "Please review this access request"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "Display name of the identity who submitted the request.",
                "example": "Rebecca Requester"
            },
            {
                "key": "roleRequestEnabled",
                "type": "boolean",
                "description": "Whether role request handling is enabled for this notification context.",
                "example": true
            },
            {
                "key": "sourceInformation",
                "type": "array",
                "description": "Requested accounts grouped by source ID.",
                "example": [
                    {
                        "sourceId": "00000000000040008000000000000000",
                        "accounts": [
                            {
                                "accountUuid": "00000000-0000-4000-8000-000000000000",
                                "nativeIdentity": "CN=Ruby Requestee,OU=Users,DC=example,DC=com"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "startDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to start.",
                "example": "2026-09-15T08:00:00Z"
            },
            {
                "key": "type",
                "type": "string",
                "description": "Type of approval request",
                "example": "ACCESS_REQUEST_APPROVAL"
            }
        ]
    },
    "access_revoke_approval_reassignment": {
        "EMAIL": [
            {
                "key": "commentText",
                "type": "string",
                "description": "Comments that a previous reviewer left about the access revoke request.",
                "example": "Example"
            },
            {
                "key": "newOwnerName",
                "type": "string",
                "description": "The identity that the access revoke request was reassigned to.",
                "example": "Example Name"
            },
            {
                "key": "previousOwnerName",
                "type": "string",
                "description": "The identity that the review was reassigned from.",
                "example": "Example Name"
            },
            {
                "key": "requestedForIdentityName",
                "type": "string",
                "description": "The identity that the access revoke request was requested for.",
                "example": "Example Name"
            },
            {
                "key": "requestedObjectName",
                "type": "string",
                "description": "The name of the item that was requested.",
                "example": "Example Name"
            },
            {
                "key": "requestedObjectType",
                "type": "string",
                "description": "The type of the item requested.",
                "example": "Example"
            }
        ]
    },
    "access_revoke_request_decision_email_for_requested-for_identity": {
        "EMAIL": [
            {
                "key": "approved",
                "type": "boolean",
                "description": "The approval decision.",
                "example": true
            },
            {
                "key": "removeDate",
                "type": "string",
                "description": "The date on which the access will be removed.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "requestedForIdentityName",
                "type": "string",
                "description": "The identity whose access was requested to be revoked.",
                "example": "Example Name"
            },
            {
                "key": "requestedObjectName",
                "type": "string",
                "description": "The name of the item requested to be revoked.",
                "example": "Example Name"
            },
            {
                "key": "requestedObjectType",
                "type": "string",
                "description": "The type of the item requested to be revoked.",
                "example": "Example"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "The identity who submitted the access revoke request.",
                "example": "Example Name"
            }
        ]
    },
    "access_revoke_request_decision_for_requester": {
        "EMAIL": [
            {
                "key": "approved",
                "type": "boolean",
                "description": "The approval decision.",
                "example": true
            },
            {
                "key": "rejecterName",
                "type": "string",
                "description": "If applicable, the name of the reviewer who rejected this request.",
                "example": "Example Name"
            },
            {
                "key": "removeDate",
                "type": "string",
                "description": "The date on which the access will be removed.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "requestedForIdentityName",
                "type": "string",
                "description": "The identity whose access was requested to be revoked.",
                "example": "Example Name"
            },
            {
                "key": "requestedObjectName",
                "type": "string",
                "description": "The name of the item requested to be revoked.",
                "example": "Example Name"
            },
            {
                "key": "requestedObjectType",
                "type": "string",
                "description": "The type of the item requested to be revoked.",
                "example": "Example"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "The identity who submitted the access revoke request.",
                "example": "Example Name"
            },
            {
                "key": "reviewerComment",
                "type": "string",
                "description": "The comments the reviewer entered when they denied access, if applicable.",
                "example": "Example"
            }
        ]
    },
    "access_revoke_request_reviewer": {
        "EMAIL": [
            {
                "key": "accessibleItems",
                "type": "array",
                "description": "Names of nested access items on a requested role. Empty for access profiles and entitlements.",
                "example": [
                    "Sales Access",
                    "Finance Reporting"
                ]
            },
            {
                "key": "accessProfileDescription",
                "type": "string",
                "description": "Description of the requested access profile. Present only for access profile requests.",
                "example": "This access allows viewing and managing sales records"
            },
            {
                "key": "accessProfileName",
                "type": "string",
                "description": "Name of the requested access profile. Present only for access profile requests.",
                "example": "Sales Access"
            },
            {
                "key": "accessRequestItemsWithApprovals",
                "type": "array",
                "description": "Requested access items and the approvals generated for each item.",
                "example": [
                    {
                        "accessRequestItem": {
                            "id": "00000000000040008000000000000000",
                            "name": "Finance Analyst",
                            "description": "Role granting finance reporting and sales-record access",
                            "type": "ROLE",
                            "removeDate": "2026-12-15T17:00:00Z",
                            "requesterComment": {
                                "comment": "Please review this access request",
                                "author": {
                                    "id": "00000000000040008000000000000000",
                                    "name": "Rebecca Requester",
                                    "type": "IDENTITY"
                                }
                            },
                            "clientMetadata": "{snowRITM=RITM001234, ticketId=INC009876}",
                            "dimensionContext": null
                        },
                        "approvals": [
                            {
                                "approvalScheme": "owner"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "accessRequestType",
                "type": "string",
                "description": "Access request operation.",
                "example": "REVOKE_ACCESS"
            },
            {
                "key": "approvalName",
                "type": "string",
                "description": "Display name of the approval request",
                "example": "Request for Access to Sales Application"
            },
            {
                "key": "approverPath",
                "type": "string",
                "description": "URL path to the approver dashboard",
                "example": "approvals/requested-items"
            },
            {
                "key": "assignmentContext",
                "type": "object",
                "description": "Assignment context for a dynamic role request. Null or absent for a static role.",
                "example": {}
            },
            {
                "key": "attributes",
                "type": "object",
                "description": "Comprehensive attributes map containing approval details, identities, comments, history, configuration, and other custom fields specific to particular approval request types",
                "example": {
                    "approvalID": "00000000-0000-4000-8000-000000000000",
                    "type": "ACCESS_REQUEST_APPROVAL",
                    "approvers": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "serialOrder": 1,
                            "email": "user@example.com"
                        },
                        {
                            "identityID": "00000000-0000-4000-8000-000000000000",
                            "type": "GOVERNANCE_GROUP",
                            "name": "Test Group 1",
                            "members": [
                                {
                                    "id": "00000000000040008000000000000000",
                                    "type": "IDENTITY",
                                    "name": "Barry Member",
                                    "email": "user@example.com"
                                }
                            ],
                            "serialOrder": 2
                        }
                    ],
                    "assignedTo": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "email": "user@example.com"
                        }
                    ],
                    "createdDate": "2047-08-30T18:16:29.053371Z",
                    "dueDate": "2047-09-21T12:30:0.0Z",
                    "description": "This access allows viewing and managing sales records",
                    "requester": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Rebecca Requester",
                        "email": "user@example.com"
                    },
                    "requestee": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Ruby Requestee",
                        "email": "user@example.com"
                    },
                    "comments": [
                        {
                            "commentId": "00000000-0000-4000-8000-000000000000",
                            "author": {
                                "identityID": "00000000000040008000000000000000",
                                "name": "Rebecca Requester"
                            },
                            "comment": "Lorem ipsum dolor sit amet.",
                            "createdDate": "2026-02-13T18:48:54.452979Z"
                        }
                    ],
                    "approvalCriteria": {
                        "type": "SERIAL",
                        "rejection": {
                            "calculationType": "COUNT",
                            "value": 1
                        },
                        "approval": {
                            "calculationType": "PERCENT",
                            "value": 100
                        }
                    },
                    "reassignmentHistory": [
                        {
                            "reassignmentType": "ESCALATION",
                            "reassignedFrom": {
                                "identityID": "00000000000040008000000000000000",
                                "type": "IDENTITY",
                                "name": "Will Approver"
                            },
                            "reassignedTo": {
                                "identityID": "00000000-0000-4000-8000-000000000000",
                                "type": "GOVERNANCE_GROUP",
                                "name": "Test Group 1"
                            },
                            "reassigner": {
                                "identityID": "System Automation",
                                "type": "IDENTITY"
                            },
                            "reassignmentDate": "2047-08-30T18:23:52.817415Z"
                        }
                    ],
                    "approvedBy": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "decisionDate": "2026-02-13T18:54:09.981077Z",
                            "email": "user@example.com"
                        }
                    ],
                    "completedDate": "",
                    "status": "PENDING",
                    "approvalConfig": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "scope": "APPROVAL_REQUEST",
                        "reminderConfig": {
                            "enabled": true,
                            "daysUntilFirstReminder": 2,
                            "reminderCronSchedule": "0 8 * * *",
                            "maxReminders": 2
                        },
                        "escalationConfig": {
                            "enabled": true,
                            "daysUntilFirstEscalation": 4,
                            "escalationCronSchedule": "0 8 */4 * *"
                        },
                        "timeoutConfig": {
                            "enabled": true,
                            "daysUntilTimeout": 7,
                            "timeoutResult": "EXPIRED"
                        },
                        "requiresComment": "ALL",
                        "autoApprove": "OFF"
                    },
                    "requestedTarget": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "type": "ACCESS_PROFILE",
                        "name": "Sales Access"
                    },
                    "requestedAccounts": "[{\"sourceId\":\"00000000000040008000000000000000\",\"accounts\":[{\"accountUuid\":\"00000000-0000-4000-8000-000000000000\",\"nativeIdentity\":\"CN=Ruby Requestee,OU=Users,DC=example,DC=com\"}]}]",
                    "clientMetadata": {
                        "snowRITM": "RITM001234",
                        "ticketId": "INC009876"
                    },
                    "maxPermittedAccessDuration": {
                        "timeUnit": "HOURS",
                        "value": 4
                    },
                    "requireEndDate": true,
                    "timeoutDate": "2026-12-15T17:00:00Z",
                    "form": {
                        "formDefinitionId": "fd-00000000-0000-4000-8000-000000000000",
                        "formInstanceId": "fi-00000000-0000-4000-8000-000000000000",
                        "formData": {
                            "businessJustification": "Quarter-end close",
                            "managerAcknowledged": "yes"
                        },
                        "formElements": [
                            {
                                "id": "el-businessJustification",
                                "elementType": "TEXT"
                            }
                        ],
                        "formConditions": [
                            {
                                "condition": "always"
                            }
                        ],
                        "formInstanceInputs": {
                            "requestedFor": "00000000000040008000000000000000"
                        }
                    },
                    "sodViolationContext": {
                        "state": "SUCCESS",
                        "violationCheckResult": {
                            "message": {
                                "locale": "en-US",
                                "localeOrigin": "DEFAULT",
                                "text": ""
                            },
                            "violatedPolicies": [
                                {
                                    "type": "SOD_POLICY",
                                    "id": "00000000-0000-4000-8000-000000000000",
                                    "name": "SOD Policy Test"
                                }
                            ],
                            "violationContexts": [
                                {
                                    "policy": {
                                        "type": "SOD_POLICY",
                                        "id": "00000000-0000-4000-8000-000000000000",
                                        "name": "SOD Policy Test"
                                    },
                                    "conflictingAccessCriteria": {
                                        "leftCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Helpdesk"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "TestGroup"
                                                }
                                            ]
                                        },
                                        "rightCriteria": {
                                            "criteriaList": [
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Certifications"
                                                },
                                                {
                                                    "existing": false,
                                                    "type": "ENTITLEMENT",
                                                    "id": "00000000000040008000000000000000",
                                                    "name": "Dashboard"
                                                }
                                            ]
                                        }
                                    }
                                }
                            ],
                            "clientMetadata": {
                                "targetIdentityName": "Ruby Requestee",
                                "accessRequestId": "00000000000040008000000000000000",
                                "identityRequestId": "00000000000040008000000000000000",
                                "workflowCaseId": "00000000000040008000000000000000"
                            }
                        },
                        "uuid": "00000000-0000-4000-8000-000000000000"
                    },
                    "preApprovalResult": {
                        "reviewer": "urn:identity:pre-approver",
                        "approved": true,
                        "comment": "Pre-approval trigger approved this request"
                    },
                    "privilegeLevel": "HIGH",
                    "privileged": "HIGH",
                    "jitDetails": [
                        {
                            "applicationId": "00000000000040008000000000000000",
                            "attributeName": "memberOf",
                            "attributeValues": [
                                "CN=Helpdesk,OU=Groups,DC=example,DC=com"
                            ]
                        }
                    ],
                    "timeoutComment": "Request for a change of assignment start date was expired by the system because the original start date/time was reached.",
                    "removeDateUpdateRequested": true,
                    "currentRemoveDate": "2026-12-01T17:00:00Z",
                    "startDateUpdateRequested": true,
                    "currentStartDate": "2026-09-01T08:00:00Z"
                }
            },
            {
                "key": "batchSize",
                "type": "number",
                "description": "Number of batched requests relating to this approval request",
                "example": 1
            },
            {
                "key": "clientMetadata",
                "type": "string",
                "description": "Java toString of client metadata. Use attributes.clientMetadata for the structured map.",
                "example": "{snowRITM=RITM001234, ticketId=INC009876}"
            },
            {
                "key": "commentRequiredWhenRejected",
                "type": "boolean",
                "description": "Whether a comment is required when the reviewer denies the request.",
                "example": true
            },
            {
                "key": "createdDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the approval request was created",
                "example": "2047-08-30T18:16:29.053371Z"
            },
            {
                "key": "dimensionContext",
                "type": "object",
                "description": "Dimension context for a dynamic role request.",
                "example": {}
            },
            {
                "key": "dueDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the approval is due for completion",
                "example": "2047-09-21T12:30:0.0Z"
            },
            {
                "key": "escalatedApprover",
                "type": "object",
                "description": "Approver to whom this request was escalated",
                "example": {
                    "identityID": "00000000-0000-4000-8000-000000000000",
                    "type": "GOVERNANCE_GROUP",
                    "name": "Test Group 1"
                }
            },
            {
                "key": "escalationDelay",
                "type": "string",
                "description": "Human-readable duration that passed before escalation",
                "example": "4 days, 6 hours, 30 minutes"
            },
            {
                "key": "fullNotificationConfigForSpApprovals",
                "type": "boolean",
                "description": "Whether the full notification configuration was passed through to sp-approvals.",
                "example": true
            },
            {
                "key": "id",
                "type": "string",
                "description": "Identity request identifier associated with this approval.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "latestComment",
                "type": "string",
                "description": "Most recent comment on the approval",
                "example": "Lorem ipsum dolor sit amet."
            },
            {
                "key": "latestCommentAuthor",
                "type": "object",
                "description": "Author of the most recent comment",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "name": "Rebecca Requester"
                }
            },
            {
                "key": "matchedRolesInformation",
                "type": "object",
                "description": "Matched dynamic-role attribute values keyed by attribute name. Empty for a static role.",
                "example": {}
            },
            {
                "key": "previousApprover",
                "type": "object",
                "description": "Previous approver (when approval request is reassigned)",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Will Approver"
                }
            },
            {
                "key": "removeDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to end.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "requestContextInformation",
                "type": "object",
                "description": "Requested dynamic-role context attributes. Empty for a static role.",
                "example": {}
            },
            {
                "key": "requestedAppName",
                "type": "string",
                "description": "Application display name when an entitlement is requested through an application.",
                "example": "Active Directory"
            },
            {
                "key": "requestedBy",
                "type": "object",
                "description": "Identity who submitted the access request.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Rebecca Requester",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedFor",
                "type": "object",
                "description": "Identity for whom access was requested.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Ruby Requestee",
                    "type": "IDENTITY"
                }
            },
            {
                "key": "requestedForIdentityName",
                "type": "string",
                "description": "Display name of the identity for whom access was requested.",
                "example": "Ruby Requestee"
            },
            {
                "key": "requestedObject",
                "type": "object",
                "description": "Requested access object.",
                "example": {
                    "id": "00000000000040008000000000000000",
                    "name": "Finance Analyst",
                    "description": "Role granting finance reporting and sales-record access",
                    "type": "ROLE"
                }
            },
            {
                "key": "requestedObjectDescription",
                "type": "string",
                "description": "Description of the requested access object.",
                "example": "Role granting finance reporting and sales-record access"
            },
            {
                "key": "requestedObjectName",
                "type": "string",
                "description": "Name of the requested access object.",
                "example": "Finance Analyst"
            },
            {
                "key": "requestedObjectType",
                "type": "string",
                "description": "Display-cased type of the requested object.",
                "example": "Role"
            },
            {
                "key": "requestee",
                "type": "object",
                "description": "Identity for whom the approval request was made",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Ruby Requestee",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requester",
                "type": "object",
                "description": "Identity who submitted the approval request",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Rebecca Requester",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requesterComment",
                "type": "object",
                "description": "Requester comment captured when the access request was submitted.",
                "example": {
                    "comment": "Please review this access request",
                    "author": {
                        "id": "00000000000040008000000000000000",
                        "name": "Rebecca Requester",
                        "type": "IDENTITY"
                    }
                }
            },
            {
                "key": "requesterComments",
                "type": "string",
                "description": "Plain-text reason the requester gave when submitting the request.",
                "example": "Please review this access request"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "Display name of the identity who submitted the request.",
                "example": "Rebecca Requester"
            },
            {
                "key": "requesterPath",
                "type": "string",
                "description": "URL path to the requester dashboard",
                "example": "requests/my-requests"
            },
            {
                "key": "roleRequestEnabled",
                "type": "boolean",
                "description": "Whether role request handling is enabled for this notification context.",
                "example": true
            },
            {
                "key": "sourceInformation",
                "type": "array",
                "description": "Requested accounts grouped by source ID.",
                "example": [
                    {
                        "sourceId": "00000000000040008000000000000000",
                        "accounts": [
                            {
                                "accountUuid": "00000000-0000-4000-8000-000000000000",
                                "nativeIdentity": "CN=Ruby Requestee,OU=Users,DC=example,DC=com"
                            }
                        ]
                    }
                ]
            },
            {
                "key": "startDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the requested access is scheduled to start.",
                "example": "2026-09-15T08:00:00Z"
            },
            {
                "key": "type",
                "type": "string",
                "description": "Type of approval request",
                "example": "ACCESS_REQUEST_APPROVAL"
            }
        ]
    },
    "access_revoke_request_submitted_email_for_requested-for_identity": {
        "EMAIL": [
            {
                "key": "requestedForIdentityName",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example Name"
            },
            {
                "key": "requestedObjectDetailsByType",
                "type": "object",
                "description": "A list of details about each item requested to be revoked, in order of the object type.",
                "example": [
                    {
                        "name": "Example Name",
                        "removeDate": "2026-12-15T17:00:00Z"
                    }
                ]
            },
            {
                "key": "requestedObjectNamesByType",
                "type": "object",
                "description": "The names of each item requested to be revoked, in order of the object type.",
                "example": {}
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "The identity who submitted the access revoke request.",
                "example": "Example Name"
            }
        ]
    },
    "access_revoke_request_submitted_email_for_requester_identity": {
        "EMAIL": [
            {
                "key": "requestedForIdentityNames",
                "type": "array",
                "description": "The identity whose access was requested to be revoked.",
                "example": [
                    "Example Name"
                ]
            },
            {
                "key": "requestedObjectDetailsByType",
                "type": "object",
                "description": "A list of details about each item requested to be revoked, in order of the object type.",
                "example": [
                    {
                        "name": "Example Name",
                        "removeDate": "2026-12-15T17:00:00Z"
                    }
                ]
            },
            {
                "key": "requestedObjectNamesByType",
                "type": "object",
                "description": "The names of each item requested to be revoked, in order of the object type.",
                "example": {}
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "The identity who submitted the access revoke request.",
                "example": "Example Name"
            }
        ]
    },
    "access_sunset_date_reminder": {
        "EMAIL": [
            {
                "key": "accessItemName",
                "type": "string",
                "description": "The name of the access item that is expiring.",
                "example": "Example Name"
            },
            {
                "key": "accessItemType",
                "type": "string",
                "description": "The type of access item that is expiring.",
                "example": "Example"
            },
            {
                "key": "accessRequestMetadata",
                "type": "object",
                "description": "An object to store metadata for access request. Please refer to the template for the usage of this attribute. Currently, dimensionDetails is added in this attribute if the role type is Dimension.",
                "example": {
                    "dimensionDetails": "Example"
                }
            },
            {
                "key": "recipientName",
                "type": "string",
                "description": "The name of the user whose access is ending.",
                "example": "Example Name"
            },
            {
                "key": "scheduledSunsetDate",
                "type": "string",
                "description": "The date when the access item will expire.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "sourceInformation",
                "type": "array",
                "description": "A list of mapping for account source information in case of multi account request. Map contains the following keys: - sourceAccountName - sourceAccountId - sourceName Note: This should only be used in case of multiple accounts. Otherwise, this variable will not be populated.",
                "example": [
                    {
                        "sourceAccountName": "Example Name",
                        "sourceAccountId": "00000000-0000-4000-8000-000000000000",
                        "sourceName": "Example Name"
                    }
                ]
            }
        ]
    },
    "account_correlation_recommendation": {
        "EMAIL": [
            {
                "key": "recipientIds",
                "type": "array",
                "description": "List of identity IDs targeted to receive this notification. Provided by the source-onboarding event payload and used for recipient discovery and notification routing.",
                "example": [
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "recommendationStatus",
                "type": "string",
                "description": "Completion status of the recommendation generation, from the source-onboarding Kafka event that drives this notification.",
                "example": "COMPLETED"
            },
            {
                "key": "recommendationType",
                "type": "string",
                "description": "Type of recommendation that triggered this notification, from the source-onboarding Kafka event that drives this notification.",
                "example": "ACCOUNT_CORRELATION_CONFIGURATION"
            },
            {
                "key": "sourceId",
                "type": "string",
                "description": "Unique ID of the source for which account correlation recommendations were generated. Used in the body to build the deep link to the source's Account Correlation settings page.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "sourceName",
                "type": "string",
                "description": "Display name of the source for which account correlation recommendations were generated. Shown in the subject and body.",
                "example": "Workday HR"
            }
        ]
    },
    "account_correlation_statistics_recommendation": {
        "EMAIL": [
            {
                "key": "recipientIds",
                "type": "array",
                "description": "List of identity IDs targeted to receive this notification. Provided by the source-onboarding event payload and used for recipient discovery and notification routing.",
                "example": [
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "recommendationStatus",
                "type": "string",
                "description": "Completion status of the recommendation generation, from the source-onboarding Kafka event that drives this notification.",
                "example": "COMPLETED"
            },
            {
                "key": "recommendationType",
                "type": "string",
                "description": "Type of recommendation that triggered this notification, from the source-onboarding Kafka event that drives this notification.",
                "example": "ACCOUNT_CORRELATION_STATISTICS"
            },
            {
                "key": "sourceId",
                "type": "string",
                "description": "Unique ID of the source for which account correlation statistics were generated. Used in the body to build the deep link to the source's Account Correlation settings page.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "sourceName",
                "type": "string",
                "description": "Display name of the source for which the account correlation test/statistics were generated. Shown in the subject and body.",
                "example": "Workday HR"
            }
        ]
    },
    "account_request_failed": {
        "EMAIL": [
            {
                "key": "accountName",
                "type": "string",
                "description": "The name of the account.",
                "example": "Example Name"
            },
            {
                "key": "data",
                "type": "object",
                "description": "Data containing source name, subtype name(if account is of type machine), account name, operation type(create or delete) for given account request, failure reason and requester identity details. Note: Unique IDs of source and subtype will be populated only for create operation type.",
                "example": {
                    "sourceName": "AzureSource",
                    "sourceId": "00000000000040008000000000000000",
                    "subtypeName": "Service accounts",
                    "subtypeId": "00000000-0000-4000-8000-000000000000",
                    "accountName": "svc.prd.acc1",
                    "accountType": "machine",
                    "operationType": "create",
                    "requesterName": "John Doe",
                    "requester": {
                        "id": "00000000000040008000000000000000",
                        "name": "John Doe"
                    },
                    "failureReason": "Account already exist in the target system"
                }
            },
            {
                "key": "failureReason",
                "type": "string",
                "description": "The reason the account request failed.",
                "example": "Example"
            },
            {
                "key": "operationType",
                "type": "string",
                "description": "Indicates whether an account was created or deleted.",
                "example": "Example"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "The display name of the identity that submitted the request.",
                "example": "Example Name"
            },
            {
                "key": "sourceName",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example Name"
            }
        ]
    },
    "account_request_submitted": {
        "EMAIL": [
            {
                "key": "accountName",
                "type": "string",
                "description": "The name of the account.",
                "example": "Example Name"
            },
            {
                "key": "data",
                "type": "object",
                "description": "Data containing source name, subtype name(if account is of type machine), account name, operation type(create or delete) for given account request and requester identity details. Note: Unique IDs of source and subtype will be populated only for create operation type.",
                "example": {
                    "sourceName": "AzureSource",
                    "sourceId": "00000000000040008000000000000000",
                    "subtypeName": "Service accounts",
                    "subtypeId": "00000000-0000-4000-8000-000000000000",
                    "accountName": "Service accounts - AzureSource",
                    "accountType": "human",
                    "operationType": "delete",
                    "requesterName": "Colin Mi",
                    "requester": {
                        "id": "00000000000040008000000000000000",
                        "name": "John Doe"
                    }
                }
            },
            {
                "key": "operationType",
                "type": "string",
                "description": "Indicates whether an account was created or deleted.",
                "example": "Example"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "The display name of the identity that submitted the request.",
                "example": "Example Name"
            },
            {
                "key": "sourceName",
                "type": "string",
                "description": "The name of the source.",
                "example": "Example Name"
            }
        ]
    },
    "approval_commented_notification": {
        "EMAIL": [
            {
                "key": "IdentityIDs",
                "type": "string",
                "description": "An array of Identity ID strings correlating to each of the users that are being notified that the approval request has been commented on.",
                "example": "Example"
            },
            {
                "key": "approvalName",
                "type": "string",
                "description": "Display name of the approval request",
                "example": "Access Request for Sales Application"
            },
            {
                "key": "approverPath",
                "type": "string",
                "description": "URL path to the approver dashboard",
                "example": "approvals/requested-items"
            },
            {
                "key": "attributes",
                "type": "object",
                "description": "Comprehensive attributes map containing approval details, identities, comments, history, configuration, and other custom fields specific to particular approval request types",
                "example": {
                    "approvalID": "00000000-0000-4000-8000-000000000000",
                    "type": "ACCESS_REQUEST_APPROVAL",
                    "approvers": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "serialOrder": 1,
                            "email": "user@example.com"
                        },
                        {
                            "identityID": "00000000-0000-4000-8000-000000000000",
                            "type": "GOVERNANCE_GROUP",
                            "name": "Test Group 1",
                            "members": [
                                {
                                    "id": "00000000000040008000000000000000",
                                    "type": "IDENTITY",
                                    "name": "Denis Member",
                                    "email": "user@example.com"
                                }
                            ],
                            "serialOrder": 2
                        }
                    ],
                    "assignedTo": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver"
                        }
                    ],
                    "createdDate": "2047-08-30T18:16:29.053371Z",
                    "dueDate": "2047-09-21T12:30:0.0Z",
                    "description": "This access allows viewing and managing sales records",
                    "requester": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Rebecca Requester",
                        "email": "user@example.com"
                    },
                    "requestee": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Ruby Requestee",
                        "email": "user@example.com"
                    },
                    "comments": [
                        {
                            "commentId": "00000000-0000-4000-8000-000000000000",
                            "author": {
                                "identityID": "00000000000040008000000000000000",
                                "name": "Rebecca Requester"
                            },
                            "comment": "Lorem ipsum dolor sit amet.",
                            "createdDate": "2026-02-13T18:48:54.452979Z"
                        }
                    ],
                    "approvalCriteria": {
                        "type": "SERIAL",
                        "rejection": {
                            "calculationType": "COUNT",
                            "value": 1
                        },
                        "approval": {
                            "calculationType": "PERCENT",
                            "value": 100
                        }
                    },
                    "reassignmentHistory": [
                        {
                            "reassignmentType": "ESCALATION",
                            "reassignedFrom": {
                                "identityID": "00000000000040008000000000000000",
                                "type": "IDENTITY",
                                "name": "Will Approver"
                            },
                            "reassignedTo": {
                                "identityID": "00000000-0000-4000-8000-000000000000",
                                "type": "GOVERNANCE_GROUP",
                                "name": "Test Group 1"
                            },
                            "reassigner": {
                                "identityID": "System Automation",
                                "type": "IDENTITY"
                            },
                            "reassignmentDate": "2047-08-30T18:23:52.817415Z"
                        }
                    ],
                    "approvedBy": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "decisionDate": "2026-02-13T18:54:09.981077Z",
                            "email": "user@example.com"
                        }
                    ],
                    "completedDate": "2047-09-03T18:23:52.817415Z",
                    "status": "PENDING",
                    "approvalConfig": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "scope": "APPROVAL_REQUEST",
                        "reminderConfig": {
                            "enabled": true,
                            "daysUntilFirstReminder": 1,
                            "reminderCronSchedule": "0 8 * * *",
                            "maxReminders": 2
                        },
                        "escalationConfig": {
                            "enabled": true,
                            "daysUntilFirstEscalation": 0,
                            "escalationCronSchedule": "0 8 */4 * *"
                        },
                        "timeoutConfig": {
                            "enabled": true,
                            "daysUntilTimeout": 7,
                            "timeoutResult": "EXPIRED"
                        },
                        "requiresComment": "ALL",
                        "autoApprove": "OFF"
                    },
                    "requestedTarget": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "type": "ACCESS_PROFILE",
                        "name": "Sales Access"
                    },
                    "customField1": "custom value from AdditionalAttributes",
                    "staticField1": "static value from StaticAttributes"
                }
            },
            {
                "key": "comment",
                "type": "string",
                "description": "The comment that was added",
                "example": "Please expedite this request"
            },
            {
                "key": "commentAuthor",
                "type": "object",
                "description": "Identity who authored the comment",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "name": "Rebecca Requester"
                }
            },
            {
                "key": "requestee",
                "type": "object",
                "description": "Identity for whom the approval request was made",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Ruby Requestee",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requester",
                "type": "object",
                "description": "Identity who submitted the approval request",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Rebecca Requester",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requesterPath",
                "type": "string",
                "description": "URL path to the requester dashboard",
                "example": "requests/my-requests"
            },
            {
                "key": "type",
                "type": "string",
                "description": "Type of approval request",
                "example": "ACCESS_REQUEST_APPROVAL"
            }
        ]
    },
    "approval_completed_notification": {
        "EMAIL": [
            {
                "key": "RequesterID",
                "type": "string",
                "description": "The user who is being notified of the approval requests outcome.",
                "example": "00000000-0000-4000-8000-000000000000"
            },
            {
                "key": "approvalName",
                "type": "string",
                "description": "Display name of the approval request",
                "example": "Access Request for Sales Application"
            },
            {
                "key": "approvalStatus",
                "type": "string",
                "description": "Final status of the approval decision",
                "example": "APPROVED"
            },
            {
                "key": "approverPath",
                "type": "string",
                "description": "URL path to the approver dashboard",
                "example": "approvals/requested-items"
            },
            {
                "key": "attributes",
                "type": "object",
                "description": "Comprehensive attributes map containing approval details, identities, comments, history, configuration, and other custom fields specific to particular approval request types",
                "example": {
                    "approvalID": "00000000-0000-4000-8000-000000000000",
                    "type": "ACCESS_REQUEST_APPROVAL",
                    "approvers": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "serialOrder": 1,
                            "email": "user@example.com"
                        },
                        {
                            "identityID": "00000000-0000-4000-8000-000000000000",
                            "type": "GOVERNANCE_GROUP",
                            "name": "Test Group 1",
                            "members": [
                                {
                                    "id": "00000000000040008000000000000000",
                                    "type": "IDENTITY",
                                    "name": "Denis Member",
                                    "email": "user@example.com"
                                }
                            ],
                            "serialOrder": 2
                        }
                    ],
                    "assignedTo": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver"
                        }
                    ],
                    "createdDate": "2047-08-30T18:16:29.053371Z",
                    "dueDate": "2047-09-21T12:30:0.0Z",
                    "description": "This access allows viewing and managing sales records",
                    "requester": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Rebecca Requester",
                        "email": "user@example.com"
                    },
                    "requestee": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Ruby Requestee",
                        "email": "user@example.com"
                    },
                    "comments": [
                        {
                            "commentId": "00000000-0000-4000-8000-000000000000",
                            "author": {
                                "identityID": "00000000000040008000000000000000",
                                "name": "Rebecca Requester"
                            },
                            "comment": "Lorem ipsum dolor sit amet.",
                            "createdDate": "2026-02-13T18:48:54.452979Z"
                        }
                    ],
                    "approvalCriteria": {
                        "type": "SERIAL",
                        "rejection": {
                            "calculationType": "COUNT",
                            "value": 1
                        },
                        "approval": {
                            "calculationType": "PERCENT",
                            "value": 100
                        }
                    },
                    "reassignmentHistory": [
                        {
                            "reassignmentType": "ESCALATION",
                            "reassignedFrom": {
                                "identityID": "00000000000040008000000000000000",
                                "type": "IDENTITY",
                                "name": "Will Approver"
                            },
                            "reassignedTo": {
                                "identityID": "00000000-0000-4000-8000-000000000000",
                                "type": "GOVERNANCE_GROUP",
                                "name": "Test Group 1"
                            },
                            "reassigner": {
                                "identityID": "System Automation",
                                "type": "IDENTITY"
                            },
                            "reassignmentDate": "2047-08-30T18:23:52.817415Z"
                        }
                    ],
                    "approvedBy": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "decisionDate": "2026-02-13T18:54:09.981077Z",
                            "email": "user@example.com"
                        }
                    ],
                    "completedDate": "2047-09-03T18:23:52.817415Z",
                    "status": "APPROVED",
                    "approvalConfig": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "scope": "APPROVAL_REQUEST",
                        "reminderConfig": {
                            "enabled": true,
                            "daysUntilFirstReminder": 1,
                            "reminderCronSchedule": "0 8 * * *",
                            "maxReminders": 2
                        },
                        "escalationConfig": {
                            "enabled": true,
                            "daysUntilFirstEscalation": 0,
                            "escalationCronSchedule": "0 8 */4 * *"
                        },
                        "timeoutConfig": {
                            "enabled": true,
                            "daysUntilTimeout": 7,
                            "timeoutResult": "EXPIRED"
                        },
                        "requiresComment": "ALL",
                        "autoApprove": "OFF"
                    },
                    "requestedTarget": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "type": "ACCESS_PROFILE",
                        "name": "Sales Access"
                    },
                    "customField1": "custom value from AdditionalAttributes",
                    "staticField1": "static value from StaticAttributes"
                }
            },
            {
                "key": "latestComment",
                "type": "string",
                "description": "Most recent comment on the approval",
                "example": "Approved with conditions"
            },
            {
                "key": "latestCommentAuthor",
                "type": "object",
                "description": "Author of the most recent comment",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "name": "Will Approver"
                }
            },
            {
                "key": "requestee",
                "type": "object",
                "description": "Identity for whom the approval request was made",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Ruby Requestee",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requester",
                "type": "object",
                "description": "Identity who submitted the approval request",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Rebecca Requester",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requesterPath",
                "type": "string",
                "description": "URL path to the requester dashboard",
                "example": "requests/my-requests"
            },
            {
                "key": "type",
                "type": "string",
                "description": "Type of approval request",
                "example": "ACCESS_REQUEST_APPROVAL"
            }
        ]
    },
    "approval_request_escalation_approver": {
        "EMAIL": [
            {
                "key": "RecipientIDs",
                "type": "array",
                "description": "An array of Identity ID strings correlating to each of the users that are being notified on this approval request escalation.",
                "example": [
                    "Example"
                ]
            },
            {
                "key": "approvalName",
                "type": "string",
                "description": "Display name of the approval request",
                "example": "Access Request for Sales Application"
            },
            {
                "key": "approverPath",
                "type": "string",
                "description": "URL path to the approver dashboard",
                "example": "approvals/requested-items"
            },
            {
                "key": "attributes",
                "type": "object",
                "description": "Comprehensive attributes map containing approval details, identities, comments, history, configuration, and other custom fields specific to particular approval request types",
                "example": {
                    "approvalID": "00000000-0000-4000-8000-000000000000",
                    "type": "ACCESS_REQUEST_APPROVAL",
                    "approvers": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "serialOrder": 1,
                            "email": "user@example.com"
                        },
                        {
                            "identityID": "00000000-0000-4000-8000-000000000000",
                            "type": "GOVERNANCE_GROUP",
                            "name": "Test Group 1",
                            "members": [
                                {
                                    "id": "00000000000040008000000000000000",
                                    "type": "IDENTITY",
                                    "name": "Denis Member",
                                    "email": "user@example.com"
                                }
                            ],
                            "serialOrder": 2
                        }
                    ],
                    "assignedTo": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver"
                        }
                    ],
                    "createdDate": "2047-08-30T18:16:29.053371Z",
                    "dueDate": "2047-09-21T12:30:0.0Z",
                    "description": "This access allows viewing and managing sales records",
                    "requester": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Rebecca Requester",
                        "email": "user@example.com"
                    },
                    "requestee": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Ruby Requestee",
                        "email": "user@example.com"
                    },
                    "comments": [
                        {
                            "commentId": "00000000-0000-4000-8000-000000000000",
                            "author": {
                                "identityID": "00000000000040008000000000000000",
                                "name": "Rebecca Requester"
                            },
                            "comment": "Lorem ipsum dolor sit amet.",
                            "createdDate": "2026-02-13T18:48:54.452979Z"
                        }
                    ],
                    "approvalCriteria": {
                        "type": "SERIAL",
                        "rejection": {
                            "calculationType": "COUNT",
                            "value": 1
                        },
                        "approval": {
                            "calculationType": "PERCENT",
                            "value": 100
                        }
                    },
                    "reassignmentHistory": [
                        {
                            "reassignmentType": "ESCALATION",
                            "reassignedFrom": {
                                "identityID": "00000000000040008000000000000000",
                                "type": "IDENTITY",
                                "name": "Will Approver"
                            },
                            "reassignedTo": {
                                "identityID": "00000000-0000-4000-8000-000000000000",
                                "type": "GOVERNANCE_GROUP",
                                "name": "Test Group 1"
                            },
                            "reassigner": {
                                "identityID": "System Automation",
                                "type": "IDENTITY"
                            },
                            "reassignmentDate": "2047-08-30T18:23:52.817415Z"
                        }
                    ],
                    "approvedBy": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "decisionDate": "2026-02-13T18:54:09.981077Z",
                            "email": "user@example.com"
                        }
                    ],
                    "completedDate": "2047-09-03T18:23:52.817415Z",
                    "status": "PENDING",
                    "approvalConfig": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "scope": "APPROVAL_REQUEST",
                        "reminderConfig": {
                            "enabled": true,
                            "daysUntilFirstReminder": 1,
                            "reminderCronSchedule": "0 8 * * *",
                            "maxReminders": 2
                        },
                        "escalationConfig": {
                            "enabled": true,
                            "daysUntilFirstEscalation": 0,
                            "escalationCronSchedule": "0 8 */4 * *"
                        },
                        "timeoutConfig": {
                            "enabled": true,
                            "daysUntilTimeout": 7,
                            "timeoutResult": "EXPIRED"
                        },
                        "requiresComment": "ALL",
                        "autoApprove": "OFF"
                    },
                    "requestedTarget": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "type": "ACCESS_PROFILE",
                        "name": "Sales Access"
                    },
                    "customField1": "custom value from AdditionalAttributes",
                    "staticField1": "static value from StaticAttributes"
                }
            },
            {
                "key": "createdDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the approval request was created",
                "example": "2047-08-30T18:16:29.053371Z"
            },
            {
                "key": "escalatedApprover",
                "type": "object",
                "description": "Approver to whom this request was escalated",
                "example": {
                    "identityID": "00000000-0000-4000-8000-000000000000",
                    "type": "GOVERNANCE_GROUP",
                    "name": "Test Group 1"
                }
            },
            {
                "key": "escalationDelay",
                "type": "string",
                "description": "Human-readable duration that passed before escalation",
                "example": "4 days, 6 hours, 30 minutes"
            },
            {
                "key": "previousApprover",
                "type": "object",
                "description": "Approver from whom this request was escalated",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Will Approver",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requestee",
                "type": "object",
                "description": "Identity for whom the approval request was made",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Ruby Requestee",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requester",
                "type": "object",
                "description": "Identity who submitted the approval request",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Rebecca Requester",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requesterPath",
                "type": "string",
                "description": "URL path to the requester dashboard",
                "example": "requests/my-requests"
            },
            {
                "key": "type",
                "type": "string",
                "description": "Type of approval request",
                "example": "ACCESS_REQUEST_APPROVAL"
            }
        ]
    },
    "approval_request_escalation_requester": {
        "EMAIL": [
            {
                "key": "RecipientIDs",
                "type": "array",
                "description": "An array of Identity ID strings correlating to each of the users that are being notified on this approval request escalation.",
                "example": [
                    "Example"
                ]
            },
            {
                "key": "approvalName",
                "type": "string",
                "description": "Display name of the approval request",
                "example": "Access Request for Sales Application"
            },
            {
                "key": "approverPath",
                "type": "string",
                "description": "URL path to the approver dashboard",
                "example": "approvals/requested-items"
            },
            {
                "key": "attributes",
                "type": "object",
                "description": "Comprehensive attributes map containing approval details, identities, comments, history, configuration, and other custom fields specific to particular approval request types",
                "example": {
                    "approvalID": "00000000-0000-4000-8000-000000000000",
                    "type": "ACCESS_REQUEST_APPROVAL",
                    "approvers": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "serialOrder": 1,
                            "email": "user@example.com"
                        },
                        {
                            "identityID": "00000000-0000-4000-8000-000000000000",
                            "type": "GOVERNANCE_GROUP",
                            "name": "Test Group 1",
                            "members": [
                                {
                                    "id": "00000000000040008000000000000000",
                                    "type": "IDENTITY",
                                    "name": "Denis Member",
                                    "email": "user@example.com"
                                }
                            ],
                            "serialOrder": 2
                        }
                    ],
                    "assignedTo": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver"
                        }
                    ],
                    "createdDate": "2047-08-30T18:16:29.053371Z",
                    "dueDate": "2047-09-21T12:30:0.0Z",
                    "description": "This access allows viewing and managing sales records",
                    "requester": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Rebecca Requester",
                        "email": "user@example.com"
                    },
                    "requestee": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Ruby Requestee",
                        "email": "user@example.com"
                    },
                    "comments": [
                        {
                            "commentId": "00000000-0000-4000-8000-000000000000",
                            "author": {
                                "identityID": "00000000000040008000000000000000",
                                "name": "Rebecca Requester"
                            },
                            "comment": "Lorem ipsum dolor sit amet.",
                            "createdDate": "2026-02-13T18:48:54.452979Z"
                        }
                    ],
                    "approvalCriteria": {
                        "type": "SERIAL",
                        "rejection": {
                            "calculationType": "COUNT",
                            "value": 1
                        },
                        "approval": {
                            "calculationType": "PERCENT",
                            "value": 100
                        }
                    },
                    "reassignmentHistory": [
                        {
                            "reassignmentType": "ESCALATION",
                            "reassignedFrom": {
                                "identityID": "00000000000040008000000000000000",
                                "type": "IDENTITY",
                                "name": "Will Approver"
                            },
                            "reassignedTo": {
                                "identityID": "00000000-0000-4000-8000-000000000000",
                                "type": "GOVERNANCE_GROUP",
                                "name": "Test Group 1"
                            },
                            "reassigner": {
                                "identityID": "System Automation",
                                "type": "IDENTITY"
                            },
                            "reassignmentDate": "2047-08-30T18:23:52.817415Z"
                        }
                    ],
                    "approvedBy": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "decisionDate": "2026-02-13T18:54:09.981077Z",
                            "email": "user@example.com"
                        }
                    ],
                    "completedDate": "2047-09-03T18:23:52.817415Z",
                    "status": "PENDING",
                    "approvalConfig": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "scope": "APPROVAL_REQUEST",
                        "reminderConfig": {
                            "enabled": true,
                            "daysUntilFirstReminder": 1,
                            "reminderCronSchedule": "0 8 * * *",
                            "maxReminders": 2
                        },
                        "escalationConfig": {
                            "enabled": true,
                            "daysUntilFirstEscalation": 0,
                            "escalationCronSchedule": "0 8 */4 * *"
                        },
                        "timeoutConfig": {
                            "enabled": true,
                            "daysUntilTimeout": 7,
                            "timeoutResult": "EXPIRED"
                        },
                        "requiresComment": "ALL",
                        "autoApprove": "OFF"
                    },
                    "requestedTarget": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "type": "ACCESS_PROFILE",
                        "name": "Sales Access"
                    },
                    "customField1": "custom value from AdditionalAttributes",
                    "staticField1": "static value from StaticAttributes"
                }
            },
            {
                "key": "createdDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the approval request was created",
                "example": "2047-08-30T18:16:29.053371Z"
            },
            {
                "key": "escalatedApprover",
                "type": "object",
                "description": "Approver to whom this request was escalated",
                "example": {
                    "identityID": "00000000-0000-4000-8000-000000000000",
                    "type": "GOVERNANCE_GROUP",
                    "name": "Test Group 1"
                }
            },
            {
                "key": "escalationDelay",
                "type": "string",
                "description": "Human-readable duration that passed before escalation",
                "example": "4 days, 6 hours, 30 minutes"
            },
            {
                "key": "previousApprover",
                "type": "object",
                "description": "Approver from whom this request was escalated",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Will Approver",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requestee",
                "type": "object",
                "description": "Identity for whom the approval request was made",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Ruby Requestee",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requester",
                "type": "object",
                "description": "Identity who submitted the approval request",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Rebecca Requester",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requesterPath",
                "type": "string",
                "description": "URL path to the requester dashboard",
                "example": "requests/my-requests"
            },
            {
                "key": "type",
                "type": "string",
                "description": "Type of approval request",
                "example": "ACCESS_REQUEST_APPROVAL"
            }
        ]
    },
    "approval_request_notification": {
        "EMAIL": [
            {
                "key": "ApproverIDs",
                "type": "array",
                "description": "An array of Identity ID strings correlating to each of the users that are being notified on this approval request.",
                "example": [
                    "Example"
                ]
            },
            {
                "key": "approvalName",
                "type": "string",
                "description": "Display name of the approval request",
                "example": "Request for Access to Sales Application"
            },
            {
                "key": "approverPath",
                "type": "string",
                "description": "URL path to the approver dashboard",
                "example": "approvals/requested-items"
            },
            {
                "key": "attributes",
                "type": "object",
                "description": "Comprehensive attributes map containing approval details, identities, comments, history, configuration, and other custom fields specific to particular approval request types",
                "example": {
                    "approvalID": "00000000-0000-4000-8000-000000000000",
                    "type": "ACCESS_REQUEST_APPROVAL",
                    "approvers": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "serialOrder": 1,
                            "email": "user@example.com"
                        },
                        {
                            "identityID": "00000000-0000-4000-8000-000000000000",
                            "type": "GOVERNANCE_GROUP",
                            "name": "Test Group 1",
                            "members": [
                                {
                                    "id": "00000000000040008000000000000000",
                                    "type": "IDENTITY",
                                    "name": "Barry Member",
                                    "email": "user@example.com"
                                }
                            ],
                            "serialOrder": 2
                        }
                    ],
                    "assignedTo": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "email": "user@example.com"
                        }
                    ],
                    "createdDate": "2047-08-30T18:16:29.053371Z",
                    "dueDate": "2047-09-21T12:30:0.0Z",
                    "description": "This access allows viewing and managing sales records",
                    "requester": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Rebecca Requester",
                        "email": "user@example.com"
                    },
                    "requestee": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Ruby Requestee",
                        "email": "user@example.com"
                    },
                    "comments": [
                        {
                            "commentId": "00000000-0000-4000-8000-000000000000",
                            "author": {
                                "identityID": "00000000000040008000000000000000",
                                "name": "Rebecca Requester"
                            },
                            "comment": "Lorem ipsum dolor sit amet.",
                            "createdDate": "2026-02-13T18:48:54.452979Z"
                        }
                    ],
                    "approvalCriteria": {
                        "type": "SERIAL",
                        "rejection": {
                            "calculationType": "COUNT",
                            "value": 1
                        },
                        "approval": {
                            "calculationType": "PERCENT",
                            "value": 100
                        }
                    },
                    "reassignmentHistory": [
                        {
                            "reassignmentType": "ESCALATION",
                            "reassignedFrom": {
                                "identityID": "00000000000040008000000000000000",
                                "type": "IDENTITY",
                                "name": "Will Approver"
                            },
                            "reassignedTo": {
                                "identityID": "00000000-0000-4000-8000-000000000000",
                                "type": "GOVERNANCE_GROUP",
                                "name": "Test Group 1"
                            },
                            "reassigner": {
                                "identityID": "System Automation",
                                "type": "IDENTITY"
                            },
                            "reassignmentDate": "2047-08-30T18:23:52.817415Z"
                        }
                    ],
                    "approvedBy": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "decisionDate": "2026-02-13T18:54:09.981077Z",
                            "email": "user@example.com"
                        }
                    ],
                    "completedDate": "",
                    "status": "PENDING",
                    "approvalConfig": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "scope": "APPROVAL_REQUEST",
                        "reminderConfig": {
                            "enabled": true,
                            "daysUntilFirstReminder": 2,
                            "reminderCronSchedule": "0 8 * * *",
                            "maxReminders": 2
                        },
                        "escalationConfig": {
                            "enabled": true,
                            "daysUntilFirstEscalation": 4,
                            "escalationCronSchedule": "0 8 */4 * *"
                        },
                        "timeoutConfig": {
                            "enabled": true,
                            "daysUntilTimeout": 7,
                            "timeoutResult": "EXPIRED"
                        },
                        "requiresComment": "ALL",
                        "autoApprove": "OFF"
                    },
                    "requestedTarget": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "type": "ACCESS_PROFILE",
                        "name": "Sales Access"
                    },
                    "customField1": "custom value from AdditionalAttributes",
                    "staticField1": "static value from StaticAttributes"
                }
            },
            {
                "key": "batchSize",
                "type": "number",
                "description": "Number of batched requests relating to this approval request",
                "example": 1
            },
            {
                "key": "dueDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the approval is due for completion",
                "example": "2047-09-21T12:30:0.0Z"
            },
            {
                "key": "latestComment",
                "type": "string",
                "description": "Most recent comment on the approval",
                "example": "Lorem ipsum dolor sit amet."
            },
            {
                "key": "latestCommentAuthor",
                "type": "object",
                "description": "Author of the most recent comment",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "name": "Rebecca Requester"
                }
            },
            {
                "key": "previousApprover",
                "type": "object",
                "description": "Previous approver (when approval request is reassigned)",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Will Approver"
                }
            },
            {
                "key": "requestee",
                "type": "object",
                "description": "Identity for whom the approval request was made",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Ruby Requestee",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requester",
                "type": "object",
                "description": "Identity who submitted the approval request",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Rebecca Requester",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requesterComment",
                "type": "string",
                "description": "Comment from the requester upon submission of the approval request",
                "example": "Please review this access request"
            },
            {
                "key": "type",
                "type": "string",
                "description": "Type of approval request",
                "example": "ACCESS_REQUEST_APPROVAL"
            }
        ]
    },
    "approval_request_reminder": {
        "EMAIL": [
            {
                "key": "RecipientIDs",
                "type": "array",
                "description": "An array of Identity ID strings correlating to each of the users that are being notified on this approval request reminder.",
                "example": [
                    "Example"
                ]
            },
            {
                "key": "approvalName",
                "type": "string",
                "description": "Display name of the approval request",
                "example": "Access Request for Sales Application"
            },
            {
                "key": "approverPath",
                "type": "string",
                "description": "URL path to the approver dashboard",
                "example": "approvals/requested-items"
            },
            {
                "key": "attributes",
                "type": "object",
                "description": "Comprehensive attributes map containing approval details, identities, comments, history, configuration, and other custom fields specific to particular approval request types",
                "example": {
                    "approvalID": "00000000-0000-4000-8000-000000000000",
                    "type": "ACCESS_REQUEST_APPROVAL",
                    "approvers": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "serialOrder": 1,
                            "email": "user@example.com"
                        },
                        {
                            "identityID": "00000000-0000-4000-8000-000000000000",
                            "type": "GOVERNANCE_GROUP",
                            "name": "Test Group 1",
                            "members": [
                                {
                                    "id": "00000000000040008000000000000000",
                                    "type": "IDENTITY",
                                    "name": "Denis Member",
                                    "email": "user@example.com"
                                }
                            ],
                            "serialOrder": 2
                        }
                    ],
                    "assignedTo": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver"
                        }
                    ],
                    "createdDate": "2047-08-30T18:16:29.053371Z",
                    "dueDate": "2047-09-21T12:30:0.0Z",
                    "description": "This access allows viewing and managing sales records",
                    "requester": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Rebecca Requester",
                        "email": "user@example.com"
                    },
                    "requestee": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Ruby Requestee",
                        "email": "user@example.com"
                    },
                    "comments": [
                        {
                            "commentId": "00000000-0000-4000-8000-000000000000",
                            "author": {
                                "identityID": "00000000000040008000000000000000",
                                "name": "Rebecca Requester"
                            },
                            "comment": "Lorem ipsum dolor sit amet.",
                            "createdDate": "2026-02-13T18:48:54.452979Z"
                        }
                    ],
                    "approvalCriteria": {
                        "type": "SERIAL",
                        "rejection": {
                            "calculationType": "COUNT",
                            "value": 1
                        },
                        "approval": {
                            "calculationType": "PERCENT",
                            "value": 100
                        }
                    },
                    "reassignmentHistory": [
                        {
                            "reassignmentType": "ESCALATION",
                            "reassignedFrom": {
                                "identityID": "00000000000040008000000000000000",
                                "type": "IDENTITY",
                                "name": "Will Approver"
                            },
                            "reassignedTo": {
                                "identityID": "00000000-0000-4000-8000-000000000000",
                                "type": "GOVERNANCE_GROUP",
                                "name": "Test Group 1"
                            },
                            "reassigner": {
                                "identityID": "System Automation",
                                "type": "IDENTITY"
                            },
                            "reassignmentDate": "2047-08-30T18:23:52.817415Z"
                        }
                    ],
                    "approvedBy": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "decisionDate": "2026-02-13T18:54:09.981077Z",
                            "email": "user@example.com"
                        }
                    ],
                    "completedDate": "2047-09-03T18:23:52.817415Z",
                    "status": "PENDING",
                    "approvalConfig": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "scope": "APPROVAL_REQUEST",
                        "reminderConfig": {
                            "enabled": true,
                            "daysUntilFirstReminder": 1,
                            "reminderCronSchedule": "0 8 * * *",
                            "maxReminders": 2
                        },
                        "escalationConfig": {
                            "enabled": true,
                            "daysUntilFirstEscalation": 0,
                            "escalationCronSchedule": "0 8 */4 * *"
                        },
                        "timeoutConfig": {
                            "enabled": true,
                            "daysUntilTimeout": 7,
                            "timeoutResult": "EXPIRED"
                        },
                        "requiresComment": "ALL",
                        "autoApprove": "OFF"
                    },
                    "requestedTarget": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "type": "ACCESS_PROFILE",
                        "name": "Sales Access"
                    },
                    "customField1": "custom value from AdditionalAttributes",
                    "staticField1": "static value from StaticAttributes"
                }
            },
            {
                "key": "createdDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the approval request was created",
                "example": "2047-08-30T18:16:29.053371Z"
            },
            {
                "key": "reminderCount",
                "type": "number",
                "description": "Number of reminders sent for this approval",
                "example": 2
            },
            {
                "key": "requestee",
                "type": "object",
                "description": "Identity for whom the approval request was made",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Ruby Requestee",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requester",
                "type": "object",
                "description": "Identity who submitted the approval request",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Rebecca Requester",
                    "email": "user@example.com"
                }
            },
            {
                "key": "type",
                "type": "string",
                "description": "Type of approval request",
                "example": "ACCESS_REQUEST_APPROVAL"
            }
        ]
    },
    "approval_request_timeout": {
        "EMAIL": [
            {
                "key": "RecipientIDs",
                "type": "array",
                "description": "An array of Identity ID strings correlating to each of the users that are being notified on this approval request timeout.",
                "example": [
                    "Example"
                ]
            },
            {
                "key": "approvalName",
                "type": "string",
                "description": "Display name of the approval request",
                "example": "Access Request for Sales Application"
            },
            {
                "key": "approverPath",
                "type": "string",
                "description": "URL path to the approver dashboard",
                "example": "approvals/requested-items"
            },
            {
                "key": "attributes",
                "type": "object",
                "description": "Comprehensive attributes map containing approval details, identities, comments, history, configuration, and other custom fields specific to particular approval request types",
                "example": {
                    "approvalID": "00000000-0000-4000-8000-000000000000",
                    "type": "ACCESS_REQUEST_APPROVAL",
                    "approvers": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "serialOrder": 1,
                            "email": "user@example.com"
                        },
                        {
                            "identityID": "00000000-0000-4000-8000-000000000000",
                            "type": "GOVERNANCE_GROUP",
                            "name": "Test Group 1",
                            "members": [
                                {
                                    "id": "00000000000040008000000000000000",
                                    "type": "IDENTITY",
                                    "name": "Denis Member",
                                    "email": "user@example.com"
                                }
                            ],
                            "serialOrder": 2
                        }
                    ],
                    "assignedTo": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver"
                        }
                    ],
                    "createdDate": "2047-08-30T18:16:29.053371Z",
                    "dueDate": "2047-09-21T12:30:0.0Z",
                    "description": "This access allows viewing and managing sales records",
                    "requester": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Rebecca Requester",
                        "email": "user@example.com"
                    },
                    "requestee": {
                        "identityID": "00000000000040008000000000000000",
                        "type": "IDENTITY",
                        "name": "Ruby Requestee",
                        "email": "user@example.com"
                    },
                    "comments": [
                        {
                            "commentId": "00000000-0000-4000-8000-000000000000",
                            "author": {
                                "identityID": "00000000000040008000000000000000",
                                "name": "Rebecca Requester"
                            },
                            "comment": "Lorem ipsum dolor sit amet.",
                            "createdDate": "2026-02-13T18:48:54.452979Z"
                        }
                    ],
                    "approvalCriteria": {
                        "type": "SERIAL",
                        "rejection": {
                            "calculationType": "COUNT",
                            "value": 1
                        },
                        "approval": {
                            "calculationType": "PERCENT",
                            "value": 100
                        }
                    },
                    "reassignmentHistory": [
                        {
                            "reassignmentType": "ESCALATION",
                            "reassignedFrom": {
                                "identityID": "00000000000040008000000000000000",
                                "type": "IDENTITY",
                                "name": "Will Approver"
                            },
                            "reassignedTo": {
                                "identityID": "00000000-0000-4000-8000-000000000000",
                                "type": "GOVERNANCE_GROUP",
                                "name": "Test Group 1"
                            },
                            "reassigner": {
                                "identityID": "System Automation",
                                "type": "IDENTITY"
                            },
                            "reassignmentDate": "2047-08-30T18:23:52.817415Z"
                        }
                    ],
                    "approvedBy": [
                        {
                            "identityID": "00000000000040008000000000000000",
                            "type": "IDENTITY",
                            "name": "Will Approver",
                            "decisionDate": "2026-02-13T18:54:09.981077Z",
                            "email": "user@example.com"
                        }
                    ],
                    "completedDate": "2047-09-03T18:23:52.817415Z",
                    "status": "EXPIRED",
                    "approvalConfig": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "scope": "APPROVAL_REQUEST",
                        "reminderConfig": {
                            "enabled": true,
                            "daysUntilFirstReminder": 1,
                            "reminderCronSchedule": "0 8 * * *",
                            "maxReminders": 2
                        },
                        "escalationConfig": {
                            "enabled": true,
                            "daysUntilFirstEscalation": 0,
                            "escalationCronSchedule": "0 8 */4 * *"
                        },
                        "timeoutConfig": {
                            "enabled": true,
                            "daysUntilTimeout": 7,
                            "timeoutResult": "EXPIRED"
                        },
                        "requiresComment": "ALL",
                        "autoApprove": "OFF"
                    },
                    "requestedTarget": {
                        "id": "00000000-0000-4000-8000-000000000000",
                        "type": "ACCESS_PROFILE",
                        "name": "Sales Access"
                    },
                    "customField1": "custom value from AdditionalAttributes",
                    "staticField1": "static value from StaticAttributes"
                }
            },
            {
                "key": "createdDate",
                "type": "string",
                "description": "ISO 8601 timestamp when the approval request was created",
                "example": "2047-08-30T18:16:29.053371Z"
            },
            {
                "key": "requestee",
                "type": "object",
                "description": "Identity for whom the approval request was made",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Ruby Requestee",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requester",
                "type": "object",
                "description": "Identity who submitted the approval request",
                "example": {
                    "identityID": "00000000000040008000000000000000",
                    "type": "IDENTITY",
                    "name": "Rebecca Requester",
                    "email": "user@example.com"
                }
            },
            {
                "key": "requesterPath",
                "type": "string",
                "description": "URL path to the requester dashboard",
                "example": "requests/my-requests"
            },
            {
                "key": "timeoutDays",
                "type": "string",
                "description": "Number of days after which the approval timed out",
                "example": "7"
            },
            {
                "key": "type",
                "type": "string",
                "description": "Type of approval request",
                "example": "ACCESS_REQUEST_APPROVAL"
            }
        ]
    },
    "bulk_reassignment": {
        "EMAIL": [
            {
                "key": "certification",
                "type": "object",
                "description": "The certification that the notification is referring to.",
                "example": {
                    "expiration": "2026-12-15T17:00:00Z",
                    "id": "00000000-0000-4000-8000-000000000000"
                }
            },
            {
                "key": "description",
                "type": "string",
                "description": "The reason for reassignment.",
                "example": "Example"
            },
            {
                "key": "numNewIdentities",
                "type": "string",
                "description": "The number of identities reassigned to a new reviewer.",
                "example": "Example"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "The user who requested the reassignment.",
                "example": "Example Name"
            }
        ]
    },
    "campaign_template_pregen_notification": {
        "EMAIL": [
            {
                "key": "campaignTemplateName",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example Name"
            },
            {
                "key": "generationDate",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "2026-12-15T17:00:00Z"
            }
        ]
    },
    "certification": {
        "EMAIL": [
            {
                "key": "certification",
                "type": "object",
                "description": "The certification that the notification is referring to.",
                "example": {
                    "certificationGroups": [
                        {
                            "name": "Example Name"
                        }
                    ],
                    "expiration": "2026-12-15T17:00:00Z",
                    "id": "00000000-0000-4000-8000-000000000000"
                }
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "The display name of the identity that requested the certification.",
                "example": "Example Name"
            },
            {
                "key": "workItem",
                "type": "object",
                "description": "The item requiring attention, usually the certification.",
                "example": {}
            },
            {
                "key": "workItemName",
                "type": "string",
                "description": "The name of the certification work item assigned to the recipient of the email.",
                "example": "Example Name"
            }
        ]
    },
    "certification_due": {
        "EMAIL": [
            {
                "key": "certification",
                "type": "object",
                "description": "Certification that the notification is referring to.",
                "example": {
                    "certificationGroups": [
                        {
                            "name": "Example Name"
                        }
                    ],
                    "expiration": "2026-12-15T17:00:00Z",
                    "id": "00000000-0000-4000-8000-000000000000"
                }
            },
            {
                "key": "certificationName",
                "type": "object",
                "description": "The name of the certification.",
                "example": {}
            },
            {
                "key": "created",
                "type": "string",
                "description": "The date the certification was created.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "expiration",
                "type": "string",
                "description": "The date the certification is set to expire.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "newDueDate",
                "type": "string",
                "description": "The date the next reminder is due to be sent.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "oldDueDate",
                "type": "string",
                "description": "The date this reminder was sent.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "ordinalNumReminders",
                "type": "string",
                "description": "The number of this reminder, starting from 1.",
                "example": "Example"
            },
            {
                "key": "ownerName",
                "type": "string",
                "description": "The name of the identity that owns the certification.",
                "example": "Example Name"
            },
            {
                "key": "remindersRemaining",
                "type": "string",
                "description": "The number of reminders remaining after this one.",
                "example": "Example"
            },
            {
                "key": "requester",
                "type": "object",
                "description": "The identity that created the certification.",
                "example": {}
            },
            {
                "key": "workItem",
                "type": "object",
                "description": "The name of the certification work item assigned to the recipient of the email.",
                "example": {}
            },
            {
                "key": "workItemName",
                "type": "string",
                "description": "The name of the work item assigned to the recipient, usually the certification.",
                "example": "Example Name"
            }
        ]
    },
    "certification_end_date_modified_notification": {
        "EMAIL": [
            {
                "key": "accessItemName",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example Name"
            },
            {
                "key": "accessItemType",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example"
            },
            {
                "key": "scheduledSunsetDate",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "2026-12-15T17:00:00Z"
            }
        ]
    },
    "cloud_lifecycle_state_change": {
        "EMAIL": [
            {
                "key": "identity",
                "type": "object",
                "description": "This variable contains the attributes of the identity whose lifecycle state has changed.",
                "example": {}
            },
            {
                "key": "identityName",
                "type": "string",
                "description": "The name of the identity.",
                "example": "Example Name"
            },
            {
                "key": "newState",
                "type": "string",
                "description": "The identity's new lifecycle state.",
                "example": "Example"
            },
            {
                "key": "oldState",
                "type": "string",
                "description": "The identity's old lifecycle state.",
                "example": "Example"
            }
        ]
    },
    "cloud_manual_work_item_summary": {
        "EMAIL": [
            {
                "key": "numberOfPendingTasks",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example"
            }
        ]
    },
    "cloud_system_notification_apps": {
        "EMAIL": [
            {
                "key": "healthy",
                "type": "boolean",
                "description": "The Healthy or Unhealthy status of the app.",
                "example": true
            },
            {
                "key": "name",
                "type": "string",
                "description": "The name of the application that changed status.",
                "example": "Example Name"
            },
            {
                "key": "since",
                "type": "string",
                "description": "The time since the application changed status.",
                "example": "2026-12-15T17:00:00Z"
            }
        ]
    },
    "cloud_system_notification_identities": {
        "EMAIL": [
            {
                "key": "errorPercentage",
                "type": "number",
                "description": "The percentage of identities in an Error state.",
                "example": 1
            },
            {
                "key": "timestamp",
                "type": "string",
                "description": "The time when the last identity processing occurred.",
                "example": "2026-12-15T17:00:00Z"
            }
        ]
    },
    "cloud_system_notification_sources": {
        "EMAIL": [
            {
                "key": "backToNormalSources",
                "type": "array",
                "description": "The list of sources that have moved to a Healthy state.",
                "example": [
                    {
                        "name": "Example Name",
                        "since": "Example"
                    }
                ]
            },
            {
                "key": "total",
                "type": "number",
                "description": "The total number of sources that have changed status.",
                "example": 1
            },
            {
                "key": "unhealthySources",
                "type": "array",
                "description": "The list of sources that are in an Unhealthy state.",
                "example": [
                    {
                        "name": "Example Name",
                        "since": "Example"
                    }
                ]
            }
        ]
    },
    "cloud_system_notification_vas": {
        "EMAIL": [
            {
                "key": "clustersWithBackToNormalVAs",
                "type": "array",
                "description": "The list of virtual appliance clusters that have virtual appliances in them that have returned to a healthy state.",
                "example": [
                    {
                        "name": "Example Name",
                        "totalClients": "Example",
                        "clients": "Example"
                    }
                ]
            },
            {
                "key": "clustersWithUnHealthyVAs",
                "type": "array",
                "description": "The list of virtual appliance clusters that have unhealthy virtual appliances in them.",
                "example": [
                    {
                        "name": "Example Name",
                        "totalClients": "Example",
                        "clients": "Example"
                    }
                ]
            },
            {
                "key": "total",
                "type": "number",
                "description": "The total number of virtual appliances that have changed status.",
                "example": 1
            }
        ]
    },
    "cloud_user_app_password_changed": {
        "EMAIL": [
            {
                "key": "appCount",
                "type": "number",
                "description": "Number of applications where the password was changed.",
                "example": 1
            },
            {
                "key": "appFailedCount",
                "type": "number",
                "description": "Number of applications where the password change request failed.",
                "example": 1
            },
            {
                "key": "appFailedList",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example"
            },
            {
                "key": "appList",
                "type": "string",
                "description": "List of access applications where password changes were attempted.",
                "example": "Example"
            },
            {
                "key": "appNotAttemptedCount",
                "type": "number",
                "description": "The number of applications the password change was not attempted on due to failure.",
                "example": 1
            },
            {
                "key": "appNotAttemptedList",
                "type": "string",
                "description": "List of access applications the password change was not attempted on due to failure.",
                "example": "Example"
            },
            {
                "key": "sourceCount",
                "type": "number",
                "description": "Count of sources.",
                "example": 1
            },
            {
                "key": "sourceFailedCount",
                "type": "number",
                "description": "Count of sources where the application password change request failed.",
                "example": 1
            },
            {
                "key": "sourceNotAttemptedCount",
                "type": "number",
                "description": "Count of sources the password change was not attempted on due to failure.",
                "example": 1
            }
        ]
    },
    "cloud_user_authentication_setting_change": {
        "EMAIL": [
            {
                "key": "changedSetting",
                "type": "string",
                "description": "The setting that was changed: options, phone number, or answers to security questions.",
                "example": "Example"
            },
            {
                "key": "hasOrHave",
                "type": "string",
                "description": "Specifies verb based on number of items changed.",
                "example": "Example"
            },
            {
                "key": "homeUrl",
                "type": "string",
                "description": "URL of Identity Security Cloud homepage.",
                "example": "https://{tenant}.identitynow.com"
            }
        ]
    },
    "cloud_user_locked_out": {
        "EMAIL": [
            {
                "key": "attempts",
                "type": "array",
                "description": "A list of sign in attempts, including count and location.",
                "example": [
                    {
                        "count": 1,
                        "location": "Example"
                    }
                ]
            },
            {
                "key": "passwordResetUrl",
                "type": "string",
                "description": "The URL the user can click to reset their password.",
                "example": "https://{tenant}.identitynow.com"
            },
            {
                "key": "timeLocked",
                "type": "string",
                "description": "The time the account was locked.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "timeLockedUntil",
                "type": "string",
                "description": "The time the account will be unlocked.",
                "example": "2026-12-15T17:00:00Z"
            }
        ]
    },
    "cloud_user_new_account_notification": {
        "EMAIL": [
            {
                "key": "accountAccess",
                "type": "array",
                "description": "The entitlements associated with the account.",
                "example": [
                    "Example"
                ]
            },
            {
                "key": "accountAttributes",
                "type": "object",
                "description": "The attributes of the newly created account. To reference an attribute, append a period followed by the attribute name. For example, to include the firstName of the newly created account in the email, use the variable accountAttributes.firstName. All attributes marked as required in the account creation configuration are available for use except the variable password to prevent security risks.",
                "example": {}
            },
            {
                "key": "accountIdAttribute",
                "type": "string",
                "description": "The attribute in the source that's used for the account ID.",
                "example": "Example"
            },
            {
                "key": "accountUserName",
                "type": "string",
                "description": "The unique identifier for the source account.",
                "example": "Example Name"
            },
            {
                "key": "identity",
                "type": "object",
                "description": "The attributes of the Identity being provisioned with an account. To reference an attribute, append a period followed by the attribute name. For instance, to include the display name of the identity in the email, use the variable identity.displayName.",
                "example": {}
            },
            {
                "key": "source",
                "type": "string",
                "description": "The source the account was created on.",
                "example": "Example"
            },
            {
                "key": "username",
                "type": "string",
                "description": "The user's Identity Security Cloud user name.",
                "example": "Example Name"
            }
        ]
    },
    "cloud_user_password_changed": {
        "EMAIL": [
            {
                "key": "appCount",
                "type": "string",
                "description": "The count of the apps that successfully were updated.",
                "example": "Example"
            },
            {
                "key": "appFailedCount",
                "type": "string",
                "description": "The count of apps that failed to update.",
                "example": "Example"
            },
            {
                "key": "appFailedList",
                "type": "string",
                "description": "A comma-separated list of applications that failed to update.",
                "example": "Example"
            },
            {
                "key": "appList",
                "type": "string",
                "description": "A comma-separated list of applications that successfully updated.",
                "example": "Example"
            },
            {
                "key": "sourceCount",
                "type": "string",
                "description": "The count of sources that successfully updated.",
                "example": "Example"
            },
            {
                "key": "sourceFailedCount",
                "type": "string",
                "description": "The count of sources that failed to update.",
                "example": "Example"
            },
            {
                "key": "sourceFailedList",
                "type": "array",
                "description": "The list of source names that failed to update.",
                "example": [
                    "Example"
                ]
            },
            {
                "key": "sourceList",
                "type": "array",
                "description": "The list of source names that successfully updated.",
                "example": [
                    "Example"
                ]
            }
        ]
    },
    "cloud_user_password_expiration": {
        "EMAIL": [
            {
                "key": "acctName",
                "type": "string",
                "description": "Name of the account. If the org uses pass-through authentication, this will show the value of the Product Name field in Global > System Settings > Product Branding.",
                "example": "Example Name"
            },
            {
                "key": "appCount",
                "type": "number",
                "description": "Number of applications.",
                "example": 1
            },
            {
                "key": "applist",
                "type": "string",
                "description": "List of applications.",
                "example": "Example"
            },
            {
                "key": "dayToExpire",
                "type": "number",
                "description": "Days left for expiration.",
                "example": 1
            },
            {
                "key": "resetUrl",
                "type": "string",
                "description": "URL for password reset.",
                "example": "https://{tenant}.identitynow.com"
            }
        ]
    },
    "cloud_user_password_reset_token": {
        "EMAIL": [
            {
                "key": "expires",
                "type": "string",
                "description": "When the token expires.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "sourcename",
                "type": "string",
                "description": "Use if this is an account password change.",
                "example": "Example Name"
            },
            {
                "key": "token",
                "type": "string",
                "description": "The 6-digit token.",
                "example": "Example"
            }
        ]
    },
    "cloud_user_unlock_token": {
        "EMAIL": [
            {
                "key": "expires",
                "type": "string",
                "description": "When the token expires.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "token",
                "type": "string",
                "description": "The 6-digit token.",
                "example": "Example"
            }
        ]
    },
    "cloud_user_verification_token": {
        "EMAIL": [
            {
                "key": "sourcename",
                "type": "string",
                "description": "Name of the source of the password being reset.",
                "example": "Example Name"
            },
            {
                "key": "verificationURL",
                "type": "string",
                "description": "URL for password reset.",
                "example": "https://{tenant}.identitynow.com"
            }
        ]
    },
    "create_account_policy_recommendation": {
        "EMAIL": [
            {
                "key": "recipientIds",
                "type": "array",
                "description": "List of identity IDs targeted to receive this notification. Provided by the source-onboarding event payload and used for recipient discovery and notification routing.",
                "example": [
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "recommendationStatus",
                "type": "string",
                "description": "Completion status of the recommendation generation, from the source-onboarding Kafka event that drives this notification.",
                "example": "COMPLETED"
            },
            {
                "key": "recommendationType",
                "type": "string",
                "description": "Type of recommendation that triggered this notification, from the source-onboarding Kafka event that drives this notification.",
                "example": "CREATE_ACCOUNT_POLICY"
            },
            {
                "key": "sourceId",
                "type": "string",
                "description": "Unique ID of the source for which create account policy recommendations were generated. Used in the body to build the deep link to the source's Create Account (account provisioning) settings page.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "sourceName",
                "type": "string",
                "description": "Display name of the source for which create account policy recommendations were generated. Shown in the subject and body.",
                "example": "Workday HR"
            }
        ]
    },
    "das_alert_rule": {
        "EMAIL": [
            {
                "key": "actionTime",
                "type": "string",
                "description": "When the activity happened, pre-formatted for display. Not ISO-8601 and carries no timezone marker; do not re-parse it.",
                "example": "8/10/2026 3:04:05 PM"
            },
            {
                "key": "actionType",
                "type": "string",
                "description": "The action the user performed on the resource, in the connector's own vocabulary.",
                "example": "File Accessed"
            },
            {
                "key": "alert",
                "type": "object",
                "description": "Referenced in the default email template. Properties used: ruleName, severity, actionTime, userName, identityName, identityDepartment, actionType, application, resourcePath, objectName, dataClassificationPolicies, url.",
                "example": {
                    "ruleName": "Example Name",
                    "severity": "Example",
                    "actionTime": "2026-12-15T17:00:00Z",
                    "userName": "Example Name",
                    "identityName": "Example Name",
                    "identityDepartment": "Example",
                    "actionType": "Example",
                    "application": "Example",
                    "resourcePath": "https://{tenant}.identitynow.com",
                    "objectName": "Example Name",
                    "dataClassificationPolicies": "Example",
                    "url": "https://{tenant}.identitynow.com"
                }
            },
            {
                "key": "application",
                "type": "string",
                "description": "Display name of the monitored application where the activity occurred.",
                "example": "OneDrive"
            },
            {
                "key": "dataClassificationPolicies",
                "type": "string",
                "description": "Data classification policies matched on the resource, as one comma-separated string. Reads \"None\" when there are none.",
                "example": "PII, Financial Records"
            },
            {
                "key": "identityDepartment",
                "type": "string",
                "description": "Department of the identity behind the activity. Reads \"Unknown\" when not available.",
                "example": "Finance"
            },
            {
                "key": "identityName",
                "type": "string",
                "description": "Display name of the identity behind the activity. Reads \"Unknown\" unless both first and last name are known.",
                "example": "Dana Cohen"
            },
            {
                "key": "objectName",
                "type": "string",
                "description": "Name of the object acted on, such as the file or folder. Reads \"N/A\" when not available.",
                "example": "Q3-payroll.xlsx"
            },
            {
                "key": "recipientIdentityIds",
                "type": "array",
                "description": "Identity ids taken from the alert rule's email notification list. Duplicates are possible.",
                "example": [
                    "00000000000040008000000000000000",
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "resourcePath",
                "type": "string",
                "description": "Path of the resource the action was performed on.",
                "example": "/sites/Finance/Shared Documents/Payroll"
            },
            {
                "key": "ruleName",
                "type": "string",
                "description": "Name of the alert rule that matched, as the tenant named it.",
                "example": "Sensitive file downloaded from Finance site"
            },
            {
                "key": "severity",
                "type": "string",
                "description": "Severity of the alert rule that matched: High, Medium or Low.",
                "example": "High"
            },
            {
                "key": "url",
                "type": "string",
                "description": "Deep link to the Activity Forensics screen. Points at the forensics list, not this single activity, and can be an empty string.",
                "example": "https://{tenant}.identitynow.com/forensics/activities"
            },
            {
                "key": "userName",
                "type": "string",
                "description": "Account name of the actor in the monitored application. Not the same as identityName.",
                "example": "user@example.com"
            }
        ]
    },
    "das_campaign_assigned": {
        "EMAIL": [
            {
                "key": "campaignAssigned",
                "type": "object",
                "description": "Referenced in the default email template. Properties used: name, dueDate, url, description, instructions.",
                "example": {
                    "name": "Example Name",
                    "dueDate": "2026-12-15T17:00:00Z",
                    "url": "https://{tenant}.identitynow.com",
                    "description": "Example",
                    "instructions": "Example"
                }
            },
            {
                "key": "description",
                "type": "string",
                "description": "Campaign description, as entered by its author. An empty string when the campaign has none.",
                "example": "Quarterly review of finance shared-folder access."
            },
            {
                "key": "dueDate",
                "type": "string",
                "description": "The reviewer's deadline, pre-formatted as a long date. It carries no time or timezone; do not re-parse it.",
                "example": "Friday, September 11, 2026"
            },
            {
                "key": "instructions",
                "type": "string",
                "description": "Reviewer instructions configured on the campaign. An empty string when it has none.",
                "example": "Approve access that is still required and revoke anything no longer needed."
            },
            {
                "key": "name",
                "type": "string",
                "description": "Name of the access certification campaign.",
                "example": "Q3 Finance Access Review"
            },
            {
                "key": "recipientIdentityIds",
                "type": "array",
                "description": "Identity ids of the reviewers this notification is addressed to. Hyphenation differs between the two trigger paths, so do not compare them as strings.",
                "example": [
                    "00000000000040008000000000000000",
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "url",
                "type": "string",
                "description": "Deep link to the reviewer's certification task list for this campaign.",
                "example": "https://{tenant}.identitynow.com/my-tasks/access-certification/4271"
            }
        ]
    },
    "das_campaign_reminder": {
        "EMAIL": [
            {
                "key": "campaignReminder",
                "type": "object",
                "description": "Referenced in the default email template. Properties used: dueDate, url, name, description, instructions.",
                "example": {
                    "dueDate": "2026-12-15T17:00:00Z",
                    "url": "https://{tenant}.identitynow.com",
                    "name": "Example Name",
                    "description": "Example",
                    "instructions": "Example"
                }
            },
            {
                "key": "description",
                "type": "string",
                "description": "Campaign description, as entered by its author. May be null when the campaign has none.",
                "example": "Quarterly review of finance shared-folder access."
            },
            {
                "key": "dueDate",
                "type": "string",
                "description": "The reviewer's deadline, pre-formatted as a long date. It carries no time or timezone; do not re-parse it.",
                "example": "Friday, September 11, 2026"
            },
            {
                "key": "instructions",
                "type": "string",
                "description": "Reviewer instructions configured on the campaign. May be null when it has none.",
                "example": "Approve access that is still required and revoke anything no longer needed."
            },
            {
                "key": "name",
                "type": "string",
                "description": "Name of the access certification campaign.",
                "example": "Q3 Finance Access Review"
            },
            {
                "key": "recipientIdentityIds",
                "type": "array",
                "description": "Identity ids of the reviewers who still have outstanding review items. Can be empty.",
                "example": [
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "url",
                "type": "string",
                "description": "Deep link to the reviewer's certification task list for this campaign.",
                "example": "https://{tenant}.identitynow.com/my-tasks/access-certification/4271"
            }
        ]
    },
    "das_campaign_revocation_failure": {
        "EMAIL": [
            {
                "key": "campaign",
                "type": "object",
                "description": "Referenced in the default email template. Properties used: campaignName, url.",
                "example": {
                    "campaignName": "Example Name",
                    "url": "https://{tenant}.identitynow.com"
                }
            },
            {
                "key": "campaignName",
                "type": "string",
                "description": "Name of the access certification campaign whose revocations completed with failures.",
                "example": "Q3 Finance Access Review"
            },
            {
                "key": "recipientIdentityIds",
                "type": "array",
                "description": "Identity id of the campaign owner. Always exactly one id; used for routing, not for display.",
                "example": [
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "url",
                "type": "string",
                "description": "Owner-facing deep link to the campaign's revocation view, including the query string that opens it.",
                "example": "https://{tenant}.identitynow.com/ui/das/compliance/access-certification/campaigns-management/4271?tab=revocation"
            }
        ]
    },
    "das_campaign_revocation_success": {
        "EMAIL": [
            {
                "key": "campaign",
                "type": "object",
                "description": "Referenced in the default email template. Properties used: campaignName, url.",
                "example": {
                    "campaignName": "Example Name",
                    "url": "https://{tenant}.identitynow.com"
                }
            },
            {
                "key": "campaignName",
                "type": "string",
                "description": "Name of the access certification campaign whose revocations all succeeded.",
                "example": "Q3 Finance Access Review"
            },
            {
                "key": "recipientIdentityIds",
                "type": "array",
                "description": "Identity id of the campaign owner. Always exactly one id; used for routing, not for display.",
                "example": [
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "url",
                "type": "string",
                "description": "Owner-facing deep link to the campaign's revocation view, including the query string that opens it.",
                "example": "https://{tenant}.identitynow.com/ui/das/compliance/access-certification/campaigns-management/4271?tab=revocation"
            }
        ]
    },
    "das_owner_election_assignment": {
        "EMAIL": [
            {
                "key": "appName",
                "type": "string",
                "description": "Display name of the application the resource belongs to.",
                "example": "Corporate File Share"
            },
            {
                "key": "assignment",
                "type": "object",
                "description": "Referenced in the default email template. Properties used: appName, resourcePath.",
                "example": {
                    "appName": "Example Name",
                    "resourcePath": "https://{tenant}.identitynow.com"
                }
            },
            {
                "key": "recipientIdentityIds",
                "type": "array",
                "description": "Identity ids of the people assigned as owners of the resource. May hold several, or be empty when no candidate was approved.",
                "example": [
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "resourcePath",
                "type": "string",
                "description": "Full path of the resource, in the source system's own format. The delimiter varies by application type — file shares use backslashes.",
                "example": "path\\to\\finance\\reports"
            }
        ]
    },
    "das_owner_election_invite": {
        "EMAIL": [
            {
                "key": "election",
                "type": "object",
                "description": "Referenced in the default email template. Properties used: taskCount, taskUrl.",
                "example": {
                    "taskCount": 1,
                    "taskUrl": "https://{tenant}.identitynow.com"
                }
            },
            {
                "key": "recipientIdentityIds",
                "type": "array",
                "description": "Identity id of the invited voter. One event is published per voter, so this always holds exactly one id.",
                "example": [
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "taskCount",
                "type": "number",
                "description": "How many resources this recipient still has to vote on.",
                "example": 3
            },
            {
                "key": "taskUrl",
                "type": "string",
                "description": "Deep link to the recipient's voting page for this election.",
                "example": "https://{tenant}.identitynow.com/my-tasks/data-ownership/owner-election/482"
            }
        ]
    },
    "das_owner_election_reminder": {
        "EMAIL": [
            {
                "key": "election",
                "type": "object",
                "description": "Referenced in the default email template. Properties used: taskCount, taskUrl.",
                "example": {
                    "taskCount": 1,
                    "taskUrl": "https://{tenant}.identitynow.com"
                }
            },
            {
                "key": "recipientIdentityIds",
                "type": "array",
                "description": "Identity ids of the reminded recipients. A voter reminder holds one id; a reviewer reminder may hold several.",
                "example": [
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "taskCount",
                "type": "number",
                "description": "Items the recipient still has outstanding. On the single-voter reminder it counts every in-election resource that voter is eligible for, including ones already voted on.",
                "example": 2
            },
            {
                "key": "taskUrl",
                "type": "string",
                "description": "Deep link to the recipient's outstanding work — the voting page for a voter, the review page for a reviewer. The payload does not say which.",
                "example": "https://{tenant}.identitynow.com/my-tasks/data-ownership/owner-election/482"
            }
        ]
    },
    "das_owner_election_reviewer_invite": {
        "EMAIL": [
            {
                "key": "election",
                "type": "object",
                "description": "Referenced in the default email template. Properties used: taskUrl.",
                "example": {
                    "taskUrl": "https://{tenant}.identitynow.com"
                }
            },
            {
                "key": "recipientIdentityIds",
                "type": "array",
                "description": "Identity ids of the election's reviewers. One event addresses them all, so it may hold several ids.",
                "example": [
                    "00000000000040008000000000000000",
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "taskCount",
                "type": "number",
                "description": "Always 0 on this notification — never populated. Do not present it as a count.",
                "example": 0
            },
            {
                "key": "taskUrl",
                "type": "string",
                "description": "Deep link to this election's review page. The id in the path is the election id.",
                "example": "https://{tenant}.identitynow.com/my-tasks/data-ownership/election-review/482"
            }
        ]
    },
    "das_report_created": {
        "EMAIL": [
            {
                "key": "createDate",
                "type": "string",
                "description": "Generation time, pre-formatted for display. The instant is UTC but carries no timezone marker.",
                "example": "8/9/2026 10:14:02 AM"
            },
            {
                "key": "createdByDisplayName",
                "type": "string",
                "description": "Display name of the user who requested the report. Empty when that identity cannot be resolved.",
                "example": "Dana Kim"
            },
            {
                "key": "name",
                "type": "string",
                "description": "Name of the generated report, as entered by its creator.",
                "example": "Q3 Access Review Export"
            },
            {
                "key": "recipientIdentityIds",
                "type": "array",
                "description": "Identity ids of the users authorized to view the report. Used for routing, not for display.",
                "example": [
                    "00000000000040008000000000000000",
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "report",
                "type": "object",
                "description": "Referenced in the default email template. Properties used: name, type, createdByDisplayName, createDate, url.",
                "example": {
                    "name": "Example Name",
                    "type": "Example",
                    "createdByDisplayName": "Example Name",
                    "createDate": "2026-12-15T17:00:00Z",
                    "url": "https://{tenant}.identitynow.com"
                }
            },
            {
                "key": "type",
                "type": "string",
                "description": "The report type, as a display label — not the report's own name.",
                "example": "Redundant Permissions Report"
            },
            {
                "key": "url",
                "type": "string",
                "description": "Deep link that opens the generated report on the My Reports page.",
                "example": "https://{tenant}.identitynow.com/reports/my-reports?myReports=%7b%22reportName%22%3a%22Q3+Access+Review+Export%22%7d"
            }
        ]
    },
    "das_report_shared": {
        "EMAIL": [
            {
                "key": "personalMessage",
                "type": "string",
                "description": "Pre-rendered HTML sentence carrying the sharer's optional note, including its own intro wording and italics — do not add a label. Render unescaped. Empty only when the note is an empty string; an omitted note still emits the intro with empty italics.",
                "example": "The user also attached the following message:<br /><br /><i>Please review before Friday's audit call.</i>"
            },
            {
                "key": "recipientIdentityIds",
                "type": "array",
                "description": "Identity ids of the recipients the sharer selected, plus the sharer when they copied themselves in. Not de-duplicated; used for routing, not for display.",
                "example": [
                    "00000000000040008000000000000000",
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "reportList",
                "type": "string",
                "description": "Pre-rendered HTML list of the shared reports, each a deep link with its generation date. Render unescaped; empty when none of the requested reports belong to the sharer.",
                "example": "<br />- <a href=\"https://{tenant}.identitynow.com/reports/my-reports?myReports=%7B%22onlyNewReports%22:false,%22reportName%22:%22Entitlements Report%22%7D\">Entitlements Report (8/10/2026)</a>"
            },
            {
                "key": "reportShare",
                "type": "object",
                "description": "Referenced in the default email template. Properties used: subject, senderEmail, senderName, reportList, personalMessage.",
                "example": {
                    "subject": "Example",
                    "senderEmail": "user@example.com",
                    "senderName": "Example Name",
                    "reportList": "Example",
                    "personalMessage": "Example"
                }
            },
            {
                "key": "senderEmail",
                "type": "string",
                "description": "Email address of the user who shared the reports. May be null when that identity has no email on record.",
                "example": "user@example.com"
            },
            {
                "key": "senderName",
                "type": "string",
                "description": "Display name of the user who shared the reports.",
                "example": "Dana Cohen"
            },
            {
                "key": "subject",
                "type": "string",
                "description": "Subject line typed by the sharing user. Passed through verbatim and not HTML-escaped.",
                "example": "Q3 entitlements reports for your review"
            }
        ]
    },
    "jit_activation_extended": {
        "EMAIL": [
            {
                "key": "activationUrl",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "https://{tenant}.identitynow.com"
            },
            {
                "key": "entitlementName",
                "type": "string",
                "description": "Display name of the JIT entitlement.",
                "example": "Finance Read Access"
            },
            {
                "key": "extensionDuration",
                "type": "string",
                "description": "Duration by which the JIT session was extended.",
                "example": "30 minutes"
            },
            {
                "key": "ownerName",
                "type": "string",
                "description": "The display name of the access owner or administrator the recipient should contact with questions.",
                "example": "Example Name"
            }
        ],
        "SLACK": [
            {
                "key": "entitlementName",
                "type": "string",
                "description": "Display name of the JIT entitlement.",
                "example": "Finance Read Access"
            },
            {
                "key": "extensionDuration",
                "type": "string",
                "description": "Duration by which the JIT session was extended.",
                "example": "30 minutes"
            }
        ]
    },
    "jit_activation_failed": {
        "EMAIL": [
            {
                "key": "activationUrl",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "https://{tenant}.identitynow.com"
            },
            {
                "key": "entitlementName",
                "type": "string",
                "description": "Display name of the JIT entitlement.",
                "example": "Finance Read Access"
            },
            {
                "key": "ownerName",
                "type": "string",
                "description": "Display name of the access owner or administrator the recipient should contact with questions.",
                "example": "Example Name"
            }
        ],
        "SLACK": [
            {
                "key": "entitlementName",
                "type": "string",
                "description": "Display name of the JIT entitlement.",
                "example": "Finance Read Access"
            }
        ]
    },
    "jit_activation_fifteen_min": {
        "EMAIL": [
            {
                "key": "activationUrl",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "https://{tenant}.identitynow.com"
            },
            {
                "key": "applicationName",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example Name"
            },
            {
                "key": "entitlementName",
                "type": "string",
                "description": "Display name of the JIT entitlement.",
                "example": "Finance Read Access"
            },
            {
                "key": "ownerName",
                "type": "string",
                "description": "Display name of the access owner or administrator the recipient should contact with questions.",
                "example": "Example Name"
            }
        ],
        "SLACK": [
            {
                "key": "entitlementName",
                "type": "string",
                "description": "Display name of the JIT entitlement.",
                "example": "Finance Read Access"
            }
        ]
    },
    "jit_activation_ready": {
        "EMAIL": [
            {
                "key": "activationDuration",
                "type": "string",
                "description": "Duration for which the JIT session is active.",
                "example": "30 minutes"
            },
            {
                "key": "activationUrl",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "https://{tenant}.identitynow.com"
            },
            {
                "key": "entitlementName",
                "type": "string",
                "description": "Display name of the JIT entitlement.",
                "example": "Finance Read Access"
            },
            {
                "key": "ownerName",
                "type": "string",
                "description": "The display name of the access owner or administrator the recipient should contact with questions.",
                "example": "Example Name"
            }
        ],
        "SLACK": [
            {
                "key": "activationDuration",
                "type": "string",
                "description": "Duration for which the JIT session is active.",
                "example": "30 minutes"
            },
            {
                "key": "entitlementName",
                "type": "string",
                "description": "Display name of the JIT entitlement.",
                "example": "Finance Read Access"
            }
        ]
    },
    "jit_deactivation": {
        "EMAIL": [
            {
                "key": "activationUrl",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "https://{tenant}.identitynow.com"
            },
            {
                "key": "entitlementName",
                "type": "string",
                "description": "Display name of the JIT entitlement.",
                "example": "Finance Read Access"
            },
            {
                "key": "ownerName",
                "type": "string",
                "description": "The display name of the access owner or administrator the recipient should contact with questions.",
                "example": "Example Name"
            }
        ],
        "SLACK": [
            {
                "key": "entitlementName",
                "type": "string",
                "description": "Display name of the JIT entitlement.",
                "example": "Finance Read Access"
            }
        ]
    },
    "machine_account_creation_request_completed": {
        "EMAIL": [
            {
                "key": "accountName",
                "type": "string",
                "description": "The name of the account.",
                "example": "Example Name"
            },
            {
                "key": "data",
                "type": "object",
                "description": "Data containing source, subtype, account name, operation type and requester identity details",
                "example": {
                    "sourceName": "AzureSource",
                    "sourceId": "00000000000040008000000000000000",
                    "subtypeName": "Service accounts",
                    "subtypeId": "00000000-0000-4000-8000-000000000000",
                    "accountName": "Service accounts - AzureSource",
                    "operationType": "create",
                    "requesterName": "John Doe",
                    "requester": {
                        "id": "00000000000040008000000000000000",
                        "name": "John Doe"
                    }
                }
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "The display name of the identity that submitted the request.",
                "example": "Example Name"
            },
            {
                "key": "sourceName",
                "type": "string",
                "description": "The name of the source.",
                "example": "Example Name"
            }
        ]
    },
    "new_applications_discovered_notification": {
        "EMAIL": [
            {
                "key": "AppCount",
                "type": "number",
                "description": "Number of newly discovered applications included in this notification. Shown in the subject and body.",
                "example": 3
            },
            {
                "key": "AppIDs",
                "type": "array",
                "description": "IDs of the discovered applications included in this notification, from the app-discovery Kafka event payload.",
                "example": [
                    "00000000000040008000000000000000",
                    "00000000000040008000000000000000",
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "AppNames",
                "type": "array",
                "description": "Names of the newly discovered applications listed in the notification body table.",
                "example": [
                    "Workday",
                    "Salesforce",
                    "ServiceNow"
                ]
            },
            {
                "key": "CountApps",
                "type": "number",
                "description": "Number of enterprise applications that have been discovered.",
                "example": 1
            },
            {
                "key": "DeepLink",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "https://{tenant}.identitynow.com"
            },
            {
                "key": "DeepLinkSuffix",
                "type": "string",
                "description": "URL path suffix appended to ${__global.productUrl} to link directly to the discovered applications list filtered by source and discovery window.",
                "example": "/ui/a/admin/connections/sources-list/discovered-applications?filters=sourceId+eq+%222c9180837f3f3a87017f48f95f1a1234%22+and+createdAtStart+ge+%222024-09-04T06%3A00%3A00Z%22"
            },
            {
                "key": "DiscoverySource",
                "type": "string",
                "description": "Discovery source type (for example, csv, sso, or pam) shown as the Discovery Source Type column in the notification body.",
                "example": "sso"
            },
            {
                "key": "DiscoverySourceName",
                "type": "string",
                "description": "Display name of the discovery source from which the applications were found. Shown in the subject and body.",
                "example": "Okta SSO"
            },
            {
                "key": "RecipientId",
                "type": "string",
                "description": "Identity ID of the discovery source owner who receives this notification. Provided by saas-sp-app-discovery and used for recipient discovery and notification routing.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "RecipientName",
                "type": "string",
                "description": "Display name of the discovery source owner from the app-discovery Kafka event payload.",
                "example": "Jane Smith"
            },
            {
                "key": "SourceID",
                "type": "string",
                "description": "Unique ID of the discovery source associated with the newly discovered applications. Used when constructing the deep link to the discovered applications list.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "TenantID",
                "type": "string",
                "description": "Tenant ID for the organization where applications were discovered, from the app-discovery Kafka event payload.",
                "example": "00000000-0000-4000-8000-000000000000"
            },
            {
                "key": "sourcename",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example Name"
            }
        ]
    },
    "new_machine_account_assigned": {
        "EMAIL": [
            {
                "key": "accountName",
                "type": "string",
                "description": "The name of the account.",
                "example": "Example Name"
            },
            {
                "key": "data",
                "type": "object",
                "description": "Data containing source, machine account and owner identity details",
                "example": {
                    "sourceName": "AzureSource",
                    "sourceId": "00000000000040008000000000000000",
                    "accountName": "svc.dev.serviceAccount1",
                    "accountId": "00000000000040008000000000000000",
                    "ownerName": "John Doe",
                    "owner": {
                        "id": "00000000000040008000000000000000",
                        "name": "John Doe"
                    }
                }
            },
            {
                "key": "ownerName",
                "type": "string",
                "description": "The name of the identity who is responsible for the machine account.",
                "example": "Example Name"
            },
            {
                "key": "sourceName",
                "type": "string",
                "description": "The name of the source.",
                "example": "Example Name"
            }
        ]
    },
    "non_employee_approval_required": {
        "EMAIL": [
            {
                "key": "data",
                "type": "object",
                "description": "Referenced in the default email template. Properties used: firstName, lastName, nonEmployeeSource, name, requester, id, approvalItems, accountName.",
                "example": {
                    "firstName": "Example Name",
                    "lastName": "Example Name",
                    "nonEmployeeSource": {
                        "name": "Example Name"
                    },
                    "requester": {
                        "id": "00000000-0000-4000-8000-000000000000"
                    },
                    "approvalItems": "Example",
                    "accountName": "Example Name"
                }
            }
        ]
    },
    "non_employee_bulk_import_failed_email_notification": {
        "EMAIL": [
            {
                "key": "data",
                "type": "object",
                "description": "Referenced in the default email template. Properties used: sourceName, sourceId, dateTime, errorMessage, displayName.",
                "example": {
                    "sourceName": "Example Name",
                    "sourceId": "00000000-0000-4000-8000-000000000000",
                    "dateTime": "2026-12-15T17:00:00Z",
                    "errorMessage": "Example",
                    "displayName": "Example Name"
                }
            }
        ]
    },
    "non_employee_bulk_import_passed_email_notification": {
        "EMAIL": [
            {
                "key": "data",
                "type": "object",
                "description": "Referenced in the default email template. Properties used: sourceName, sourceId, dateTime, numProcessedAccounts, intValue, numChangedAccounts, numUnchangedAccounts, numNewAccounts.",
                "example": {
                    "sourceName": "Example Name",
                    "sourceId": "00000000-0000-4000-8000-000000000000",
                    "dateTime": "2026-12-15T17:00:00Z",
                    "numProcessedAccounts": {
                        "intValue": "Example"
                    },
                    "numChangedAccounts": {
                        "intValue": "Example"
                    },
                    "numUnchangedAccounts": {
                        "intValue": "Example"
                    },
                    "numNewAccounts": {
                        "intValue": "Example"
                    }
                }
            }
        ]
    },
    "non_employee_request_action_completed": {
        "EMAIL": [
            {
                "key": "data",
                "type": "object",
                "description": "Referenced in the default email template. Properties used: firstName, lastName, approvalStatus, nonEmployeeSource, name, created, accountName, completionDate.",
                "example": {
                    "firstName": "Example Name",
                    "lastName": "Example Name",
                    "approvalStatus": "Example",
                    "nonEmployeeSource": {
                        "name": "Example Name"
                    },
                    "created": "Example",
                    "accountName": "Example Name",
                    "completionDate": "2026-12-15T17:00:00Z"
                }
            }
        ]
    },
    "non_employee_request_created": {
        "EMAIL": [
            {
                "key": "data",
                "type": "object",
                "description": "Referenced in the default email template. Properties used: firstName, lastName, nonEmployeeSource, name, accountName.",
                "example": {
                    "firstName": "Example Name",
                    "lastName": "Example Name",
                    "nonEmployeeSource": {
                        "name": "Example Name"
                    },
                    "accountName": "Example Name"
                }
            }
        ]
    },
    "non_employee_term_end_date_near": {
        "EMAIL": [
            {
                "key": "data",
                "type": "object",
                "description": "Referenced in the default email template. Properties used: expiringNonEmployees, sourceName, sourceId.",
                "example": {
                    "expiringNonEmployees": "Example",
                    "sourceName": "Example Name",
                    "sourceId": "00000000-0000-4000-8000-000000000000"
                }
            }
        ]
    },
    "onboarding_password_reset": {
        "EMAIL": [
            {
                "key": "expirationTime",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "userDisplayName",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example Name"
            },
            {
                "key": "userName",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example Name"
            },
            {
                "key": "verificationURL",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "https://{tenant}.identitynow.com"
            }
        ]
    },
    "pending_access_request_cancelled": {
        "EMAIL": [
            {
                "key": "cancelComment",
                "type": "string",
                "description": "The reason for canceling the request.",
                "example": "Example"
            },
            {
                "key": "cancelerName",
                "type": "string",
                "description": "The name of the user who canceled the request.",
                "example": "Example Name"
            },
            {
                "key": "emailRecipientName",
                "type": "string",
                "description": "The name of the email recipient.",
                "example": "user@example.com"
            },
            {
                "key": "isRobo",
                "type": "boolean",
                "description": "Whether the request was made on the behalf of another user.",
                "example": true
            },
            {
                "key": "requestedForName",
                "type": "string",
                "description": "The name of the user for whom access was requested.",
                "example": "Example Name"
            },
            {
                "key": "requestedObjectDetailsByType",
                "type": "object",
                "description": "A list of details about each item requested, in order of the object type (access profile, entitlement, or role).",
                "example": [
                    {
                        "name": "Example Name",
                        "removeDate": "2026-12-15T17:00:00Z",
                        "dimensionDetails": "Example"
                    }
                ]
            },
            {
                "key": "requestedObjectNamesByType",
                "type": "object",
                "description": "The names of each item requested, in order of the object type (access profile, entitlement, or role).",
                "example": {}
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "The name of the user who requested the access.",
                "example": "Example Name"
            }
        ]
    },
    "pending_manual_changes": {
        "EMAIL": [
            {
                "key": "approvalSet",
                "type": "object",
                "description": "The model for the approval process.",
                "example": [
                    {
                        "applicationName": "Example Name",
                        "nativeIdentity": "Example",
                        "instance": "Example",
                        "operation": "Example",
                        "displayName": "Example Name",
                        "name": "Example Name",
                        "displayValue": "Example",
                        "csv": "Example",
                        "requesterComments": "Example"
                    }
                ]
            },
            {
                "key": "identityDisplayName",
                "type": "string",
                "description": "The display name of the identity being changed.",
                "example": "Example Name"
            },
            {
                "key": "identityName",
                "type": "string",
                "description": "The name of the identity being changed.",
                "example": "Example Name"
            },
            {
                "key": "item",
                "type": "object",
                "description": "The item that needs to be changed.",
                "example": {
                    "applicationName": "Example Name",
                    "nativeIdentity": "Example",
                    "instance": "Example",
                    "operation": "Example",
                    "displayName": "Example Name",
                    "name": "Example Name",
                    "displayValue": "Example",
                    "csv": "Example",
                    "requesterComments": "Example"
                }
            },
            {
                "key": "launcher",
                "type": "string",
                "description": "The identity who requested the change.",
                "example": "Example"
            }
        ]
    },
    "policy_version_changed_while_disabled": {
        "EMAIL": [
            {
                "key": "_actorName",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example Name"
            },
            {
                "key": "actorId",
                "type": "string",
                "description": "ID of the identity who re-enabled the policy. Hydrated to a display name in the template via $__util.getUser($actorId).name, except for the literal value 'system', which renders as System.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "policyId",
                "type": "string",
                "description": "Unique ID of the policy, used to build the deep link to the policy's view details page.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "policyName",
                "type": "string",
                "description": "Display name of the policy that was changed.",
                "example": "Finance vs AP Separation"
            },
            {
                "key": "policyTypeUrlId",
                "type": "string",
                "description": "URL-safe identifier for the policy type, used to build the deep link to the policy's view details page.",
                "example": "endpoint-agent-authz"
            },
            {
                "key": "policyTypeVanityName",
                "type": "string",
                "description": "Display name of the policy's type.",
                "example": "JIT Duration"
            },
            {
                "key": "policyUrl",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "https://{tenant}.identitynow.com"
            }
        ]
    },
    "privilege_recommendation_review_notification": {
        "EMAIL": [
            {
                "key": "DeepLinkSuffix",
                "type": "string",
                "description": "URL path suffix appended to the base product URL to link directly to the Privileged Entitlement Recommendations page.",
                "example": "/ui/d/approvals/privilege-classification"
            },
            {
                "key": "EntitlementName",
                "type": "string",
                "description": "Human-readable name of the privileged entitlement flagged for review.",
                "example": "Read Access"
            }
        ],
        "SLACK": [
            {
                "key": "DeepLinkSuffix",
                "type": "string",
                "description": "URL path suffix appended to the base product URL to link directly to the Privileged Entitlement Recommendations page.",
                "example": "/ui/d/approvals/privilege-classification"
            },
            {
                "key": "EntitlementName",
                "type": "string",
                "description": "Human-readable name of the privileged entitlement flagged for review.",
                "example": "Read Access"
            }
        ],
        "TEAMS": [
            {
                "key": "DeepLinkSuffix",
                "type": "string",
                "description": "URL path suffix appended to the base product URL to link directly to the Privileged Entitlement Recommendations page.",
                "example": "/ui/d/approvals/privilege-classification"
            },
            {
                "key": "EntitlementName",
                "type": "string",
                "description": "Human-readable name of the privileged entitlement flagged for review.",
                "example": "Read Access"
            }
        ]
    },
    "regen_sed_notification": {
        "EMAIL": [
            {
                "key": "DeepLinkSuffix",
                "type": "string",
                "description": "Creates a link to the GenAI Entitlement Descriptions page when combined with ${__global.productUrl}. The link directs to a filtered view of the regenerated descriptions mentioned in this notification.",
                "example": "/ui/a/admin/access/suggested-entitlement-descriptions/00000000-0000-4000-8000-000000000000"
            },
            {
                "key": "SedRegenerationCount",
                "type": "number",
                "description": "The number of suggested entitlement descriptions that have been regenerated.",
                "example": 42
            }
        ],
        "SLACK": [
            {
                "key": "DeepLinkSuffix",
                "type": "string",
                "description": "Creates a link to the GenAI Entitlement Descriptions page when combined with ${__global.productUrl}. The link directs to a filtered view of the regenerated descriptions mentioned in this notification.",
                "example": "/ui/a/admin/access/suggested-entitlement-descriptions/00000000-0000-4000-8000-000000000000"
            },
            {
                "key": "SedRegenerationCount",
                "type": "number",
                "description": "The number of suggested entitlement descriptions that have been regenerated.",
                "example": 42
            }
        ],
        "TEAMS": [
            {
                "key": "DeepLinkSuffix",
                "type": "string",
                "description": "Creates a link to the GenAI Entitlement Descriptions page when combined with ${__global.productUrl}. The link directs to a filtered view of the regenerated descriptions mentioned in this notification.",
                "example": "/ui/a/admin/access/suggested-entitlement-descriptions/00000000-0000-4000-8000-000000000000"
            },
            {
                "key": "SedRegenerationCount",
                "type": "number",
                "description": "The number of suggested entitlement descriptions that have been regenerated.",
                "example": 42
            }
        ]
    },
    "remediation_work_item": {
        "EMAIL": [
            {
                "key": "comments",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example Name"
            },
            {
                "key": "workItemName",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example Name"
            }
        ]
    },
    "resource_lifecycle_request_notification_completed": {
        "EMAIL": [
            {
                "key": "data",
                "type": "object",
                "description": "Data containing operation type, and details of source, machine identity and requester identity.",
                "example": {
                    "sourceName": "AWS SOURCE",
                    "sourceId": "00000000000040008000000000000000",
                    "machineIdentityName": "Bob",
                    "machineIdentitySubtype": "AI_AGENT",
                    "operationType": "enable",
                    "requesterName": "John Doe",
                    "requester": {
                        "id": "00000000000040008000000000000000",
                        "name": "John Doe"
                    }
                }
            },
            {
                "key": "machineIdentityName",
                "type": "string",
                "description": "The name of the machine identity.",
                "example": "Example Name"
            },
            {
                "key": "machineIdentitySubtype",
                "type": "string",
                "description": "The reason the account request failed.",
                "example": "Example"
            },
            {
                "key": "operationType",
                "type": "string",
                "description": "Indicates whether a machine identity was activated or deactivated.",
                "example": "Example"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "The display name of the identity that submitted the request.",
                "example": "Example Name"
            },
            {
                "key": "sourceName",
                "type": "string",
                "description": "The name of the source.",
                "example": "Example Name"
            }
        ]
    },
    "resource_lifecycle_request_notification_failed": {
        "EMAIL": [
            {
                "key": "MachineIdentitySubtype",
                "type": "string",
                "description": "The reason the account request failed.",
                "example": "Example"
            },
            {
                "key": "data",
                "type": "object",
                "description": "Data containing failure reason, operation type, and details of source, machine identity and requester identity.",
                "example": {
                    "sourceName": "AWS SOURCE",
                    "sourceId": "00000000000040008000000000000000",
                    "machineIdentityName": "Bob",
                    "machineIdentitySubtype": "AI_AGENT",
                    "operationType": "disable",
                    "requesterName": "John Doe",
                    "failureReason": "LIFECYCLE_REQUEST_ALREADY_CANCELING",
                    "requester": {
                        "id": "00000000000040008000000000000000",
                        "name": "John Doe"
                    }
                }
            },
            {
                "key": "failureReason",
                "type": "string",
                "description": "The reason the request failed.",
                "example": "Example"
            },
            {
                "key": "machineIdentityName",
                "type": "string",
                "description": "The name of the machine identity.",
                "example": "Example Name"
            },
            {
                "key": "operationType",
                "type": "string",
                "description": "Indicates whether a machine identity was activated or deactivated.",
                "example": "Example"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "The display name of the identity that submitted the request.",
                "example": "Example Name"
            },
            {
                "key": "sourceName",
                "type": "string",
                "description": "The name of the source.",
                "example": "Example Name"
            }
        ]
    },
    "saf_aws_onboarding_fail": {
        "EMAIL": [
            {
                "key": "adminAccountId",
                "type": "string",
                "description": "Masked AWS organization admin account ID (******** + last 4 digits).",
                "example": "********9012"
            },
            {
                "key": "failureReason",
                "type": "string",
                "description": "Sanitized human-readable reason describing why Rapid AWS Onboarding failed, when available.",
                "example": "Delegation access request timed out in the AWS Management Account"
            },
            {
                "key": "recipientIds",
                "type": "array",
                "description": "List of identity IDs targeted to receive this notification.",
                "example": [
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "sourceId",
                "type": "string",
                "description": "Unique ID of the source for which Rapid AWS Onboarding failed, if available.",
                "example": "00000000000040008000000000000000"
            }
        ]
    },
    "saf_aws_onboarding_partial": {
        "EMAIL": [
            {
                "key": "adminAccountId",
                "type": "string",
                "description": "Masked AWS organization admin account ID (******** + last 4 digits).",
                "example": "********9012"
            },
            {
                "key": "childAccountsFailed",
                "type": "integer",
                "description": "Number of child AWS accounts that failed deployment.",
                "example": 2
            },
            {
                "key": "childAccountsSuccessful",
                "type": "integer",
                "description": "Number of child AWS accounts deployed successfully.",
                "example": 7
            },
            {
                "key": "childAccountsTotal",
                "type": "integer",
                "description": "Total number of child AWS accounts targeted for deployment.",
                "example": 9
            },
            {
                "key": "failedAccountIds",
                "type": "array",
                "description": "Masked AWS account IDs that failed deployment.",
                "example": [
                    "********3333",
                    "********6666"
                ]
            },
            {
                "key": "managementAccountSuccessful",
                "type": "boolean",
                "description": "Whether the AWS management account deployment succeeded.",
                "example": true
            },
            {
                "key": "recipientIds",
                "type": "array",
                "description": "List of identity IDs targeted to receive this notification.",
                "example": [
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "sourceId",
                "type": "string",
                "description": "Unique ID of the source for which Rapid AWS Onboarding completed partially.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "sourceName",
                "type": "string",
                "description": "Display name of the source.",
                "example": "AWS Production"
            }
        ]
    },
    "saf_aws_onboarding_success": {
        "EMAIL": [
            {
                "key": "adminAccountId",
                "type": "string",
                "description": "Masked AWS organization admin account ID (******** + last 4 digits).",
                "example": "********9012"
            },
            {
                "key": "childAccountsTotal",
                "type": "integer",
                "description": "Total number of child AWS accounts targeted for deployment.",
                "example": 9
            },
            {
                "key": "recipientIds",
                "type": "array",
                "description": "List of identity IDs targeted to receive this notification.",
                "example": [
                    "00000000000040008000000000000000"
                ]
            },
            {
                "key": "sourceId",
                "type": "string",
                "description": "Unique ID of the source for which Rapid AWS Onboarding succeeded.",
                "example": "00000000000040008000000000000000"
            },
            {
                "key": "sourceName",
                "type": "string",
                "description": "Display name of the source for which Rapid AWS Onboarding succeeded.",
                "example": "AWS Production"
            },
            {
                "key": "totalAccounts",
                "type": "integer",
                "description": "Total number of AWS accounts targeted for deployment (management + child accounts).",
                "example": 10
            }
        ]
    },
    "saf_onboarding_source_assigned": {
        "EMAIL": [
            {
                "key": "data",
                "type": "object",
                "description": "Assignment payload published by tenant-onboarding for a non-SELF source assignment. deepLink is a path beginning with /ui/ and is concatenated with $__global.productUrl.",
                "example": {
                    "userName": "Jane Assignee",
                    "adminName": "Alex Admin",
                    "sourceName": "Corporate Active Directory",
                    "deepLink": "/ui/agentic-overview/onboarding"
                }
            },
            {
                "key": "identityId",
                "type": "string",
                "description": "Identity ID of the assignee to which source is assigned to onbaord.",
                "example": "00000000000040008000000000000000"
            }
        ]
    },
    "sod_conflicts_on_access_request_notification": {
        "EMAIL": [
            {
                "key": "accessRequestDetails",
                "type": "object",
                "description": "Details of the access request that resulted in the SoD conflict. Exposes requestBy (name of the identity who submitted the request), requestedFor (name of the identity the access was requested for), and date (date the request was submitted).",
                "example": {
                    "requestBy": "Andrew Beck",
                    "requestedFor": "Andrew Beck",
                    "date": "March 26, 2026"
                }
            },
            {
                "key": "accessRequestItems",
                "type": "string",
                "description": "Comma-separated names of the access items (roles, entitlements, or access profiles) requested that triggered the SoD conflict. Split into individual items for rendering in the notification body.",
                "example": "Accounts Payable Manager, Vendor Setup Approver"
            },
            {
                "key": "requesterName",
                "type": "string",
                "description": "Display name of the identity who submitted the access request. Used in the email greeting.",
                "example": "Andrew Beck"
            }
        ]
    },
    "sod_policy_scheduled_evaluation": {
        "EMAIL": [
            {
                "key": "correctionAdvice",
                "type": "string",
                "description": "Recommended corrective actions from the policy owner.",
                "example": "Remove conflicting role assignments within 5 business days."
            },
            {
                "key": "description",
                "type": "string",
                "description": "Human-readable description of the policy or violation context.",
                "example": "Users may not hold both AP approver and payment initiator access."
            },
            {
                "key": "externalReference",
                "type": "string",
                "description": "Optional external reference identifier for the policy or violation record.",
                "example": "POL-48291"
            },
            {
                "key": "linkToCsv",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "https://{tenant}.identitynow.com"
            },
            {
                "key": "linkToReport",
                "type": "string",
                "description": "URL path or suffix appended to identityNowUrl to open or download the violations report (leading slash typically included).",
                "example": "/ui/d/reports/00000000-0000-4000-8000-000000000000"
            },
            {
                "key": "mitigatingControls",
                "type": "string",
                "description": "Recommended mitigating controls when the violation cannot be fully remediated.",
                "example": "Document compensating control IC-12 and review quarterly."
            },
            {
                "key": "ownerName",
                "type": "string",
                "description": "Display name of the SoD policy owner.",
                "example": "Alex Owner"
            },
            {
                "key": "policyName",
                "type": "string",
                "description": "Business display name of the SoD policy evaluated in this run.",
                "example": "Finance vs AP Separation"
            },
            {
                "key": "searchName",
                "type": "string",
                "description": "The name of the SoD policy search query.",
                "example": "Example Name"
            },
            {
                "key": "searchQuery",
                "type": "string",
                "description": "The implementation search query text used to identify violators for this evaluation.",
                "example": "@accounts(accountCount:2)"
            },
            {
                "key": "searchResults",
                "type": "object",
                "description": "Map from result type label (e.g. document type name) to a summary object with count, noun, and preview table rows. Keys are iterated in the template via keySet(); each value exposes get(\"count\"), get(\"noun\"), and get(\"preview\") where preview is a list of rows and each row is a list of cell values (header row first).",
                "example": {
                    "Identities": {
                        "count": 2,
                        "noun": "identities",
                        "preview": [
                            [
                                "Name",
                                "Email"
                            ],
                            [
                                "Jane Doe",
                                "user@example.com"
                            ],
                            [
                                "John Smith",
                                "user@example.com"
                            ]
                        ]
                    }
                }
            },
            {
                "key": "searchUrl",
                "type": "string",
                "description": "The URL to the Search page.",
                "example": "https://{tenant}.identitynow.com"
            },
            {
                "key": "violationOwner",
                "type": "string",
                "description": "Display name or identifier of the party responsible for the violation context (as provided by the upstream evaluation).",
                "example": "jdoe"
            }
        ]
    },
    "sod_violation_owner_notification": {
        "EMAIL": [
            {
                "key": "dashboardLink",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "https://{tenant}.identitynow.com"
            },
            {
                "key": "dashboardPath",
                "type": "string",
                "description": "Path to the SoD dashboard",
                "example": "/ui/assigned-violations"
            },
            {
                "key": "externalReference",
                "type": "string",
                "description": "An optional UI attribute.",
                "example": "Example"
            },
            {
                "key": "policyDescription",
                "type": "string",
                "description": "Description of the policy",
                "example": "This policy is used to approve sales requests"
            },
            {
                "key": "policyExternalReference",
                "type": "string",
                "description": "External reference of the policy",
                "example": "ext-ref-search"
            },
            {
                "key": "policyLevel",
                "type": "string",
                "description": "Level of the policy",
                "example": "High"
            },
            {
                "key": "policyName",
                "type": "string",
                "description": "Name of the policy",
                "example": "Sales Approval Policy"
            },
            {
                "key": "violationCount",
                "type": "number",
                "description": "Number of violations",
                "example": 20
            },
            {
                "key": "violationOwnerName",
                "type": "string",
                "description": "Identity Display Name",
                "example": "John Doe"
            }
        ]
    },
    "subscription_notification": {
        "EMAIL": [
            {
                "key": "displayQueryDetails",
                "type": "boolean",
                "description": "When true, the email includes the raw query text and (when there are hits) per-type preview tables.",
                "example": true
            },
            {
                "key": "fileNameEncoded",
                "type": "string",
                "description": "URL-encoded report file name for the download link query parameter.",
                "example": "subscription-results.csv"
            },
            {
                "key": "ownerEmail",
                "type": "string",
                "description": "Email address of the subscription owner for the mailto contact link.",
                "example": "user@example.com"
            },
            {
                "key": "ownerName",
                "type": "string",
                "description": "Display name of the subscription owner.",
                "example": "Taylor Owner"
            },
            {
                "key": "savedSearchId",
                "type": "string",
                "description": "Identifier of the saved search used for run-in-UI and report links.",
                "example": "00000000-0000-4000-8000-000000000000"
            },
            {
                "key": "scheduleId",
                "type": "string",
                "description": "Subscription schedule identifier used in the unsubscribe link.",
                "example": "00000000-0000-4000-8000-000000000000"
            },
            {
                "key": "searchName",
                "type": "string",
                "description": "Display name of the subscribed saved search.",
                "example": "New hires with elevated access"
            },
            {
                "key": "searchNameEncoded",
                "type": "string",
                "description": "URL-encoded search name for use in the mailto subject line.",
                "example": "New%20hires%20with%20elevated%20access"
            },
            {
                "key": "searchQuery",
                "type": "string",
                "description": "The saved search query text shown when displayQueryDetails is true.",
                "example": "@identities(name:*)"
            },
            {
                "key": "searchResults",
                "type": "object",
                "description": "Map from result type label to a summary object with count, noun, and preview rows. Used with keySet(), get(\"count\"), get(\"noun\"), and get(\"preview\") (preview is a list of rows; each row is a list of cell strings, header first).",
                "example": {
                    "Identities": {
                        "count": 5,
                        "noun": "identities",
                        "preview": [
                            [
                                "Display Name",
                                "Lifecycle State"
                            ],
                            [
                                "Pat Lee",
                                "active"
                            ],
                            [
                                "Sam Rivera",
                                "active"
                            ]
                        ]
                    }
                }
            },
            {
                "key": "taskResultId",
                "type": "string",
                "description": "Report task result identifier used in the download-report URL.",
                "example": "00000000-0000-4000-8000-000000000000"
            }
        ]
    },
    "task_reassignment": {
        "EMAIL": [
            {
                "key": "newOwner",
                "type": "string",
                "description": "The name of the new owner of the provisioning task.",
                "example": "Example"
            },
            {
                "key": "previousOwner",
                "type": "string",
                "description": "The name of the previous owner of the provisioning task.",
                "example": "Example"
            },
            {
                "key": "requester",
                "type": "string",
                "description": "The name of the user who reassigned the task.",
                "example": "Example"
            },
            {
                "key": "source",
                "type": "string",
                "description": "The name of the source where the provisioning action needs to be taken.",
                "example": "Example"
            },
            {
                "key": "userName",
                "type": "string",
                "description": "The name of the identity whose source account needs to be created or modified in the provisioning task.",
                "example": "Example Name"
            }
        ]
    },
    "user_invitation": {
        "EMAIL": [
            {
                "key": "logoUrl",
                "type": "string",
                "description": "URL for the logo you've set for your organization.",
                "example": "https://{tenant}.identitynow.com"
            },
            {
                "key": "registerImageUrl",
                "type": "string",
                "description": "Identity Security Cloud registration image URL.",
                "example": "https://{tenant}.identitynow.com"
            },
            {
                "key": "registrationUrl",
                "type": "string",
                "description": "Identity Security Cloud registration page URL.",
                "example": "https://{tenant}.identitynow.com"
            }
        ]
    },
    "work_item_forward": {
        "EMAIL": [
            {
                "key": "commentText",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example"
            },
            {
                "key": "forwardDate",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "newOwner",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example"
            },
            {
                "key": "previousOwner",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example"
            },
            {
                "key": "requester",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example"
            },
            {
                "key": "workItemName",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example Name"
            }
        ]
    },
    "work_reassignment_created": {
        "EMAIL": [
            {
                "key": "configType",
                "type": "string",
                "description": "Type of work being reassigned: Access Requests, Certifications, Tasks.",
                "example": "Example"
            },
            {
                "key": "createdByName",
                "type": "string",
                "description": "Name of the identity who created the new reassignment config.",
                "example": "Example Name"
            },
            {
                "key": "endDate",
                "type": "string",
                "description": "End date-time of the reassignment period.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "modifiedByName",
                "type": "string",
                "description": "Name of the identity who created the new reassignment config. For new reassignments that initiate this email, this matches the createdByName.",
                "example": "Example Name"
            },
            {
                "key": "reassignedFromId",
                "type": "string",
                "description": "Unique ID of the identity whose work is being reassigned.",
                "example": "00000000-0000-4000-8000-000000000000"
            },
            {
                "key": "reassignedFromName",
                "type": "string",
                "description": "Name of the identity whose work is being reassigned.",
                "example": "Example Name"
            },
            {
                "key": "reassignedToId",
                "type": "string",
                "description": "Unique ID of the identity receiving the reassignments.",
                "example": "00000000-0000-4000-8000-000000000000"
            },
            {
                "key": "reassignedToName",
                "type": "string",
                "description": "Name of the identity receiving the reassignments.",
                "example": "Example Name"
            },
            {
                "key": "startDate",
                "type": "string",
                "description": "Start date-time of the reassignment period.",
                "example": "2026-12-15T17:00:00Z"
            }
        ]
    },
    "work_reassignment_updated": {
        "EMAIL": [
            {
                "key": "configType",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example"
            },
            {
                "key": "endDate",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "2026-12-15T17:00:00Z"
            },
            {
                "key": "modifiedByName",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example Name"
            },
            {
                "key": "newConfig",
                "type": "object",
                "description": "New work reassignment configuration details.",
                "example": {
                    "reassignedFromName": "Example Name",
                    "startDate": "2026-12-15T17:00:00Z",
                    "endDate": "2026-12-15T17:00:00Z"
                }
            },
            {
                "key": "oldConfig",
                "type": "object",
                "description": "Details of the work reassignment configuration prior to this change.",
                "example": {}
            },
            {
                "key": "reassignedFromName",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example Name"
            },
            {
                "key": "reassignedToName",
                "type": "string",
                "description": "Referenced in the default email template.",
                "example": "Example Name"
            }
        ]
    }
};
