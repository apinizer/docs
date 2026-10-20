---
title: "Token Rate Limit"
description: "Limits LLM token consumption and optional USD cost inside time windows"
---

:::tip

This document describes the detailed usage of a specific policy. If you are using the Apinizer policy structure for the first time or want to learn how policies work, read [What is Policy?](/en/concepts/core-concepts/what-is-policy) first.

:::

## Overview

### What is its Purpose?

- Limits how many tokens can be consumed, or how much budget can be spent, inside a time window.
- Stops one consumer or team from using the whole capacity.
- Smooths token bursts and draws limits per project or organization.

This feature is part of the AI Gateway license module. Limits on the quota screen do not work by themselves. Enforcement is applied by the Token Rate Limit policy on the AI proxy request policy list.

### Working Principle

1. **Estimate:** Token cost is estimated before the request is sent to the model.
2. **Reserve:** The estimate is reserved in every related scope and time window.
3. **Adjust:** When the response completes, including streaming, the reservation is adjusted to the tokens actually consumed.

If more than one scope applies at the same time, the strictest limit is used.

| Scope | Meaning |
|-------|--------|
| **Credential** | Traffic of one Consumer or API client on a specific proxy and environment. Assigned as an AI Token Budget |
| **Application** | Use of one credential through a specific API proxy |
| **Organization** | A limit shared by every credential in the same organization |
| **Project** | All AI traffic of a project |

Organizations defined in the admin scope can be shared across projects. Project managers can view and use them; only a system administrator can edit them.

Each scope can define four windows and an optional USD budget: Per Minute, Per Hour, Per Day, Per Month. The token limit and the USD budget are independent.

## Features and Capabilities

### Basic Features

| Action | Behavior | When |
|---------|----------|----------|
| **Block** | The request is rejected. Returns `429` and `Retry-After` (seconds) | Strict limit |
| **Failover** | The request goes to the next provider or model in the chain | Uninterrupted service |
| **Alert Only** | The request continues; only a warning is produced | Monitoring |
| **Downgrade to a Cheaper Model** | The request goes to a lower-cost model | Lower cost without stopping service |

`Retry-After` is clamped by the `apinizer.limit.retryAfterClampSeconds` JVM property. The default is `86400` seconds (1 day).

### Advanced Features

- **Oversized Guard:** Max Tokens Per Request and Max Prompt Characters limit the size of a single request. Limit Source can be Explicit or Model Catalog. On Overflow can be Block or Truncate Oldest Messages.
- **Truncation protection:** Even when Truncate Oldest Messages is selected, every `system` message and the last `user` message are kept.
- **Threshold alarms:** Alarms are produced at 50%, 80%, 90%, and 100% of the limit.
- **Monitoring:** Reports View shows Tokens Used, Tokens Remaining, Cost to Date, and Alerts. The [Usage Reports](/api-reference/usage-reports) endpoints provide read-only consumption data.

## Usage Scenarios

| Scenario | Situation | Solution (Policy Application) | Expected Behavior / Result |
|---------|-------|----------------------------|---------------------------|
| SaaS customer quota | Each customer is an organization; total cost and customer isolation are required | Project: 50M tokens per month. Organization: 200K tokens per hour and 200 USD per month. Credential: 20K tokens per minute | When a customer fills the hourly limit, Block returns 429 and other customers are unaffected. Alarms fire at 50%, 80%, 90%, and 100% |
| Cost reduction | An expensive model is pressing the budget | Downgrade | The request goes to a cheaper model and service continues |
| Provider quota | The primary provider quota is full | Failover | The request goes to the secondary provider |

## Configuring Policy Parameters

### Overflow Action

Select Block, Failover, Alert Only, or Downgrade to a Cheaper Model. Use Block for strict protection, Failover or Downgrade for uninterrupted service, and Alert Only for calibration.

### Scope and Window

- Credential, Application, Organization, or Project. With more than one scope, the strictest limit applies.
- Per Hour is used for daily rate, Per Month for a spend ceiling, and Per Minute for burst protection.
- A token limit, a USD budget, or both can be set separately on each window.

### Per-Request Size

- **Max Tokens Per Request:** Blocks requests above this token count.
- **Max Prompt Characters:** Blocks a prompt that exceeds the character limit.
- **Limit Source:** Explicit uses the Max Tokens Per Request value. Model Catalog uses the limit in the model catalog.
- **On Overflow:** Block or Truncate Oldest Messages.

### Alarms and Reports

Before rollout, confirm that the 50%, 80%, 90%, and 100% alarms are connected to notification channels.

## Checklist

- After limits were defined, was the policy added to the AI proxy request policy list?
- Is the scope correct, and was the strictest limit considered when more than one scope exists?
- Are the time windows set for the need?
- Is a token limit, a USD budget, or both required?
- Is the overflow action correct?
- Is Oversized Guard required?
- If Truncate Oldest Messages will be used, is the preserved context acceptable?
- Are threshold alarms connected to notification channels?

## Deleting the Policy

For deletion steps and what to do while the policy is in use, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).

## Exporting and Importing the Policy

For export and import steps, see [Export/Import](/en/admin/secrets-management/export-import).

## Connecting the Policy to an API

For how to attach this policy to APIs, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).
