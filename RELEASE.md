= Release

This document presents the release process, just to not forget.

== Checklist

- [ ] Update README.md
- [ ] Update CHANGELOG.md

== Publish in the marketplace and GitHub Release

When a tag with the format "releases/*v0.0.3*" is created:
- The VSIX package is automatically created
- The package is published in the marketplace
- A release is created


To create the tag:

```
git tag releases/v0.0.3
git push origin --tags
```