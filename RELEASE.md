= Release

This document presents the release process, just to not forget.

== Checklist

- [ ] Update `README.md`
- [ ] Update `CHANGELOG.md`
- [ ] Update version in `package.json`
- [ ] Update Discuss page: https://developer.sailpoint.com/discuss/t/identitynow-extensions-for-visual-studio-code/5983/2

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

== Remove a tag locally and remotely

```
git tag -d releases/v0.0.3
git push --delete origin releases/v0.0.3
```