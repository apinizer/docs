---
title: "RAG Injection"
description: "Enriches the request with relevant passages retrieved from a knowledge base before it reaches the model"
---

:::tip

This document describes the detailed usage of a specific policy. If you are using the Apinizer policy structure for the first time or want to learn how policies work, read [What is Policy?](/en/concepts/core-concepts/what-is-policy) first.

:::

## Overview

### What is its Purpose?

- Enriches the LLM request with passages retrieved from your knowledge base before the request reaches the model.
- Produces answers from current, private documents without retraining the model.
- Reduces hallucination risk; it does not remove it completely.

Groundedness Protection checks that the answer stays with the context. That requires **Inject via Template**.

### Working Principle

1. **Request arrives** through an API proxy where RAG is enabled.
2. **Retrieve:** Apinizer searches knowledge bases in the vector database for relevant passages.
3. **Inject:** Retrieved passages are added to the request before the model receives it.
4. **Respond:** The model answers using its own knowledge and the injected context.

A knowledge base is an indexed document collection. Supported formats are plain text (`.txt`, `.md`), PDF (content is extracted automatically), and Excel (`.xlsx`, `.xls`). In Excel, each sheet and row is processed separately: at most 50 sheets, 20,000 rows per sheet, and 5,000,000 characters in total.

Processing line: create, upload, automatic chunking, automatic indexing (embedding and write to the vector database).

This policy must run after [Prompt Template](/en/ai-gateway/policies/prompt-template) and [Prompt Decorator](/en/ai-gateway/policies/prompt-decorator), and before [Prompt Guard](/en/ai-gateway/policies/prompt-guard), [DLP Guard](/en/ai-gateway/policies/dlp-guard), [Context Integrity](/en/ai-gateway/policies/context-integrity), and [Semantic Cache](/en/ai-gateway/policies/semantic-cache). Retrieved content is inspected by guardrails the same way as user input. Apinizer corrects ordering violations on save.

## Features and Capabilities

### Basic Features

| Parameter | Purpose | Default |
|-----------|------|-----------|
| **Embedding Provider** | Turns the request into a vector (OpenAI-compatible or Voyage AI) | — |
| **Embedding Model** | Model name sent to the provider | `text-embedding-3-small` |
| **Embedding Dimension** | Vector size; must match the database connection | `1536` |
| **Top K Results** | Maximum number of passages to retrieve | `4` (minimum `1`) |
| **Similarity Threshold** | Minimum cosine similarity score | `0.7` |
| **Max Context Characters** | Limit on the total injected context | `4096` |

### Advanced Features

- **Scope isolation:** A request retrieves only passages from its own project.
- **Secure default:** If the project cannot be resolved and Skip RAG when Project ID unresolved is on, retrieval is skipped.
- **Fail-closed:** If the vector database or embedding provider is unreachable, or the collection is missing, the request is rejected with HTTP 502 (**ERR-268**).
- **Knowledge base deletion:** Deletion is not blocked by a dependency check. Vector records are removed immediately. Deployed RAG policies that reference the deleted base then fail by blocking every request.

## Usage Scenarios

| Scenario | Situation | Solution (Policy Application) | Expected Behavior / Result |
|---------|-------|----------------------------|---------------------------|
| Product documentation | A support chatbot should answer from hundreds of pages of PDF | PDFs are uploaded to a knowledge base. Top K 4, threshold 0.7, mode Inject via Template | The 4 most relevant passages are injected with the `<CONTEXT>...</CONTEXT>` template. Optional Groundedness Protection checks that the answer stays with that context |

## Configuring Policy Parameters

### Connection and Knowledge Base

| Field | Required | Default |
|------|---------|-----------|
| **Knowledge Base** | No | — |
| **Vector DB Connection** | Yes | — |
| **Embedding Provider** | Yes | — |
| **Collection Name** | Yes | — |
| **Embedding Model** | No | `text-embedding-3-small` |
| **Embedding Dimension** | No | `1536` |
| **Top K Results** | No | `4` |
| **Similarity Threshold** | No | `0.7` |
| **Max Context Characters** | No | `4096` |
| **On No Match** | No | Pass Through |
| **Injection Mode** | No | Prepend to User Message |
| **Injection Template** | Only in Template mode | `<CONTEXT>{{context}}</CONTEXT>{{prompt}}` |
| **Target Variable** | No | — |
| **Skip RAG when Project ID unresolved** | No | On |

Embedding Dimension must match the size on the vector database connection exactly.

### Injection Mode

| Mode | Placement | Cache effect |
|-----|----------|-----------------|
| **Prepend to User Message** (default) | Before the user message | No effect |
| **Prepend to System Message** | Before the system prompt | Breaks the provider prompt cache |
| **Append After System Message** | After the existing system message | Cache friendly |
| **Inject via Template** | Wherever `{{context}}` is | Depends on the template |

Inject via Template is required for Groundedness Protection.

### When Nothing Matches

The default **Pass Through** continues without context. The request can instead be rejected or a warning can be produced.

### Retrieval Quality

- **Top K Results:** A high value produces noisy context; a low value misses information. 3-5 is usually balanced.
- **Similarity Threshold:** A high threshold returns fewer, more precise passages. A low threshold returns more passages and raises the risk of unrelated content.
- **Max Context Characters:** Keeps the context inside the model window and the cost budget.

## Checklist

- Are Vector DB Connection, Embedding Provider, and Collection Name set?
- Does Embedding Dimension match the vector database connection?
- Was the knowledge base uploaded, chunked, and indexed?
- Are Top K and Similarity Threshold set?
- Does Max Context Characters fit the model window and cost?
- Is Injection Mode correct?
- Does On No Match match the need?
- Does the policy run after the template and decorator, and before guardrails and cache?
- Was the team told that deleting the knowledge base blocks deployed policies?

## Deleting the Policy

For deletion steps and what to do while the policy is in use, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).

## Exporting and Importing the Policy

For export and import steps, see [Export/Import](/en/admin/secrets-management/export-import).

## Connecting the Policy to an API

For how to attach this policy to APIs, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).
