---
title: "Prompt Template"
description: "Turns catalog message structures into a full messages list on the gateway from an alias and parameters"
---

:::tip

This document describes the detailed usage of a specific policy. If you are using the Apinizer policy structure for the first time or want to learn how policies work, read [What is Policy?](/en/concepts/core-concepts/what-is-policy) first.

:::

## Overview

### What is its Purpose?

- Keeps reusable message structures in the catalog.
- Builds the full `messages[]` list on the gateway when the client sends an alias and parameters.
- Removes template fields before the request is sent to the provider.

### Working Principle

1. Roles, messages, and `{{param}}` placeholders are defined in the catalog.
2. The template is added to the policy as a binding and given an alias.
3. The client sends the `template` and `template_params` fields.
4. Parameters are substituted in a single pass.
5. Messages are merged with REPLACE, PREPEND, or APPEND.
6. Template fields are removed before the request is sent to the provider.

Prompt Template runs first in the pipeline. [Prompt Decorator](/en/ai-gateway/policies/prompt-decorator), [RAG Injection](/en/ai-gateway/policies/rag-injection), guardrail, and cache policies follow it.

## Features and Capabilities

### Basic Features

- **Alias binding:** Selects a catalog template with an alias that is unique inside the policy.
- **Parameter substitution:** Fills `{{param}}` placeholders from client parameters in a single pass.
- **Merge mode:** Replaces, prepends, or appends client messages.
- **Field stripping:** Removes `template` and `template_params` before the provider call.

### Advanced Features

- **Missing parameter behavior:** BLOCK, EMPTY, or DEFAULT.
- **Catalog binding:** A catalog-bound binding receives updates; a localized binding is independent.
- **Character limit:** If `maxExpandedChars` is exceeded, the request is rejected fail-closed.
- **No re-expansion:** `${env}` or a new `{{...}}` inside a client parameter is not resolved again.

## Usage Scenarios

| Scenario | Situation | Solution (Policy Application) | Expected Behavior / Result |
|---------|-------|----------------------------|---------------------------|
| Short summary template | The client should not rebuild the same instruction on every call | The `kisa-aciklama` alias contains the message `{{metin}} metnini tek cümlede özetle.` | The client sends the alias and the `metin` parameter; the gateway turns them into a standard chat message |

```json
{
  "model": "<model-adı>",
  "template": "kisa-aciklama",
  "template_params": { "metin": "Özetlenecek içerik" }
}
```

## Configuring Policy Parameters

### Template Binding

- The alias must be unique inside the policy.
- Names in Messages and Parameters must match.
- A catalog-bound binding receives updates; a localized binding is independent.

### Parameter Behavior

- **BLOCK:** Rejects the request when a required parameter is missing.
- **EMPTY:** Uses an empty value for a missing parameter.
- **DEFAULT:** Uses the default value.
- `${env}` or a new `{{...}}` inside a client parameter is not resolved again.

### Merge Mode

- **REPLACE:** Replaces client messages with the template.
- **PREPEND:** Adds template messages at the beginning.
- **APPEND:** Adds template messages at the end.

### Strip and Character Limit

Template fields must be removed before the request is sent to the provider. If `maxExpandedChars` is exceeded, the request is rejected fail-closed.

## Checklist

- Is the alias unique?
- Do placeholders and parameters match?
- Is missing or unknown parameter behavior correct?
- Is Merge Mode correct?
- Are template fields stripped?
- Is the policy at the start of the pipeline?
- Was the API Proxy redeployed?

## Deleting the Policy

For deletion steps and what to do while the policy is in use, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).

## Exporting and Importing the Policy

For export and import steps, see [Export/Import](/en/admin/secrets-management/export-import).

## Connecting the Policy to an API

For how to attach this policy to APIs, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).
