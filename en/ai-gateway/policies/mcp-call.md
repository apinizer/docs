---
title: "MCP Call"
description: "Calls a preselected MCP tool on every matching request and does not leave tool selection to the model"
---

:::tip

This document describes the detailed usage of a specific policy. If you are using the Apinizer policy structure for the first time or want to learn how policies work, read [What is Policy?](/en/concepts/core-concepts/what-is-policy) first.

:::

## Overview

### What is its Purpose?

- Calls the MCP tool selected by the administrator on every matching request.
- Does not leave tool selection to the LLM.
- Resolves the argument template, validates constraints, and then invokes the tool.

### Working Principle

1. The policy connects to the MCP server endpoint.
2. Capability discovery returns the tool catalog.
3. `targetToolName` is selected as the fixed target.
4. `argumentsTemplate` is resolved into JSON arguments.
5. Argument constraints are validated and the tool is called.

## Features and Capabilities

### Basic Features

- **Fixed tool:** `targetToolName` is required on the Fixed variant.
- **Argument template:** Must produce valid JSON after variables are resolved.
- **Constraints:** REQUIRED, REGEX, ENUM, and MAX_LENGTH can be applied.
- **Fail-closed:** An empty discovery result or allow-list does not make every tool available.

### Advanced Features

- **Connection:** Endpoint and transport must match the MCP server. Authentication, mTLS, and private egress are configured for the target environment.
- **Cache:** Capability Cache TTL is how often the tool catalog is refreshed.
- **Drift:** `FAIL_CLOSED` stops the call when the catalog changes.
- **Error:** `connectionConfigMcpRef or targetToolName not configured` means the server or target tool is missing from the runtime configuration.

## Usage Scenarios

| Scenario | Situation | Solution (Policy Application) | Expected Behavior / Result |
|---------|-------|----------------------------|---------------------------|
| Fixed customer search | The same tool must run on every support-assistant request | `search_customer` is selected; the email from the header is sent through the JSON argument template | The result is written to a gateway variable |

## Configuring Policy Parameters

### MCP Server and Discovery

- Endpoint and transport must match the MCP server.
- Configure authentication, mTLS, and private egress for the target environment.
- After discovery, the tool count must be greater than zero.

### Target Tool and Arguments Template

- `targetToolName` is required on the Fixed variant.
- The template must produce valid JSON after variables are resolved.
- REQUIRED, REGEX, ENUM, and MAX_LENGTH constraints can be applied.
- Confirm that the target tool selection is kept on the edit screen.

### Cache and Drift

- Capability Cache TTL is how often the tool catalog is refreshed.
- `FAIL_CLOSED` stops the call when the catalog changes.

### Fail-Closed Behavior

An empty discovery result or allow-list does not make every tool available.

## Checklist

- Are endpoint and transport correct?
- Are authentication and mTLS correct?
- Did tool discovery succeed?
- Was the target tool selected and saved?
- Does the arguments template produce valid JSON?
- Is the selection kept on the edit screen?
- Was the API Proxy redeployed?

## Deleting the Policy

For deletion steps and what to do while the policy is in use, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).

## Exporting and Importing the Policy

For export and import steps, see [Export/Import](/en/admin/secrets-management/export-import).

## Connecting the Policy to an API

For how to attach this policy to APIs, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).
