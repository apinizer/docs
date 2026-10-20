---
title: "Loop Guard"
description: "Detects identical requests repeated inside a short time window and limits retry storms and agent loops"
---

:::tip

This document describes the detailed usage of a specific policy. If you are using the Apinizer policy structure for the first time or want to learn how policies work, read [What is Policy?](/en/concepts/core-concepts/what-is-policy) first.

:::

## Overview

### What is its Purpose?

- Detects the same request sent again and again inside a short time window.
- Limits a client stuck in retries or an agent/tool loop that has run away.
- Reduces cost, load, and stability risk.

### Working Principle

The policy counts identical requests inside a sliding time window. A request is identical only when all three of these match:

1. The same credential or caller identity
2. The same AI Gateway and model
3. Byte-identical prompt content

When the repeat count passes the threshold, the selected action is applied. A small difference makes the request different. Loop Guard targets only exact repeats. Semantic similarity belongs to [Semantic Cache](/en/ai-gateway/policies/semantic-cache).

Execution mode is **Inline** only. There is no asynchronous or Observe-Only mode.

## Features and Capabilities

### Basic Features

- **`Window (seconds)`:** Sliding window used to count repeats. A short window catches bursts; a long window also catches slower, persistent repeats.
- **`Max Repeats`:** Threshold that triggers the action.
- **Counting Mode:** All requests (default) counts every request. Accepted only counts requests that passed the other checks.
- **Action:** FLAG (default) lets the request through and records it. BLOCK rejects it with HTTP 429.

### Advanced Features

- **Limit Change Action:** When Max Repeats changes, the counter can be Leave unchanged (default), Clamp to previous limit, or Reset. Reset clears the counter when the limit is raised and never clears it when the limit is lowered.
- **Anonymous requests:** Do not apply the policy, consume from a shared counter pool, or reject with HTTP 401. This choice is separate from proxy-level anonymous blocking.
- **Scope:** Runs on both request and response. It can also be used on MCP and A2A Gateways through the same policy lane.

## Usage Scenarios

| Scenario | Situation | Solution (Policy Application) | Expected Behavior / Result |
|---------|-------|----------------------------|---------------------------|
| Agent loop | An agent that cannot process a tool result keeps retrying the same LLM request | Repeats inside the window are counted; the action runs when Max Repeats is exceeded | BLOCK rejects later requests with HTTP 429. FLAG lets them through and records the event. The counter returns to normal when the window ends |

Watch with FLAG first while calibrating the threshold. Set a balance that does not block a few legitimate retries and still catches a runaway loop quickly.

## Configuring Policy Parameters

### Window and Threshold

- **`Window (seconds)`:** Sliding window, in seconds, used to count repeats.
- **`Max Repeats`:** A value that is too low can catch legitimate retries. A value that is too high catches the loop late.

### Counting Mode

- **`All requests`:** Counts every request, including those rejected by other guardrails.
- **Accepted only:** Counts only requests that passed the other checks.

Use All requests when malicious or faulty traffic should be counted too.

### Counter When the Limit Changes

- **`Leave unchanged`:** The counter is kept; the new limit applies when the current window ends.
- **Clamp to previous limit:** The counter is clamped to the previous limit.
- **Reset:** Clears the counter when the limit is raised. It never clears the counter when the limit is lowered.

### Anonymous Requests

- **Do not apply the policy:** The guardrail is off for anonymous requests.
- **Consume from a shared pool:** All anonymous traffic shares one counter bucket.
- **Reject the request:** Anonymous requests are rejected with HTTP 401.

### Action

- **FLAG:** The request continues; the match is recorded for monitoring.
- **BLOCK:** The request is rejected with HTTP 429.

## Checklist

- Does Window match the expected repeat behavior?
- Does Max Repeats catch loops without blocking legitimate retries?
- Is Counting Mode correct?
- Does the action match the need?
- Does anonymous-request handling match the security need?
- Does Limit Change Action match the operational expectation?
- Was the threshold watched with FLAG before enforcement?
- Is it understood that execution mode is Inline only?

## Deleting the Policy

For deletion steps and what to do while the policy is in use, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).

## Exporting and Importing the Policy

For export and import steps, see [Export/Import](/en/admin/secrets-management/export-import).

## Connecting the Policy to an API

For how to attach this policy to APIs, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).
