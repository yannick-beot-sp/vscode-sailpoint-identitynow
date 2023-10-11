00# Change Log

All notable changes to the "vscode-sailpoint-identitynow" extension will be documented in this file.

This changelog is following the recommended format by [keepachangelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

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

- Add supports for Service Desk Integrations (@fernando-delosrios-sp)

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
- Add the capacity to evaluate transforms [#7](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/7) thanks to @cristian-grau-sp

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