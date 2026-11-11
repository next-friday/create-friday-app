---
name: security-policy
description: Apply the organization's security policy. Use whenever writing or reviewing a spec.md, a plan, or code that this policy covers.
---

# Security policy

Owner: the code owner of this folder in `.github/CODEOWNERS`.

Standard: [OWASP Application Security Verification Standard 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0/5.0/en), Level 1. This is the default; the owner replaces or tightens it by editing this file.

## Rules

1. Find the chapters the change touches in the table below. A change that touches none meets this policy; say "Does not apply" and why.
2. For each chapter it touches, open that chapter's file in the standard and list every Level 1 requirement that applies to the change. Cite each as `v5.0.0-<chapter>.<section>.<requirement>`, for example `v5.0.0-8.2.1`.
3. Each cited requirement becomes a requirement of the spec, and a test or a review step of the plan.
4. When you cannot open the standard, name the chapters, cite no requirement number from memory, and report that as an area of concern.
5. A Level 1 requirement the change cannot meet is an area of concern. Never drop it silently.
6. Secrets stay out of the repository, logs, and error messages; `.env.example` holds names only.

## Chapters

| Chapter | Covers                              | Level 1 requirements |
| :------ | :---------------------------------- | :------------------- |
| V1      | Encoding and Sanitization           | 8                    |
| V2      | Validation and Business Logic       | 4                    |
| V3      | Web Frontend Security               | 8                    |
| V4      | API and Web Service                 | 2                    |
| V5      | File Handling                       | 4                    |
| V6      | Authentication                      | 13                   |
| V7      | Session Management                  | 6                    |
| V8      | Authorization                       | 4                    |
| V9      | Self-contained Tokens               | 4                    |
| V10     | OAuth and OIDC                      | 5                    |
| V11     | Cryptography                        | 3                    |
| V12     | Secure Communication                | 3                    |
| V13     | Configuration                       | 1                    |
| V14     | Data Protection                     | 2                    |
| V15     | Secure Coding and Architecture      | 3                    |
| V16     | Security Logging and Error Handling | 0                    |
| V17     | WebRTC                              | 0                    |
