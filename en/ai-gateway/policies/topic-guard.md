---
title: "Topic Guard"
description: "Compares the user message semantically with allowed and denied topics and keeps answers inside the intended domain"
---

:::tip

This document describes the detailed usage of a specific policy. If you are using the Apinizer policy structure for the first time or want to learn how policies work, read [What is Policy?](/en/concepts/core-concepts/what-is-policy) first.

:::

## Overview

### What is its Purpose?

- Compares the user message semantically with allowed and denied topic definitions.
- Keeps the application answering only in the defined business domains.
- Gives the denied topic priority when a message matches both an allowed and a denied topic.

### Working Principle

1. An embedding is produced for the request content.
2. The message is compared first with denied topic embeddings, then with allowed topic embeddings.
3. If the similarity passes the related threshold, the configured `BLOCK` or `FLAG` action is applied.
4. When denied and allowed topics match together, the denied topic wins.

Topic embeddings are cached. If the embedding model changes, thresholds must be calibrated again.

This policy must run after [Prompt Template](/en/ai-gateway/policies/prompt-template), [Prompt Decorator](/en/ai-gateway/policies/prompt-decorator), and [RAG Injection](/en/ai-gateway/policies/rag-injection), so the final prompt is evaluated.

## Features and Capabilities

### Basic Features

- **Allowed topics:** Topics the application may answer.
- **Denied topics:** Topics that are restricted in every case.
- **Thresholds:** Separate similarity thresholds for allowed and denied topics.
- **Action:** Inline and Block for real blocking; Flag or Observe-Only for calibration.

### Advanced Features

- **Embedding alignment:** Provider, model, and dimension must match each other.
- **Recalibration:** After a model change, topic vectors and thresholds must be refreshed.
- **Wording:** Use clear phrases with context instead of a single word. There is no universal threshold.

## Usage Scenarios

| Scenario | Situation | Solution (Policy Application) | Expected Behavior / Result |
|---------|-------|----------------------------|---------------------------|
| Banking assistant | The assistant should answer only account-balance and transaction questions | Allowed topic: account balance and transaction queries. Denied topic: legal advice | An off-topic or denied message that passes the threshold blocks the model call |

## Configuring Policy Parameters

### Topic Definitions

- **Allowed Topics:** Topics the application may answer.
- **Denied Topics:** Topics that are restricted in every case.
- Use clear phrases with context instead of a single word.

### Similarity Thresholds

- **Similarity Threshold:** Match threshold for allowed topics.
- **Denied Similarity Threshold:** Match threshold for denied topics.
- There is no universal value; test with the model and real traffic.

### Embedding Settings

- Provider, model, and dimension must match each other.
- After a model change, refresh topic vectors and thresholds.

### Action and Execution Mode

- Use `Inline + Block` for real blocking.
- Use `Flag` or `Observe-Only` for calibration.

## Checklist

- Are allowed and denied topics written clearly?
- Were thresholds tested with real examples?
- Do Embedding Provider, Model, and Dimension match?
- Are Inline and Block selected for real blocking?
- Is the policy in the correct order?
- Was the API Proxy redeployed?

## Deleting the Policy

For deletion steps and what to do while the policy is in use, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).

## Exporting and Importing the Policy

For export and import steps, see [Export/Import](/en/admin/secrets-management/export-import).

## Connecting the Policy to an API

For how to attach this policy to APIs, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).
