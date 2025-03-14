# Change Log

All notable changes to the "vscode-sailpoint-identitynow" extension will be documented in this file.

This changelog is following the recommended format by [keepachangelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Security

### Added

### Changed

### Fixed

### Removed

## [1.3.13] - 2025-03-14

### Added

- Add a new command to update the Time Check Configuration for Service Desk Integrations on the "Service Desk" node
- Add support for Connector Rule and Cloud Rule support (cf. [#104](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/104))

### Changed

- Add New icon for applications
- Can add several access profiles at once in an application
- Upgrade sailpoint-api-client dependency to 1.4.15
- Refactoring of access review reassignment

### Fixed

- Refresh of Access Profiles after adding applications
- Reassignment of access review to access owner was failing in case of self-reassignment
- Could not modify an app if an app was disabled in the request center

## [1.3.12] - 2025-02-12

### Changed

- When exporting form definitions, the property usedBy is emptied

### Fixed

- Typo in source reset information message (cf. [#105](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/105))
- Forms with same id between tenant was causing an error

## [1.3.11] - 2025-01-27

### Fixed

- During tenant creation, if the FQDN was not correctly entered, it generates an error. If the FQDN is not resolved, the error is not retryable. (cf. [#103](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/103))


## [1.3.10] - 2024-12-13

### Fixed

- Fix issue when enabling log

## [1.3.9] - 2024-12-07

### Fixed

- List all transforms instead of the first 250 (cf. [#96](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/96))
- Error thrown when workflows have the same id in 2 different tenants (cf. [#101](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/101))

## [1.3.8] - 2024-12-04

### Added

- Support of certifications with the help of [@mostafa-helmy-sp](https://github.com/mostafa-helmy-sp
) and [@bassem-mohamed-sp](https://github.com/bassem-mohamed-sp):
  - Dashboard
  - Esclation
  - Reminders
  - Report
  - Automatic reassignment to access item owners
  - Custom reassignment

### Changed

- Viewing a workflow does not bring statistics as this can cause timeouts.

### Fixed

- Fix axios-retry not working

## [1.3.7] - 2024-10-18

### Fixed

- Removed filtering on sources since CC API is decommissioned

## [1.3.6] - 2024-10-15

### Fixed

- Restore command to add new Search Attribute Configuration

## [1.3.5] - 2024-10-15

### Fixed

- Changed axios interceptor for better error management (cf. [#92](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/92))

## [1.3.4] - 2024-10-12

### Fixed

- Fix authentication provider multi account support (as part of [VSCode September's release](https://code.visualstudio.com/updates/v1_94#_change-an-extensions-account-preference)) (cf. [#94](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/94))

## [1.3.3] - 2024-10-09

### Security

- Fixed dependency (axios, micromatch)

### Added

- Add User Agent
- Add transform evaluation support for `decomposeDiacriticalMarks` (cf. [#90](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/90)) by [@Semperverus](https://github.com/Semperverus)
- Add new command to enable logging
- Add support for Applications

### Changed

- Refactored code due to [#36](https://github.com/sailpoint-oss/typescript-sdk/issues/36)

### Fixed

- Error with session management (cf. [#93](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/93))

### Removed

- Removed Workflow Tester view due to webview-ui-toolkit deprecation (cf. https://github.com/microsoft/vscode-webview-ui-toolkit/issues/561)

## [1.3.2] - 2024-07-03

### Added

- Added transforms "RFC5646" and "Display Name" (cf. [#87](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/87))
- Can create or delete an identity attribute (cf. [#83](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/83))

### Changed

- Updated schema for lifecycle state (`identityState`)
- Filtering server-side for uncorrelated accounts

### Fixed

- Add validation of read-only during SP-Config import
- Fixed issue during the account reset (cf. [#85](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/85))

## [1.3.1] - 2024-05-16

### Fixed

- 429 Too Many Requests error during export or import of roles and access profiles  (cf. [#82](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/82))

### Changed

- Role and Access Profile imports are now cancellable

## [1.3.0] - 2024-05-09

### Changed

- Update for source aggregation and reset to leverage beta endpoints instead of CC endpoints
- Automatically update workflow if its status is changed

### Added

- Add searching and viewing identities by [@henrique-quintino-sp](https://github.com/henrique-quintino-sp) (cf. [#74](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/74))
- Add attribute sync, process and delete command on identities by [@henrique-quintino-sp](https://github.com/henrique-quintino-sp) (cf. [#74](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/74))
- Lock tenant as read-only to prevent any change (cf. [#75](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/75) and [#81](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/81)))

### Fixed

- Fixed normalizeNames (cf. [#73](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/73))
- Fixed with generate digit token to use the username and not the account name
- Fixed case where a single entitlement or single access profiles is returned during role creation

## [1.2.0] - 2024-04-09

### Added

- Add new command to edit connector rule (Edit script)
- Changing IdentityNow to Identity Security Cloud/ISC
- Logging every call to ISC

### Fixed

- Catch error message if peek objects fails

## [1.1.0] - 2024-03-20

### Added

- Edit Password Org Config
- Generate a digit token for password reset

### Fixed

- 404 error when sources had '/' in their name (cf. [#71](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/71))

## [1.0.4] - 2024-03-06

### Fixed

- New attempt to publish extension
- Refactoring of IdentityNowTreeItem.ts and fixed refreshing issue with Workflows
- Non-matching schema for lifecycle states

## [1.0.3] - 2024-03-05

### Fixed

- Publication issue

## [1.0.2] - 2024-03-05

### Fixed

- Could not open Identity Attributes from several tenants (cf. [#69](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/69))

## [1.0.1] - 2024-03-05

### Fixed

- Transform not correctly saved (cf. [#68](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/68))

## [1.0.0] - 2024-03-04

### Added

- Import/Export entitlements for roles

## [0.0.30] - 2024-03-03

### Added

- Add support for Search attribute config (cf. [#64](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/64))
- Add support for Identity Attributes

## [0.0.29] - 2024-02-28

### Added

- Export/Import workflows (cf. [#57](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/57))
- Edit Public Identities Config
- Edit Access Request Configuration
- Can export everything with SP-Config (cf. [#56](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/56))
- Can select cloud rules for export with SP-Config
- Add IDENTITY_OBJECT_CONFIG as an importable object from SP-Config

### Fixed

- Display warning if file is too big (cf. [#66](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/66))

## [0.0.28] - 2024-02-16

### Added
- Add support for Forms
- Clone a source (cf. [#60](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/60))

## [0.0.27] - 2024-02-08

### Fixed

- Export of roles and access profiles without owner
- Fix pagination during export of roles and access

## [0.0.26] - 2024-02-06

### Added

- Add the command "Ping Cluster" on sources by [@henrique-quintino-sp](https://github.com/henrique-quintino-sp) (cf. [#61](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/61))

### Fixed
- Export of roles was failing due to 1-level Membership Criteria
- Pagination during export
- In some unknown condition, source may not have a name. In such case, the source is filtered

## [0.0.25] - 2023-11-22

### Added 

- Add test connection (cf. [#58](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/58))
- Add peek objects on a source (cf. [#59](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/59))

## [0.0.24] - 2023-11-19

### Added 

- View, edit, create, delete, export, import access profiles with the help of [@richastral](https://github.com/richastral) (cf. [#55](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/55))
- View, edit, create, delete, export, import roles with the help of [@richastral](https://github.com/richastral) (cf. [#55](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/55))

### Changed

- Upgrade sailpoint-api-client dependency
- Honor delimiter parameter for account export
- Add better error message when resetting a source fails (cf. [#54](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/54))

## [0.0.23] - 2023-10-11

### Fixed

- Issue when importing SP-Config: when selecting items, the list of object Ids was not properly sent
- Issue when refreshing identities of an identity profile  (cf. [#53](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/53))

## [0.0.22] - 2023-10-08

### Added 

- Provide the ability to create provisioning policy for something else than the CREATE policy (cf. [#29](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/29))

### Fixed

- Issue when creating a provisioning policy (cf. [#52](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/52))

## [0.0.21] - 2023-10-05

### Fixed
- Revert bundle (cf. [#51](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/51))

## [0.0.20] - 2023-10-05

### Changed

- Better error management for SPConfig import and object type displayed for import
- Remove dependency to client-oauth2, isomorphic-fetch, isomorphic-form-data
- Relies on axios and sailpoint-api-client wherever it is possible

### Fixed

- Issue with fetch (cf. [#50](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/50))
- Workflow icon not properly updated after enabling or disabling the workflow

## [0.0.19] - 2023-06-28

### Added 

- New command: Aggregation of entitlements
- Settings for export path, including SP Config
- New command: Export of accounts
- New command: Export of uncorrelated accounts
- New command: Export of entitlement details
- New command: Import of accounts
- New command: Import of uncorrelated accounts
- New command: Import of entitlement details

### Changed 

- Better error management of SPConfig Import and message info

### Fixed

- List transforms by name while exporting SP-Config

## [0.0.18] - 2023-02-15

### Fixed

- Export was not creating folders recursively
- Update schema for identity profiles, life cycle states, and provisioning policies
- Update regexp for tenant name for short names


## [0.0.17] - 2023-01-29

### Fixed

- Update length limit for connector rule names and provisioning policy name
- Update regexp for tenant name
- Fix TLS error when trying to get an access token

## [0.0.16] - 2022-12-22

### Added

- Capability to export a single source, rule, transform or identity profile from the tree view
- Capability to refine export from the command palette or from a tenant in the tree view
- Capability to import a sp-config
- Can refresh identities under an identity profile (cf. [#30](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/30))

### Fixed

- Fix error when exporting to file (cf. [#35](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/35))


## [0.0.15] - 2022-11-10

### Added

- Add supports for Service Desk Integrations ([@fernando-delosrios-sp](https://github.com/fernando-delosrios-sp))

### Fixed

- Fix supports of UTF-8 values in transform (cf. [#33](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/33))

## [0.0.14] - 2022-10-18

### Added

- Add 2 commands for sources: reset accounts and reset entitlements
- Add support for Identity Profiles

### Fixed

- Pagination for sources (cf. [#25](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/25))

## [0.0.13] - 2022-09-01

### Fixed

- Regression on transform evaluation (cf. [#20](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/20))

## [0.0.12] - 2022-07-03

### Added

- Possibility to add a tenant with an access token (cf. [#18](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/18))
- The extension have an URI handler (cf. [#17](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/17)). If a URL with the following format is called in the system, a tenant is added or updated: vscode://yannick-beot-sp.vscode-sailpoint-identitynow/addtenant?tenantName=XXX&accessToken=eyJh...&authenticationMethod=AccessToken

## [0.0.11] - 2022-06-29

### Added

- Can rename tenant display name (cf. [#12](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/12))

## [0.0.10] - 2022-06-27

### Fixed

- Release for documentation fix

## [0.0.9] - 2022-06-27

### Added

- Support for connector rules: creation, deletion, update, export, import

### Fixed

- Aggregation without optimization was not working properly

## [0.0.8] - 2022-05-19

### Added

- New transforms (E.164 Phone, Random Alphanumeric Random Numeric,  Replace All, Rule, UUID Generator), [#8](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/8)

### Fixed

- [#6](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/6) update regexp for transform names

## [0.0.7] - 2022-04/28

### Added
- Add step to creation of transform to have a non-empty file
- If only 1 tenant, automatically selected in the workflow tester
- Added refresh buttons in the view
- Add the capacity to evaluate transforms [#7](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/7) thanks to [@cristian-grau-sp](https://github.com/cristian-grau-sp)

## [0.0.6] - 2022-04-27

### Fixed

- Regexp for provisioning policy
- Issue #3 with new transform

## [0.0.5] - 2022-04-14

### Fixed

- Regexp for tenant, with or without domain
- Remove PAT when removing tenant

## [0.0.4] - 2022-04-14

### Fixed

- Regexp for client secret (63 or 64 characters)

## [0.0.3] - 2022-04-13

### Added

- Export of tenant config
- Add support for workflows:
  - View, edit workflows
  - Enable/Disable workflows
  - View execution history of a workflow
  - Test workflow

### Fixed

- Error during deletion of tenant
- Regexp for new schema name

## [0.0.2] - 2022-02-16

### Added

- Support for source schemas
- Support for provision policies
- Schema and snippets for source schemas
- Schema and snippets for provisioning policies
- Snippets for transforms

## [0.0.1] - 2022-02-03

### Added

- Add tenant with Personal Access Token (PAT) authentication
- Remove tenant
- Open Sources and Transforms
- Save Sources and Transforms
- Create Transform
- Remove Transform
