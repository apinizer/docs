---
title: "Prompt Decorator"
description: "Adds fixed instruction blocks for tone, safety, or response format to the client messages list"
---

:::tip

This document describes the detailed usage of a specific policy. If you are using the Apinizer policy structure for the first time or want to learn how policies work, read [What is Policy?](/en/concepts/core-concepts/what-is-policy) first.

:::

## Overview

### What is its Purpose?

- Adds administrator-defined instruction blocks to the client's `messages[]` list.
- Applies corporate tone, safety, or response-format rules in one place.
- Makes those rules visible in the completed message list even when the client does not send them.

### Working Principle

Each block is added at the `PREPEND` or `APPEND` position with the `system`, `user`, or `assistant` role. `${env}` and `#{context}` variables in the content can be resolved. System blocks can be merged into the existing system message.

Order: after [Prompt Template](/en/ai-gateway/policies/prompt-template), and before [RAG Injection](/en/ai-gateway/policies/rag-injection), guardrails, cache, and token policies.

## Features and Capabilities

### Basic Features

- **Position:** PREPEND or APPEND.
- **Role:** system, user, or assistant.
- **Content:** The fixed instruction to add.
- **Enabled:** Disables a block without deleting it.

### Advanced Features

- **Merge into existing system:** Applies only to system blocks. Merges into the current system content instead of adding a new system message.
- **Preset and localize:** A catalog-bound block receives preset updates. A localized block is independent. Export/import can drop the catalog link; the content is kept.
- **Max Total Chars:** If the total block content exceeds the limit, the content is not truncated; the request is rejected fail-closed.

## Usage Scenarios

| Scenario | Situation | Solution (Policy Application) | Expected Behavior / Result |
|---------|-------|----------------------------|---------------------------|
| Corporate response format | The client does not send a tone instruction on every request | The system block `Yanıtı kısa, açık ve Türkçe ver.` is added as PREPEND | The model sees the instruction in the completed message list even when the client does not send it |

## Configuring Policy Parameters

### Blocks

- **Position:** PREPEND or APPEND.
- **Role:** system, user, or assistant.
- **Content:** The fixed instruction to add.
- **Enabled:** Disables a block without deleting it.

### Merge Into Existing System

Applies only to system blocks. When enabled, the block is merged into the existing system content instead of adding a new system message.

### Preset and Localize

A catalog-bound block receives preset updates. A localized block is independent. After export/import the catalog link can be dropped, but the content is kept.

### Max Total Chars

If the total block content exceeds the limit, the content is not truncated; the request is rejected fail-closed.

## Checklist

- Are Position and Role correct?
- Do the blocks contradict each other?
- Is the system merge choice correct?
- Are variables defined in the target environment?
- Is Max Total Chars sufficient?
- Was the API Proxy redeployed?

## Deleting the Policy

For deletion steps and what to do while the policy is in use, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).

## Exporting and Importing the Policy

For export and import steps, see [Export/Import](/en/admin/secrets-management/export-import).

## Connecting the Policy to an API

For how to attach this policy to APIs, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).
