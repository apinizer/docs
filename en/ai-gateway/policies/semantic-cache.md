---
title: "Semantic Cache"
description: "Stores responses for identical or semantically similar LLM requests and returns them without calling the model again"
---

:::tip

This document describes the detailed usage of a specific policy. If you are using the Apinizer policy structure for the first time or want to learn how policies work, read [What is Policy?](/en/concepts/core-concepts/what-is-policy) first.

:::

## Overview

### What is its Purpose?

- Stores and reuses responses for identical or semantically similar requests.
- Lowers token cost by keeping repeated requests off the provider.
- Skips inference on a cache hit, which reduces latency and provider load.

Exact repeats belong to [Loop Guard](/en/ai-gateway/policies/loop-guard). This policy can also match requests that are close in meaning.

### Working Principle

| Layer | Behavior |
|--------|----------|
| **Exact Match** | A request identical to a previous one uses that cached response |
| **Vector Similarity** | Finds requests written with different words but close in meaning, using embeddings. Optional |

Request content is turned into a vector by the embedding provider and stored in a vector database. Setting the threshold score to `0` turns off threshold enforcement; these three filters still apply: scope isolation (same model, proxy, identity), candidate count (nearest-neighbor limit), and entry lifetime (TTL).

The cache key is derived from the assembled prompt and includes the model, API proxy identity, and caller credential. One tenant's response is never returned to another tenant.

If [PII Mask](/en/ai-gateway/policies/pii-mask) or [DLP Guard](/en/ai-gateway/policies/dlp-guard) is active, the raw response is never written to the cache; only the masked version is stored. A cache hit cannot skip masking rules.

This policy must run after [Prompt Template](/en/ai-gateway/policies/prompt-template), [Prompt Decorator](/en/ai-gateway/policies/prompt-decorator), and [RAG Injection](/en/ai-gateway/policies/rag-injection). The key is calculated from the enriched content. Apinizer corrects ordering violations on save.

## Features and Capabilities

### Basic Features

- **Trailing Message Count:** How many messages, counting backward from the end, are embedded. Default `1`.
- **Role switches:** Include System, Include Assistant, and Include Tool Messages widen which roles join similarity matching.
- **Similarity Threshold:** A high threshold gives fewer, more precise hits. `0` turns off threshold enforcement.
- **Nearest-Neighbour Count:** Maximum number of candidate records to fetch.

### Advanced Features

- **Honor Cache-Control Header:** When on, honors the client's `no-store` and `no-cache` directives.
- **Anonymous requests:** Bypass cache (default), Shared pool, or Reject. Shared pool shares responses among anonymous users.
- **TTL:** Expired entries are removed. PostgreSQL and Qdrant maintenance clears expired vector records every day at 04:45. Redis records expire on their own.
- **Storage:** Similarity uses PostgreSQL pgvector, Qdrant, or Redis. Response bodies are stored in the cache backend. In APIops, the vector database and embedding provider are given by name reference.
- **Scope:** Per proxy, per project, and per caller identity. A shared pool for anonymous traffic is optional.

## Usage Scenarios

| Scenario | Situation | Solution (Policy Application) | Expected Behavior / Result |
|---------|-------|----------------------------|---------------------------|
| Delivery questions | "How long does delivery take?" and "In how many days does shipping arrive?" mean the same thing | Vector Similarity and a similarity threshold | If the second question passes the threshold, the response returns from cache without calling the model |
| Personal response | The response contains user-specific data | PII Mask is active | Only the masked response is kept in the cache |

Keep TTL short for stock, price, or shipment status that changes often.

## Configuring Policy Parameters

### Matching

- **Trailing Message Count:** Can be raised to capture context in a multi-turn chat.
- **Include System / Assistant / Tool Messages:** Roles that join similarity.
- **Similarity Threshold:** Minimum score for a vector match.
- **Nearest-Neighbour Count:** Maximum candidate records.

### Cache Control and Anonymous Requests

- **Honor Cache-Control Header:** Honors client `no-store` and `no-cache` directives.
- **Bypass cache:** Anonymous requests skip the cache.
- **Shared pool:** Anonymous callers share one pool. Use care when content is user-specific.
- **Reject:** Anonymous requests are rejected.

### TTL and Storage

Each entry has a TTL. Keep it short when the underlying data changes often. Similarity matching runs on PostgreSQL pgvector, Qdrant, or Redis.

## Checklist

- Is exact match enough, or is Vector Similarity also required?
- For vector mode, are the embedding provider and vector database defined?
- Is Similarity Threshold set?
- Does Trailing Message Count fit the chat context?
- Is TTL set for how fast the content changes?
- Does anonymous-request handling match the security need?
- Is Honor Cache-Control Header on?
- If PII or DLP is active, was it confirmed that the cache stores the masked response?
- Does the policy run after RAG, Prompt Template, and Prompt Decorator?

## Deleting the Policy

For deletion steps and what to do while the policy is in use, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).

## Exporting and Importing the Policy

For export and import steps, see [Export/Import](/en/admin/secrets-management/export-import).

## Connecting the Policy to an API

For how to attach this policy to APIs, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).
