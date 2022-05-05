# Change Log

All notable changes to the "vscode-sailpoint-identitynow" extension will be documented in this file.

This changelog is following the recommended format by [keepachangelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Fixed
- #6 update regexp for transform names

## [0.0.7] - 2022/04/28
### Added
- Add step to creation of transform to have a non-empty file
- If only 1 tenant, automatically selected in the workflow tester
- Added refresh buttons in the view
- Add the capacity to evaluate transforms [#7](https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/pull/7)

## [0.0.6] - 2022/04/27
### Fixed
- Regexp for provisioning policy
- Issue #3 with new transform

## [0.0.5] - 2022/04/14
### Fixed
- Regexp for tenant, with or without domain
- Remove PAT when removing tenant

## [0.0.4] - 2022/04/14

### Fixed
- Regexp for client secret (63 or 64 characters)

## [0.0.3] - 2022/04/13
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

## [0.0.2] - 2022/02/16
### Added
- Support for source schemas
- Support for provision policies
- Schema and snippets for source schemas
- Schema and snippets for provisioning policies
- Snippets for transforms

## [0.0.1] - 2022/02/03
### Added
- Add tenant with Personal Access Token (PAT) authentication
- Remove tenant
- Open Sources and Transforms
- Save Sources and Transforms
- Create Transform
- Remove Transform