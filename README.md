# SailPoint Identity Security Cloud for Visual Studio Code

> This extension is not developed, maintained or supported by SailPoint.
> It is a community effort to help manage Identity Security Cloud from Visual Studio Code.

The SailPoint Identity Security Cloud extension makes it easy to:

- Connect to several tenants
- Import and export config of a tenant
- View, edit, aggregate, test, peek, ping, clone, or reset sources
- View, create, edit, delete, and test transforms
- View, create, edit, delete provisioning policies of a source
- View, create, edit, delete schemas of a source
- View, edit, enable, disable, export, import workflows and view execution history
- View, create, edit, delete connector rules and export/import the script of a rule
- View, edit, delete service desk integrations
- View, edit, delete identity profiles and lifecycle states, and refreshes all the identities under a profile
- Import/Export Accounts (import for delimited files only), uncorrelated accounts, entitlement details
- View, edit, create, delete, export, import access profiles
- View, edit, create, delete, export, import roles
- View, edit, create, delete, export, import forms
- View, edit, create, delete search attribute config
- View, edit, create, delete identity attribute
- View, trigger attribute sync or process, delete identities
- View, edit, create, delete applications
- View, report, escalate, send reminders, reassign to access item owners or reassign based on a file, approve in bulk certification campaigns

## Installation

Go to the extension menu or press `Ctrl`+`Shift`+`X` and look for the extension "Identity Security Cloud". Click on the button `Install`.

The VSIX can be installed from the extension menu. Press `Ctrl`+`Shift`+`X` and in the menu, click `Install from VSIX...`.

## Add new tenant

The extension supports several tenants.

Open the **Command Palette** with `Ctrl+Shift+P` (Windows or Linux) or `Cmd+Shift+P` (macOS) to find the command "ISC: Add tenant...".

Alternatively, you can click on the `+` in the SailPoint view.

