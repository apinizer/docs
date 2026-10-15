---
title: "A2A Call"
description: "Calls a preselected A2A skill on every matching request and does not leave skill selection to the model"
---

:::tip

This document describes the detailed usage of a specific policy. If you are using the Apinizer policy structure for the first time or want to learn how policies work, read [What is Policy?](/en/concepts/core-concepts/what-is-policy) first.

:::

## Overview

### What is its Purpose?

- Calls the A2A skill selected in advance by the administrator on every matching request.
- Does not leave skill selection to the LLM.
- Can continue without waiting for the result, or write the result to a variable.

### Working Principle

1. The Agent Card is read from the agent endpoint.
2. Skills are discovered and `targetSkillName` is selected.
3. Gateway variables inside the Message Template are resolved.
4. The message is sent to the target skill.
5. `FIRE_AND_FORGET` does not wait; `SYNC_TO_VARIABLE` waits for the result and writes it to a variable.

## Features and Capabilities

### Basic Features

- **Fixed skill:** `targetSkillName` is required on the Fixed variant.
- **Message template:** Request body, header, and correlationId variables can be used.
- **Wait mode:** Continue without waiting, or write the result to an output variable.
- **Fail-closed:** The call is not allowed when discovery is empty or the target skill is not saved.

### Advanced Features

- **Private network:** **Allow Private-Network Egress** must be enabled for a private-network target. Loopback, link-local, and metadata addresses are always forbidden.
- **Timeouts:** Call Timeout limits each HTTP send; Task Wait Timeout limits the whole task wait.
- **Error:** `connectionConfigA2aRef or targetSkillName not configured` means the agent or target skill is missing from the runtime configuration.

## Usage Scenarios

| Scenario | Situation | Solution (Policy Application) | Expected Behavior / Result |
|---------|-------|----------------------------|---------------------------|
| Fixed summary skill | The same skill must run on every chat request | `summarize_report` is selected; the message template forwards the user text from the request body | With fire-and-forget, the main request continues without waiting for the agent result |

## Configuring Policy Parameters

### Agent Endpoint and Discovery

- Enter a base URL that can be resolved; do not append the Agent Card path.
- After discovery, the skill count must be greater than zero.
- Enable **Allow Private-Network Egress** for a private-network target.
- Loopback, link-local, and metadata addresses are always forbidden.

### Target Skill and Message Template

- `targetSkillName` is required on the Fixed variant.
- Request body, header, and correlationId variables can be used in the Message Template.
- Confirm that the selected skill is still selected when the edit screen is opened again.

### Wait Mode and Timeout

- **FIRE_AND_FORGET:** Does not wait for the result.
- **SYNC_TO_VARIABLE:** Waits for the result and writes it to the output variable.
- Call Timeout limits each HTTP send; Task Wait Timeout limits the whole task wait.

### Fail-Closed Behavior

The call is not allowed when discovery is empty or the target skill is not saved.

## Checklist

- Can the endpoint be resolved?
- Is private egress enabled when required?
- Did skill discovery succeed?
- Was the target skill selected and saved?
- Is the selection kept on the edit screen?
- Are wait mode and timeouts correct?
- Was the API Proxy redeployed?

## Deleting the Policy

For deletion steps and what to do while the policy is in use, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).

## Exporting and Importing the Policy

For export and import steps, see [Export/Import](/en/admin/secrets-management/export-import).

## Connecting the Policy to an API

For how to attach this policy to APIs, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).
