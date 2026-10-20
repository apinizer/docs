---
title: "Prompt Guard"
description: "Detects jailbreak and prompt injection attempts by signature scanning before the prompt reaches the model"
---

:::tip

This document describes the detailed usage of a specific policy. If you are using the Apinizer policy structure for the first time or want to learn how policies work, read [What is Policy?](/en/concepts/core-concepts/what-is-policy) first.

:::

## Overview

### What is its Purpose?

- Detects jailbreak and prompt injection attempts before the prompt reaches the model.
- Scans user text against known attack patterns.
- Inspects encoded malicious prompts when decoding is enabled.

Threats it covers:

- **Jailbreak:** Prompts that try to disable system instructions, such as "ignore all your rules", "switch to DAN mode", or "you are now an assistant without restrictions".
- **Prompt injection:** Text hidden inside user input that tries to give the model different instructions.
- **Encoded attacks:** Malicious prompts hidden with base64, hex, percent-encoding (`%41`), or Unicode escapes.

### Working Principle

1. The user request is stopped in the guardrail layer before it is sent to the model.
2. All messages are scanned by default and compared with known attack patterns.
3. When Decode Encoded Content is on, base64, hex, and Unicode encodings are decoded up to 3 levels. The decoded text is scanned and is not written back into the body sent to the model.
4. If there is a match, Block or Flag is applied.

This policy must run after [Prompt Template](/en/ai-gateway/policies/prompt-template), [Prompt Decorator](/en/ai-gateway/policies/prompt-decorator), and [RAG Injection](/en/ai-gateway/policies/rag-injection). The text under review must be the final text that will go to the model. Apinizer corrects ordering violations on save.

## Features and Capabilities

### Basic Features

- **Signature pack:** Attack patterns arrive as a separate versioned package with checksum validation. If the checksum does not match, that package's patterns are not applied and a warning is logged.
- **Custom patterns:** The first edit of a built-in pattern marks it as an override, and later package updates do not replace it.
- **Execution mode:** Inline, Asynchronous, or Observe-Only.
- **Action:** Block or Flag. Mask is not valid for this policy. Masking belongs to [PII Mask](/en/ai-gateway/policies/pii-mask) and [DLP Guard](/en/ai-gateway/policies/dlp-guard).

### Advanced Features

- **External LLM judge:** Built-in only, built-in plus external, or external provider only. In combined mode, a decision from either side triggers the action.
- **Role scope:** Include System Prompts, Include Assistant Prompts, and Include Tool Prompts narrow the scope. Unrecognized roles and messages without a role are always scanned.
- **Decoding:** Decoded content is not written back. Personal data or a secret found in encoded content triggers block instead of masking. A readability threshold limits false alarms on hashes and UUIDs.

## Usage Scenarios

| Scenario | Situation | Solution (Policy Application) | Expected Behavior / Result |
|---------|-------|----------------------------|---------------------------|
| Bank chatbot | The user tries to ignore system instructions and extract the system prompt and customer data | The request is scanned before the model; jailbreak signatures match | With Block, the request is rejected (for example 400) and never reaches the model. The match is recorded |
| Encoded attack | The malicious instruction is hidden in base64 | Decode Encoded Content is on | The decoded text is scanned and caught |
| Rollout test | Pattern behavior should be seen without affecting production | Observe-Only | No request is blocked; matches are recorded |

## Configuring Policy Parameters

### Execution Mode

| Mode | Behavior | When to use it |
|------|----------|----------------------|
| **Inline** | Evaluated before the request continues. Required for Block | When real protection is required |
| **Asynchronous** | Runs in the background, adds no request latency; matches are still recorded | Latency-sensitive monitoring |
| **Observe-Only** | Does not block; only records matches | Pattern tuning before rollout |

Use Inline for real blocking. Observe-Only blocks nothing.

### Action

- **Block:** Rejects the request completely.
- **Flag:** The request continues and the match is recorded.
- **Mask:** Not valid for this policy.

### Message Role Scope

Prompt Guard scans every message by default. These switches narrow the scope:

- **Include System Prompts:** Leaves system messages out of the scan.
- **Include Assistant Prompts:** Excludes assistant-role messages.
- **Include Tool Prompts:** Excludes tool-role messages.

Do not narrow the scope without a reason.

### Decode Encoded Content

When enabled, decoded text is inspected for patterns, is not written back into the body, and nested encodings are decoded up to 3 levels.

### External LLM Judge

- **LLM Provider:** OpenAI-compatible providers only (OpenAI, Azure, vLLM, Ollama, DeepSeek, Groq, Mistral, and similar).
- **Model name:** Required. No default model is assigned.
- **Timeout:** Default 2000 ms.
- **Max Input Characters:** Default 8000.
- **Max Output Tokens:** Default 64. Reasoning models need 1024 or more; otherwise the answer is cut off.
- **JSON Mode:** For a structured decision.
- **Judge Prompt Template:** Leave empty for native mode (for example Llama Guard 3). Fill it for general-purpose instruct models.

Call timing:

- **Inline:** The judge response is awaited and adds latency.
- **Asynchronous:** The wait is limited by the guardrail Max Wait. The external default is 2000 ms.
- **Observe-Only:** Both built-in and external run; the comparison is recorded and not applied.

Failure handling:

- **Block on failure:** Default. If the judge times out or errors, the request is rejected.
- **Allow on failure:** The request continues and the error is recorded.

## Checklist

- Is Inline selected for real blocking?
- Does the action match the need?
- Was the message-role scope narrowed without a reason?
- Is Decode Encoded Content on for encoded attacks?
- If an external judge is used, is the model name set and is Max Output Tokens suitable for the model?
- Were patterns tested with Observe-Only before rollout?
- Does failure handling match the organization policy?

## Deleting the Policy

For deletion steps and what to do while the policy is in use, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).

## Exporting and Importing the Policy

For export and import steps, see [Export/Import](/en/admin/secrets-management/export-import).

## Connecting the Policy to an API

For how to attach this policy to APIs, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).