You can add a tenant by using a Personal Access Token (PAT) or by using a short-lived access token (like one you can get from https://yourtenant.identitynow.com/ui/session).

![Add tenant](https://raw.githubusercontent.com/yannick-beot-sp/vscode-sailpoint-identitynow/main/resources/readme/add-tenant.gif)

It is also possible to add a tenant by using the following URIs:
`vscode://yannick-beot-sp.vscode-sailpoint-identitynow/addtenant?tenantName=company&accessToken=eyJh...&authenticationMethod=AccessToken` or
`vscode://yannick-beot-sp.vscode-sailpoint-identitynow/addtenant?tenantName=company&clientId=806c451e057b442ba67b5d459716e97a&clientSecret=***&authenticationMethod=PersonalAccessToken`.

## Import and export the config of a tenant

In the **SailPoint view**, right-click on a tenant to import or export config.

![Import/export config](https://raw.githubusercontent.com/yannick-beot-sp/vscode-sailpoint-identitynow/main/resources/readme/import-export-treeview.png)

You can also export a single source, rule, identity profile or transform by right-clicking it and choosing "Export sp-config...".

![Import/export config](https://raw.githubusercontent.com/yannick-beot-sp/vscode-sailpoint-identitynow/main/resources/readme/export-node.png)

Or, from the **Command Palette**, find the command "ISC: Import config..." or "ISC: Export config...".

![Import/export config](https://raw.githubusercontent.com/yannick-beot-sp/vscode-sailpoint-identitynow/main/resources/readme/import-export-palette.png)

![Export config](https://raw.githubusercontent.com/yannick-beot-sp/vscode-sailpoint-identitynow/main/resources/readme/export-config.gif)

Finally, you can right-click a JSON file in the explorer to import it.

![Import/export config](https://raw.githubusercontent.com/yannick-beot-sp/vscode-sailpoint-identitynow/main/resources/readme/import-file.png)

## Rule management

The extension allows you to manage rules and upload the script to a new or existing rule:

![Export config](https://raw.githubusercontent.com/yannick-beot-sp/vscode-sailpoint-identitynow/main/resources/readme/rules-management.gif)

## Workflow management

Export and Import workflows automatically:

- Remove the properties `created`, `creator`, `modified`, `modifiedBy`, and `owner`
- Nullify any value that starts with `$.secrets.`

The extension allows you to test the workflow:

![Export config](https://raw.githubusercontent.com/yannick-beot-sp/vscode-sailpoint-identitynow/main/resources/readme/test-workflow.gif)

## Snippets

![Snippets for transforms](https://raw.githubusercontent.com/yannick-beot-sp/vscode-sailpoint-identitynow/main/resources/readme/snippet-transforms.gif)

### Transforms

This extension includes the following snippets for transforms:

| Trigger            | Content                          |
| ------------------ | -------------------------------- |
| `tr-acc`           | Account Attribute                |
| `tr-b64-dec`       | Base64 Decode                    |
| `tr-b64-enc`       | Base64 Encode                    |
| `tr-concat`        | Concatenation                    |
| `tr-cond`          | Conditional                      |
| `tr-date-comp`     | Date Compare                     |
| `tr-date-format`   | Date Format                      |
| `tr-date-math`     | Date Math                        |
| `tr-diacritic`     | Decompose Diacritial Marks       |
| `tr-phone`         | E164 Phone                       |
| `tr-first`         | First Valid                      |
| `tr-rand-string`   | Generate Random String           |
| `tr-end`           | Get End of String                |
| `tr-refattr`       | Get Reference Identity Attribute |
| `tr-id`            | Identity Attribute               |
| `tr-indexof`       | Index Of                         |
| `tr-iso3166`       | ISO3166                          |
| `tr-last-index`    | Last Index Of                    |
| `tr-leftpad`       | Left Pad                         |
| `tr-lookup`        | Lookup                           |
| `tr-lower`         | Lower                            |
| `tr-norm`          | Name Normalizer                  |
| `tr-rand-alphanum` | Random Alphanumeric              |
| `tr-rand-num`      | Random Numeric                   |
| `tr-ref`           | Reference                        |
| `tr-replace`       | Replace                          |
| `tr-replace-all`   | Replace All                      |
| `tr-rightpad`      | Right Pad                        |
| `tr-rule`          | Rule                             |
| `tr-split`         | Split                            |
| `tr-static`        | Static                           |
| `tr-sub`           | Substring                        |
| `tr-trim`          | Trim                             |
| `tr-upper`         | Upper                            |
| `tr-uuid`          | UUID Generator                   |

### Schema

This extension includes the following snippets for schemas:

| Trigger         | Content             |
| --------------- | ------------------- |
| `New schema`    | Create a new schema |
| `New attribute` | Add new attribute   |

### Provisioning Policies

This extension includes the following snippets for schemas:

| Trigger                   | Content                          |
| ------------------------- | -------------------------------- |
| `New provisioning policy` | Create a new provisioning policy |
| `New field`               | Create a new field               |

### Forms

This extension includes the following snippets for forms:

| Trigger          | Content                 |
| ---------------- | ----------------------- |
| `New Form Input` | Create a new form input |

### Public Identities Configuration

This extension includes the following snippets for the Public Identities Configuration:

| Trigger                  | Content                                 |
| ------------------------ | --------------------------------------- |
| `New identity attribute` | Create a new identity attribute mapping |

## Import format

### Access Profiles

The following table provides the expected column for the CSV to import Access Profiles:

| Header                   | M[*] | Description                                                                                                                 | Default Value      |
| ------------------------ | ---- | --------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `name`                   | Yes  | Name of the access profile                                                                                                  |                    |
| `owner`                  | Yes  | Owner of the access profile                                                                                                 |                    |
| `source`                 | Yes  | Source associated with the access profile                                                                                   |                    |
| `description`            | No   | Description of the access profile                                                                                           | `null`             |
| `enabled`                | No   | Is the access profile enabled?                                                                                              | `false`            |
| `requestable`            | No   | Is the access profile requestable?                                                                                          | `false`            |
| `commentsRequired`       | No   | Require comments when the user requests access                                                                              | `false`            |
| `denialCommentsRequired` | No   | Require comments when a reviewer denies the request                                                                         | `false`            |
| `approvalSchemes`        | No   | List of reviewers among `APP_OWNER`, `OWNER`, `SOURCE_OWNER`, `MANAGER`, or the name of the governance group separated by ; | `[]` (No approval) |
| `revokeApprovalSchemes`  | No   | List of reviewers among `APP_OWNER`, `OWNER`, `SOURCE_OWNER`, `MANAGER`, or the name of the governance group separated by ; | `[]` (No approval) |
| `entitlements`           | No   | Entitlements of the access profile                                                                                          | `[]`               |

[*]: ## "Mandatory"

### Roles

The following table provides the expected column for the CSV to import Roles:

| Header                         | M[*] | Description                                                                                    | Default Value      |
| ------------------------------ | ---- | ---------------------------------------------------------------------------------------------- | ------------------ |
| `name`                         | Yes  | Name of the role                                                                               |                    |
| `owner`                        | Yes  | Owner of the role                                                                              |                    |
| `description`                  | No   | Description of the role                                                                        | `null`             |
| `enabled`                      | No   | Is the role enabled?                                                                           | `false`            |
| `requestable`                  | No   | Is the role requestable?                                                                       | `false`            |
| `commentsRequired`             | No   | Require comments when the user requests access                                                 | `false`            |
| `denialCommentsRequired`       | No   | Require comments when a reviewer denies the request                                            | `false`            |
| `approvalSchemes`              | No   | List of reviewers among `OWNER`, `MANAGER`, or the name of the governance group separated by ; | `[]` (No approval) |
| `revokeCommentsRequired`       | No   | Require comments when the user requests revocation                                             | `false`            |
| `revokeDenialCommentsRequired` | No   | Require comments when a reviewer denies the revocation request                                 | `false`            |
| `revokeApprovalSchemes`        | No   | List of reviewers among `OWNER`, `MANAGER`, or the name of the governance group separated by ; | `[]` (No approval) |
| `accessProfiles`               | No   | List of access profiles                                                                        | `[]`               |
| `membershipCriteria`           | No   | Membership criteria for automatic assignment                                                   |                    |

#### Membership criteria

`membershipCriteria` follows _kind of_ SCIM filters

##### Attributes

There are 3 kind of attributes:

- **Identity Attribute**: the format is `identity.{attribute name}`. Ex: `identity.cloudLifecycleState`, `identity.type`, etc.
- **Account Attribute**: the format is `{source name}.attribute.{attribute name}`. If the source name contains space, the source name must be put between quotes or double-quotes
- **Entitlements**: the format is `{source name}.entitlement.{attribute name}`. If the source name contains space, the source name must be put between quotes or double-quotes

##### Attribute operators

| Operator | Description |
| -------- | ----------- |
| eq       | equals      |
| ne       | not equals  |
| co       | contains    |
| sw       | starts with |
| ew       | ends with   |

##### Logical operators

| Operator | Description   |
| -------- | ------------- |
| and      | Logical "and" |
| or       | Logical "or"  |

##### Values

Values must be within `"` or `'`.

##### Grouping

Expressions can be grouped by using parenthesis.
Parenthesis are mandatory for 3-level expression but are optional otherwise.

##### Examples

Here are a few examples extracted from the unit tests:

```
identity.department eq 'Customer Service' and identity.cloudLifecycleState eq 'active'
'Active Directory'.entitlement.memberOf eq 'CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com' and 'Active Directory'.attribute.departmentNumber eq '1234'
(identity.department eq 'Customer Service' and identity.cloudLifecycleState eq 'active') or (identity.cloudLifecycleState eq 'active' and identity.jobTitle co 'Accounts Payable Analyst')
```

### Certification Campaign Custom Reviewers

The following table provides the expected column for the CSV to import Custom Reviewer logic:

| Header              | M[*] | Description                                                                                           | Supported Values                              |
| ------------------- | ---- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `reviewerAttribute` | Yes  | Identity attribute used to identify the defined reviewer                                              | `id\|name\|email`                             |
| `reviewerValue`     | Yes  | The value of identity attribute for the defined reviewer (e.g. the email address of the reviewer)     |                                               |
| `itemType`          | Yes  | The type of object to scope the reviewer's review items                                               | `IDENTITY\|ENTITLEMENT\|ACCESS_PROFILE\|ROLE\|ALL` |
| `itemSelectorType`  | Yes, unless itemType=ALL | The type of selector used to define the reviewer's scope                                              | `id\|name\|query\|all`[**]                         |
| `itemSelectorValue` | Yes, unless itemType=ALL or itemSelectorType=all | The value of the selector used to define the reviewer's scope (e.g. a valid entitlement Search Query) |                                               |

[**]: ## "`itemSelectorType=name` is not supported with `itemType=ENTITLEMENT`"

#### Examples

Here are a few valid examples:

```
reviewerAttribute,reviewerValue,itemType,itemSelectorType,itemSelectorValue
id,8e5c35894e124e81859f59030f3c4d56,IDENTITY,id,8e5c358d7a124e81859f59030f3c67ae
name,Adam.Kennedy,IDENTITY,query,"attributes.department:""Asset Management"""
email,Alan.Bandero@sailpointdemo.com,ENTITLEMENT,query,"source.name:""Active Directory"" AND privileged:true"
name,Aaron.Nichols,ACCESS_PROFILE,name,"Accounts Payable Access"
email,Anne.Arnold@sailpointdemo.com,ROLE,query,*
email,Anne.Arnold@sailpointdemo.com,ENTITLEMENT,all,
email,Anne.Arnold@sailpointdemo.com,ALL,,
```

### Certification Campaign Report

The report provides a detailed overview of user access rights, including roles, access profiles, and entitlements. Auditors gain a comprehensive understanding of who has access to critical systems and data, enabling them to assess compliance with regulatory requirements and internal policies.

below are the campaign report headers:

```
"Campaign Name","Reviewer Name","Reviewer Email","Identity Name","Review Completed","Review Item ID","Item Review Completed","New Access","Reviewer Decision","Reviewer Comments","Access Type","Role Name","Role Description","Access Profile Name","Access Profile Description","Access Profile Privileged","Entitlement Name","Entitlement Description","Entitlement Privileged","Entitlement Attribute Value","Entitlement Source Schema Object Type","Entitlement Source Name","Entitlement Account Native ID","Entitlement Account Name"
```

You need to configure the path where the report will be exported

### Send Reminder Notification To Reviewers

Copy this below Workflow JSON to a file and save it as `.json` file like: `SendReminderNotificationToReviewersWorkflow.json`

```
{
	"name": "Sends Reminder Notification To Reviewers",
	"description": "Sends Reminder Notification To Reviewers With Pending Items",
	"modified": "2024-11-20T13:05:27.631277905Z",
	"definition": {
		"start": "Send Email",
		"steps": {
			"End Step - Success": {
				"displayName": "End",
				"type": "success"
			},
			"Send Email": {
				"actionId": "sp:send-email",
				"attributes": {
					"body": "<p>Dear {{$.trigger.input.reviewerName}},</p>\n<p>This is a reminder that you have pending certification items requiring your action in the <strong>{{$.trigger.input.campaignName}}</strong> certification campaign.</p>\n<p>Here are your current review progress details:</p>\n<ul>\n<li><strong>Pending Items: </strong>{{$.trigger.input.pendingItems<br>}}</li>\n<li><strong>Pending Identities</strong>: {{$.trigger.input.pendingIdentities}}</li>\n<li><strong>Completed Decisions</strong>: {{$.trigger.input.completedDecisions}}&nbsp;</li>\n<li><strong>Completed Identities</strong>: {{$.trigger.input.completedIdentities}}</li>\n</ul>\n<p>Please note that the due date for completing your reviews is <strong>{{$.trigger.input.dueDate}}</strong>.</p>\n<p>To avoid delays and escalations, Please&nbsp;complete your remaining reviews.</p>\n<p>If you have any questions or need assistance, feel free to contact us.</p>\n<p>Thank you,<br>The Certification Review Team</p>",
					"context": null,
					"from": "",
					"fromEmail": "reviews@company.com",
					"recipientEmailList.$": "$.trigger.input.reviewerEmail",
					"recipientEmails": "$.trigger.reviewerEmail",
					"subject": "Action Required: Pending Items in {{$.trigger.input.campaignName}} Certification"
				},
				"displayName": "Send Reminder Notification",
				"nextStep": "End Step - Success",
				"type": "action",
				"versionNumber": 2
			}
		}
	},
	"trigger": {
		"type": "EXTERNAL",
		"attributes": {
			"clientId": "948fca73-4169-45c5-bbe1-06fc1f2b0a43",
			"url": "/beta/workflows/execute/external/d2062dca-14ac-461d-94bc-daaf25af799c"
		}
	}
}
```

- Login to your ISC tenant as an Admin
- Navigate to Admin -> Workflows -> New Workflow -> Upload File
- Upload the workflow JSON file, then click on "Continue to Build"
- In the builder click on External Trigger node -> + New Access Token
- Save the client ID, client secret as you will need them to later in the SailPoint ISC extension
- Click on the "Send Reminder Notification" node to update the notification template.
- Save the workflow and enable it

The external JSON trigger is:

```
{
  input:
    {
      reviewerName: reviewerName,
      reviewerId: reviewerId,
      reviewerEmail: reviewerEmail,
      campaignName: campaignName,
      completedDecisions: completedDecisions,
      totalDecisions: totalDecisions,
      pendingItems: pendingItems,
      completedIdentities: completedIdentities,
      totalIdentities: totalIdentities,
      pendingIdentities: pendingIdentities,
      dueDate: certificationDueDate
    }
}
```

## Extension Settings

The extension supports the following settings:

- `vscode-sailpoint-identitynow.report.accessProfiles.filename`: Define the pattern for the folder to export access profiles.
  - Default value: `%x/reports/%T-AccessProfiles-%y%M%d-%h%m%s.csv`
- `vscode-sailpoint-identitynow.report.accounts.filename`: Define the pattern for the folder to export accounts.
  - Default value: `%x/reports/%T-%S-Accounts-%y%M%d-%h%m%s.csv`
- `vscode-sailpoint-identitynow.report.uncorrelatedAccounts.filename`: Define the pattern for the folder to export uncorrelated accounts.
  - Default value: `%x/reports/%T-%S-Uncorrelated-Accounts-%y%M%d-%h%m%s.csv`
- `vscode-sailpoint-identitynow.report.entitlements.filename`: Define the pattern for the folder to export entitlement details.
  - Default value: `%x/reports/%T-%S-Entitlements-%y%M%d-%h%m%s.csv`
- `vscode-sailpoint-identitynow.report.roles.filename`: Define the pattern for the folder to export roles.
  - Default value: `%x/reports/%T-Roles-%y%M%d-%h%m%s.csv`
- `vscode-sailpoint-identitynow.sP-Config.singleResource.filename`: Define the pattern for the SP-Config file of a single resource (Source, Identity Profile, Connector Rule, or Transform).
  - Default value: `%x/exportedObjects/identitynowconfig-%t-%S-%y%M%d-%h%m%s.json`
- `vscode-sailpoint-identitynow.sP-Config.singleFile.filename`: Define the pattern for the SP-Config file as a single file for multiple resources
  - Default value: `%x/exportedObjects/identitynowconfig-%t-%y%M%d-%h%m%s.json`
- `vscode-sailpoint-identitynow.sP-Config.multipleFiles.folder`: Define the pattern for the SP-Config folder as multiple files for multiple resources. This folder is proposed.
  - Default value: `%x/exportedObjects`
- `vscode-sailpoint-identitynow.sP-Config.multipleFiles.filename`: Define the pattern for the SP-Config filename as multiple files for multiple resources. It will be concatenated to the export folder. These filenames are not confirmed.
  - Default value: `%o/%S.json`
- `vscode-sailpoint-identitynow.export.forms.filename`: Define the pattern to export forms from a tenant
  - Default value: `%x/Forms/Forms-%t-%y%M%d-%h%m%s.json`
- `vscode-sailpoint-identitynow.export.form.filename`: Define the pattern to export a single form from a tenant
  - Default value: `%x/Forms/Form-%t-%S-%y%M%d-%h%m%s.json`
- `vscode-sailpoint-identitynow.export.workflow.filename`: Define the pattern to export a single workflow from a tenant
  - Default value: `%x/Workflows/Workflow-%t-%S-%y%M%d-%h%m%s.json`
- `vscode-sailpoint-identitynow.treeView.pagination`: Define the number of roles and access profiles that are displayed in the tree view
  - Default value: 100
- `vscode-sailpoint-identitynow.report.campaigns.filename`: Define the pattern for the folder to export access profiles.

  - Default value: `%x/reports/%T-Campaign-%S-%y%M%d-%h%m%s.csv`
    The patterns defined above use the following tokens:

- `%u`: User Home Dir
- `%w`: Workspace folder
- `%x`: Either workspace folder if defined, or home dir
- `%d`: Day
- `%M`: Month
- `%y`: Year
- `%h`: Hour
- `%m`: Minute
- `%s`: Second
- `%t`: Tenant name
- `%T`: Tenant display name
- `%o`: Object type
- `%S`: Source name for source-based report or object name

## Release Notes

### 1.3.18

- Updated the SailPoint SDK (sailpoint-api-client) from v1.4.15 to v1.6.2 by [@mostafa-helmy-sp](https://github.com/mostafa-helmy-sp) (cf. [#118](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/118))
- Updated certification campaign commands to use V2025 APIs by [@mostafa-helmy-sp](https://github.com/mostafa-helmy-sp) (cf. [#118](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/118))
- Add status in the list of workflow executions
- Add logger class for SAP HR
- Issue with duplicate review summaries when reassigning to access owners by [@mostafa-helmy-sp](https://github.com/mostafa-helmy-sp) (cf. [#118](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/118)) (SAASTRIAGE-7886)
- Fix path matching for identities that prevented from saving public identities config

### Fixed

- Issue with duplicate review summaries when reassigning to access owners by [@mostafa-helmy-sp](https://github.com/mostafa-helmy-sp) (cf. [#118](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/118)) (SAASTRIAGE-7886)
- Fix path matching for identities that prevented from saving public identities config

### 1.3.17

- New command to import account without optimization
- Remove aggregation commands from delimited files

### 1.3.16

- Issue when policy provisioning name is empty (cf. [#113](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/113)).
- Can choose forms to export or import
- Support bulk approval in certification campaign by [@mostafa-helmy-sp](https://github.com/mostafa-helmy-sp) (cf. [#115](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/115))
- Enhance performance and progress report for certification reassignment (owner and custom) by [@mostafa-helmy-sp](https://github.com/mostafa-helmy-sp) (cf. [#115](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/115))

### 1.3.15

- Can upload entitlements for a Delimited file
- Can upload a configuration to Configuration Hub
- Support for folders in the tree view
- Add external API: other extension can call a predefined set of method

### 1.3.14

- When exporting roles through SP-Config, it's possible to choose which selectively.
- Allow number in schema name
- Issue with special characters when exporting config to multiple files (cf. [#108](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/108))

### 1.3.13

- Add a new command to update the Time Check Configuration for Service Desk Integrations on the "Service Desk" node
- Add support for Connector Rule and Cloud Rule support (cf. [#104](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/104))
- Add new icon for applications
- Can add several access profiles at once in an application
- Upgrade sailpoint-api-client dependency to 1.4.15
- Refactoring of access review reassignment
- Refresh of Access Profiles after adding applications
- Reassignment of access review to access owner was failing in case of self-reassignment
- Could not modify an app if an app was disabled in the request center

### 1.3.12

- Typo in source reset information message (cf. [#105](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/105))
- When exporting form definitions, the property usedBy is emptied
- Forms with same id between tenant was causing an error

### 1.3.11

- During tenant creation, if the FQDN was not correctly entered, it generates an error. If the FQDN is not resolved, the error is not retryable. (cf. [#103](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/103))

### 1.3.10

- Fix issue when enabling log

### 1.3.9

- List all transforms instead of the first 250 (cf. [#96](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/96))
- Error thrown when workflows have the same id in 2 different tenants (cf. [#101](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/101))

### 1.3.8

- Viewing a workflow does not bring statistics as this can cause timeouts.
- Support of certifications with the help of [@mostafa-helmy-sp](https://github.com/mostafa-helmy-sp
) and [@bassem-mohamed-sp](https://github.com/bassem-mohamed-sp):
  - Dashboard
  - Escalation
  - Reminders
  - Report
  - Automatic reassignment to access item owners
  - Custom reassignment
- Fix axios-retry not working

### 1.3.7

- Removed filtering on sources since CC API is decommissioned

### 1.3.6

- Restore command to add new Search Attribute Configuration

### 1.3.5

- Changed axios interceptor for better error management (cf. [#92](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/92))

### 1.3.4

- Fix authentication provider multi account support (as part of [VSCode September's release](https://code.visualstudio.com/updates/v1_94#_change-an-extensions-account-preference)) (cf. [#94](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/94))

### 1.3.3

- Add User Agent
- Add transform evaluation support for `decomposeDiacriticalMarks` (cf. [#90](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/90)) by [@Semperverus](https://github.com/Semperverus)
- Add new command to enable logging
- Fixed dependency (axios, micromatch)
- Refactored code due to [#36](https://github.com/sailpoint-oss/typescript-sdk/issues/36)
- Removed Workflow Tester view due to webview-ui-toolkit deprecation (cf. https://github.com/microsoft/vscode-webview-ui-toolkit/issues/561)
- Add support for Applications
- Error with session management (cf. [#93](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/93))

### 1.3.2

- Updated schema for lifecycle state (`identityState`)
- Filtering server-side for uncorrelated accounts
- Added transforms "RFC5646" and "Display Name" (cf. [#87](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/87))
- Add validation of read-only during SP-Config import
- Can create or delete an identity attribute (cf. [#83](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/83))
- Fixed issue during the account reset (cf. [#85](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/85))

### 1.3.1

- 429 Too Many Requests error during export or import of roles and access profiles (cf. [#82](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/82))
- Role and Access Profile imports are now cancellable

### 1.3.0

- Update for source aggregation and reset to leverage beta endpoints instead of CC endpoints
- Add searching and viewing identities by [@henrique-quintino-sp](https://github.com/henrique-quintino-sp) (cf. [#74](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/74))
- Add attribute sync, process and delete command on identities by [@henrique-quintino-sp](https://github.com/henrique-quintino-sp) (cf. [#74](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/74))
- Fixed normalizeNames (cf. [#73](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/73))
- Lock tenant as read-only to prevent any change (cf. [#75](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/75) and [#81](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/81))
- Fixed with generate digit token to use the username and not the account name
- Automatically update workflow if its status is changed
- Fixed case where a single entitlement or single access profiles is returned during role creation

### 1.2.0

- Add new command to edit connector rule (Edit script)
- Changing IdentityNow to Identity Security Cloud/ISC
- Logging every call to ISC
- Catch error message if peek objects fails

### 1.1.0

- Edit Password Org Config
- Generate a digit token for password reset
- 404 error when sources had '/' in their name (cf. [#71](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/71))

### 1.0.4

- New attempt to publish extension
- Refactoring of IdentityNowTreeItem.ts and fixed refreshing issue with Workflows
- Non-matching schema for lifecycle states

### 1.0.3

- Publication issue

### 1.0.2

- Could not open Identity Attributes from several tenants (cf. [#69](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/69))

### 1.0.1

- Transform not correctly saved (cf. [#68](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/68))

### 1.0.0

- Import/Export entitlements for roles

### 0.0.30

- Add support for Search attribute config (cf. [#64](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/64))
- Add support for Identity Attributes

### 0.0.29

- Display warning if file is too big (cf. [#66](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/66))
- Export/Import workflows (cf. [#57](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/57))
- Edit Public Identities Config
- Edit Access Request Configuration
- Can export everything with SP-Config (cf. [#56](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/56))
- Can select cloud rules for export with SP-Config
- Add IDENTITY_OBJECT_CONFIG as an importable object from SP-Config

### 0.0.28

- Add support for Forms
- Clone a source (cf. [#60](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/60))

### 0.0.27

- Export of roles and access profiles without owner
- Fix pagination during export of roles and access

### 0.0.26

- Add the command "Ping Cluster" on sources by [@henrique-quintino-sp](https://github.com/henrique-quintino-sp) (cf. [#61](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/61))
- Export of roles was failing due to 1-level Membership Criteria
- Pagination during export
- In some unknown condition, source may not have a name. In such case, the source is filtered

### 0.0.25

- Add test connection (cf. [#58](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/58))
- Add peek objects on a source (cf. [#59](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/59))

### 0.0.24

- View, edit, create, delete, export, import access profiles with the help of [@richastral](https://github.com/richastral) (cf. [#55](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/55))
- View, edit, create, delete, export, import roles with the help of [@richastral](https://github.com/richastral) (cf. [#55](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/55))
- Upgrade sailpoint-api-client dependency
- Honor delimiter parameter for account export
- Add better error message when resetting a source fails (cf. [#54](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/54))

### 0.0.23

- Issue when importing SP-Config: when selecting items, the list of object Ids was not properly sent
- Issue when refreshing identities of an identity profile (cf. [#53](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/53))

### 0.0.22

- Provide the ability to create provisioning policy for something else than the CREATE policy (cf. [#29](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/29))
- Issue when creating a provisioning policy (cf. [#52](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/52))

### 0.0.21

- Revert bundle (cf. [#51](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/51))

### 0.0.20

- Issue with fetch (cf. [#50](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/50))
- Remove dependency to client-oauth2, isomorphic-fetch, isomorphic-form-data
- Relies on axios and sailpoint-api-client wherever it is possible
- Better error management for SPConfig import and object type displayed for import
- Workflow icon not properly updated after enabling or disabling the workflow

### 0.0.19

- New command: Aggregation of entitlements
- Settings for export path, including SP Config
- New command: Export of accounts
- New command: Export of uncorrelated accounts
- New command: Export of entitlement details
- New command: Import of accounts
- New command: Import of uncorrelated accounts
- New command: Import of entitlement details
- Better error management of SPConfig Import and message info
- List transforms by name while exporting SP-Config

### 0.0.18

- Export was not creating folders recursively
- Update schema for identity profiles, life cycle states, and provisioning policies
- Update regexp for tenant name for short names

### 0.0.17

- Update length limit for connector rule names and provisioning policy name
- Update regexp for tenant name
- Fix TLS error when trying to get an access token

### 0.0.16

Almost Christmas!

- Capability to export a single source, rule, transform or identity profile from the tree view
- Capability to refine export from the command palette or from a tenant in the tree view
- Capability to import a sp-config
- Can refresh identities under an identity profile (cf. [#30](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/30))
- Fix error when exporting to file (cf. [#35](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/35))

### 0.0.15

- Add supports for Service Desk Integrations ([@fernando-delosrios-sp](https://github.com/fernando-delosrios-sp))
- Fix supports of UTF-8 values in transform (cf. [#33](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/33))

### 0.0.14

- Add 2 commands for sources: reset accounts and reset entitlements
- Add support for Identity Profiles
- Pagination for sources (cf. [#25](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/25))

### 0.0.13

- Regression on transform evaluation (cf. [#20](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/20))

### 0.0.12

- Possibility to add a tenant with an access token (cf. [#18](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/18))
- The extension have an URI handler (cf. [#17](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/17)). If a URL with the following format is called in the system, a tenant is added or updated: vscode://yannick-beot-sp.vscode-sailpoint-identitynow/addtenant?tenantName=XXX&accessToken=eyJh...&authenticationMethod=AccessToken

### 0.0.11

- Can rename tenant display name (cf. [#12](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/12))

### 0.0.9

- Support for connector rules: creation, deletion, update, export, import
- Aggregation without optimization was not working properly

### 0.0.8

Transforms for ever!

- New transforms (E.164 Phone, Random Alphanumeric Random Numeric, Replace All, Rule, UUID Generator), cf. [#8](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/8)
- [#6](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/6) update regexp for transform names

### 0.0.7

Transforms are the best!

Added:

- Add step to creation of transform to have a non-empty file
- If only 1 tenant, automatically selected in the workflow tester
- Added refresh buttons in the view
- Add the capacity to evaluate transforms [#7](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/7) thanks to [@cristian-grau-sp](https://github.com/cristian-grau-sp)

### 0.0.6

Fixed:

- Regexp for provisioning policy
- Issue #3 with new transform

### 0.0.5

Fixed:

- Regexp for tenant, with or without domain
- Remove PAT when removing tenant

### 0.0.4

- Fix regexp for PAT secret

### 0.0.3

Workflows for ever!

- Export of tenant config
- Add support for workflows
- Add workflow tester

### 0.0.2

Let's make transform great again!

- Add support for source schemas
- Add support for provision policies
- Add schema and snippets for source schemas
- Add schema and snippets for provisioning policies
- Add snippets for transforms

### 0.0.1

Initial internal release

- Add tenant with Personal Access Token (PAT) authentication
- Remove tenant
- Open Sources and Transforms
- Save Sources and Transforms
- Create Transform
- Remove Transform
