---
title: "DLP Guard"
description: "Detects secrets such as API keys, JWTs, private keys, and passwords in requests and responses, then blocks or masks them"
---

:::tip

This document describes the detailed usage of a specific policy. If you are using the Apinizer policy structure for the first time or want to learn how policies work, read [What is Policy?](/en/concepts/core-concepts/what-is-policy) first.

:::

## Overview

### What is its Purpose?

- Detects secrets in requests and responses: API keys, certificates, JWTs, private keys, and passwords.
- On a match, blocks or flags the request or response, or masks the value.
- Targets credential leakage, which is a different class from personal data.

Difference from [PII Mask](/en/ai-gateway/policies/pii-mask):

| | PII Mask | DLP Guard |
|---|---|---|
| Target | Personal data (national ID, IBAN, phone) | Secrets (API key, JWT, private key, password) |
| Purpose | Privacy and KVKK/GDPR compliance | Prevent credential leakage |
| Extra capability | Re-identification (Unmask) | File Signature Detection |

The two policies can be used together. Compliance coverage includes HIPAA Safe Harbor identifiers (phone, SSN, medical record number, health plan ID, device identifiers, IP, URL) and PCI DSS patterns (PAN, expiry, track data, PIN, CVV/CVC). Some HIPAA fields, such as name, date, and geographic subdivision, need a semantic layer instead of a regular expression.

### Working Principle

Built-in patterns arrive as a versioned package with a checksum. If the checksum does not match, that package's patterns are not applied and a warning is logged. Editing a built-in pattern marks it as an override, and later updates do not replace it. Deletion is permanent; a later release can add the pattern again.

Built-in pattern groups:

- **API keys:** AWS (`AKIA...`), OpenAI (`sk-...`), GitHub (`ghp_...`), Slack (`xoxb_...`), Google (`AIza...`)
- **Cryptographic material:** PEM private key blocks and certificates
- **Authentication:** JWT, password, secret, and api-key assignments
- **Card data:** Track 1, Track 2, PIN, CVV/CVC

The request direction catches secrets in the prompt before they reach the model. The response direction catches secrets produced by the model or echoed by a tool result. In streaming, if one chunk group triggers a block, the remaining chunk groups in that stream are masked too.

JSON rules apply only to string values; field names and structure are kept. If a masked body cannot be produced, the request is rejected with **ERR-303**. Decode Encoded Content decodes base64, hex, percent-encoding, and Unicode escapes and scans them; decoded content is not written back. A secret in encoded content is blocked instead of masked. Patterns with ReDoS risk are skipped at runtime.

This policy must run after [Prompt Template](/en/ai-gateway/policies/prompt-template), [Prompt Decorator](/en/ai-gateway/policies/prompt-decorator), and [RAG Injection](/en/ai-gateway/policies/rag-injection). PII Mask is exempt from that rule and can also run before RAG. Apinizer corrects ordering violations on save.

## Features and Capabilities

### Basic Features

- **Action:** Block, Flag, Mask, Delete, Hash, or Encrypt.
- **Evaluation engine:** Built-in, Built-in + External, or External only. The default is Built-in.
- **External failure mode:** Block on failure (default) or Allow on failure.
- **File signature:** Off by default. Only Block or Flag can be selected.

### Advanced Features

- **File Signature Detection:** Decodes base64 or hex candidates and compares leading bytes with magic-byte tables. Recognized formats: PDF, ZIP/Office, PNG/JPEG/GIF, GZIP/RAR/7-Zip, ELF/PE, OLE2, RTF, Java class. Signature Position also reports whether the magic bytes are at the start or embedded.
- **External provider:** `llm-judge` or `http-dlp`. A built-in Block short-circuits the external call in combined mode. The external provider is never called on streaming responses.
- **Hash and Encrypt:** Hash produces SHA-256 with an installation-specific salt. Encrypt uses AES/GCM/NoPadding; decryption is possible only in the same Apinizer installation with Groovy.
- **Custom patterns:** Java regular expressions (`java.util.regex.Pattern`). The Test the pattern panel validates them on the server before save.

## Usage Scenarios

| Scenario | Situation | Solution (Policy Application) | Expected Behavior / Result |
|---------|-------|----------------------------|---------------------------|
| Pasted configuration | A developer pastes a config that contains AWS and OpenAI keys into the prompt | Built-in patterns catch the secrets before the request is sent to the model | Mask sends the keys masked. Block rejects the request and the secrets never reach the provider. A secret produced in the response is caught before it returns to the user |
| Base64 PEM | A private key file is pasted as base64 | File Signature Detection is on | The file is recognized by magic bytes and Block or Flag is applied |

## Configuring Policy Parameters

### Basic Settings

| Setting | Description | Default |
|------|----------|-----------|
| **Max Input Characters** | Truncation limit before patterns run | `8000` |
| **Action** | Block, Flag, or Mask | — |
| **Evaluation Engine** | Built-in, Built-in + External, or External only | Built-in |
| **External Failure Mode** | Block on failure or Allow on failure | Block on failure |
| **File Signature Detection** | Enablement and format allow-list | Off |
| **Timeout** | External judge connection timeout | `2000 ms` |

### Rule Actions

| Action | Behavior |
|---------|----------|
| **Block** | The request or response is rejected completely. This is the default for file signatures |
| **Flag** | Processing continues; the match is recorded |
| **Mask** | The value is masked and forwarded. Encoded content is promoted to Block |
| **Delete** | The matching value is removed |
| **Hash** | SHA-256 with an installation-specific salt |
| **Encrypt** | AES/GCM/NoPadding |

### File Signature

Off by default. Enable it when needed and use the format allow-list to choose which formats are caught. Only Block or Flag can be selected.

### External DLP

- **llm-judge:** LLM-based decision.
- **http-dlp:** Vendor-neutral HTTP endpoint. The service receives `text`, `direction`, and `apiType`, and must return HTTP 2xx with `safe`, `categories`, and `score`. `safe` or `flagged` as a boolean is required. Missing or invalid JSON is an error.

Evaluation Engine:

- **Built-in only:** Regular expressions only.
- **Built-in + External:** Both run. A built-in Block short-circuits the external call.
- **External provider only:** External only; regular expressions are ignored.

## Checklist

- Do built-in patterns cover the target secret types?
- Does the action match the need?
- If binary files are a risk, is File Signature Detection on and is the format list set?
- Was Decode Encoded Content considered?
- If an external provider is used, are Evaluation Engine and External Failure Mode correct?
- Is it understood that the external provider is not called on a streaming response?
- Were custom patterns validated with Test the pattern?
- Does the policy run after Prompt Template, Prompt Decorator, and RAG?
- If HIPAA or PCI DSS applies, are the related patterns active?

## Deleting the Policy

For deletion steps and what to do while the policy is in use, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).

## Exporting and Importing the Policy

For export and import steps, see [Export/Import](/en/admin/secrets-management/export-import).

## Connecting the Policy to an API

For how to attach this policy to APIs, see [Policy Management](/en/develop/api-proxy-configuration/policy-management).
