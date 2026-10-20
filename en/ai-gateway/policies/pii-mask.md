---
title: "PII Mask"
description: "Detects and masks personal data such as national IDs, IBANs, phone numbers, and email addresses in requests and responses"
---

:::tip

This document describes the detailed usage of a specific policy. If you are using the Apinizer policy structure for the first time or want to learn how policies work, read [What is Policy?](/en/concepts/core-concepts/what-is-policy) first.

:::

## Overview

### What is its Purpose?

- Detects and masks personal data in requests and responses.
- Stops that data from leaking to the LLM provider or being disclosed in a response.
- Limits what the embedding provider can see in a RAG scenario.

Every new AI proxy arrives with a prefilled **Default PII Mask** policy. **Clear All** resets it. An empty rule list masks nothing and produces a warning.

Secrets (API key, JWT, private key) belong to [DLP Guard](/en/ai-gateway/policies/dlp-guard).

### Working Principle

1. The policy scans request and response content against built-in types and custom patterns.
2. Each match gets the rule action: Block, Flag, Mask, Encrypt, Hash, or Delete.
3. With Mask, the value is replaced using the selected Mask Shape.

JSON rules apply only to string values; field names and structure are kept. If JSON becomes invalid after masking, the request is rejected with **ERR-303**.

Decode Encoded Content is off by default. base64, hex, percent-encoding, and Unicode escapes are decoded up to 3 levels. Decoded content is only inspected and is not written back. gzip and deflate are not decoded. Personal data in encoded content rejects the request. A readability threshold reduces false positives on hashes and UUIDs.

On streaming responses, masking uses buffer-and-scan: the stream is collected, then processed. Time-to-first-token is not preserved while masking is active. The same value is masked consistently across parts.

If this policy runs before [RAG Injection](/en/ai-gateway/policies/rag-injection), the embedding provider does not see personal data either. If it runs after, the injected RAG context is masked.

## Features and Capabilities

### Basic Features

Built-in types use a checksum where one exists:

| Data type | Validation |
|-----------|-----------|
| **Turkish national ID** | 11 digits and checksum |
| **IBAN** | TR and international format, mod-97 checksum |
| **Phone** | Turkish format, structural |
| **Email** | Structural pattern |
| **Credit card** | Luhn checksum |
| **IP address** | IPv4 and IPv6, structural |
| **URL** | Structural |
| **Passport number** | Structural, no checksum |
| **SSN** | Structural |
| **Driver license number** | Turkish format, structural |
| **Crypto wallet** | Bitcoin and Ethereum checksum |

Custom Java regular expressions can also be defined.

### Advanced Features

- **Mask shapes:** Replace entirely, Keep first N, Keep last N, Mask first N, Sequential Placeholder, Synthetic Value.
- **Re-identification:** Only for Sequential Placeholder and Synthetic Value. None, Automatic (Response Inline), or Unmask API.
- **Catalog binding:** Editing a catalog-bound rule makes it Localized. A catalog update keeps only Localized rules.
- **ReDoS:** Risky patterns are skipped at runtime even if they look enabled on screen.
- **Execution mode:** Inline (required for Block), Asynchronous, or Observe-Only.

Sequential Placeholder and Synthetic Value are consistent inside one request or response cycle and intentionally inconsistent across different requests.

## Usage Scenarios

| Scenario | Situation | Solution (Policy Application) | Expected Behavior / Result |
|---------|-------|----------------------------|---------------------------|
| Insurance assistant | The customer message contains a national ID, IBAN, and phone; the provider must not see them, an authorized operator must | Mask and Sequential Placeholder on the request; Automatic Unmask and an authorized role | `12345678901` goes to the model as `<TCKN_1>`. On the response to an authorized operator, the placeholder is replaced with the real value |
| Synthetic IBAN | A natural-looking value that is not real is required | Synthetic Value | A checksum-valid fake IBAN is produced from the reserved test range |
| Correlation | The value should be linkable without being reversible | Hash or Encrypt | A SHA-256 or AES/GCM value is produced |

## Configuring Policy Parameters

### Rule Management

Each rule sets Data Type, Rule Action, and, for Mask, Mask Shape.

- **Add Default Set:** Adds one rule for each built-in type.
- **Add from Preset:** Selects from the PII Patterns catalog.
- **Add Definition:** Creates one custom rule.
- **Clear All:** Deletes all rules after confirmation.

### Rule Actions

| Action | Behavior |
|---------|----------|
| **Block** | The request or response is rejected on a match |
| **Flag** | Processing continues; the detection is recorded |
| **Mask** | The value is changed to the selected shape |
| **Encrypt** | Encrypts with AES/GCM/NoPadding and returns Base64. Decryption needs the installation key and a Groovy script |
| **Hash** | SHA-256 with an installation-specific salt |
| **Delete** | Removes the value |

### Mask Shape

| Shape | Input | Output |
|-------|-------|-------|
| **Replace entirely** (default) | 05321234567 | `***` |
| **Keep first N** (N=4) | 05321234567 | `0532*******` |
| **Keep last N** (N=4) | 05321234567 | `*******4567` |
| **Mask first N** (N=4) | 05321234567 | `****1234567` |
| **Sequential Placeholder** | 05321234567 | `<PHONE_1>` |
| **Synthetic Value** | 05321234567 | A valid synthetic value |

### Re-identification

- **None:** Default. The original value is discarded.
- **Automatic (Response Inline):** Puts the original value back in the response for authorized callers. Authorized Caller Roles needs at least one role. Skipped on streaming responses and on non-Standard data-retention profiles.
- **Unmask API:** Authorized Manager operators recover the value later through the Management API.

Original values are stored encrypted in the distributed cache (keyed by trace ID, rule, and pseudonym) and expire after 1 hour.

### Decoding and Execution Mode

Turn on Decode Encoded Content to catch personal data in encoded content. When it is on, personal data in encoded content rejects the request.

- **Inline (Blocking):** Required for Block.
- **Asynchronous:** Runs in the background; matches are recorded.
- **Observe-Only:** Does not block or mask.

### Custom Patterns

Custom patterns use Java regular expressions. The Test the pattern panel runs the pattern on the server before save. The Source column shows whether a rule is Catalog-bound or Localized.

## Checklist

- Is the rule list non-empty?
- Were the required data types added?
- Is the action correct on each rule?
- If Mask is used, is the shape suitable?
- If re-identification is required, are the mode and authorized roles set?
- Is Decode Encoded Content required?
- Is Inline selected for Block?
- Were custom patterns validated with Test the pattern?
- If RAG is present, does the order match the data-boundary decision?
- If streaming is used, is the first-token delay acceptable?

## Deleting the Policy

For deletion steps and what to do while the policy is in use, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).

## Exporting and Importing the Policy

For export and import steps, see [Export/Import](/en/admin/secrets-management/export-import).

## Connecting the Policy to an API

For how to attach this policy to APIs, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).
