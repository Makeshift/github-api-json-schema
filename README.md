# github-api-json-schema

Converts operations within GitHub's [OpenAPI spec](https://github.com/github/rest-api-description/) to JSON schemas.

Schemas are automatically re-generated every Tuesday via GitHub Actions.

## [Link to Generated Schemas](https://makeshift.github.io/github-api-json-schema/)

## Repository Settings App

The [Repository Settings App](https://github.com/repository-settings/app) uses a file placed in `.github/settings.yml` to configure a repository. This repo came about because I thought it would be nice to have JSON schema validation for this file.

This schema is not automatically kept up-to-date with changes to the Repository Settings application.

You can find the rendered schema [here](https://makeshift.github.io/github-api-json-schema/repository-settings.json).

To use it with a tool that supports validating against a remote schema (like Red Hat's [YAML Extension for VSCode](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)), add the following to the top of your `.github/settings.yml` file:

```yaml
# yaml-language-server: $schema=https://makeshift.github.io/github-api-json-schema/repository-settings.json
```
