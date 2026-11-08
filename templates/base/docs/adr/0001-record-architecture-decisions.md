# 1. Record architecture decisions

Status: Accepted

## Context

People and agents need to find why the system is built the way it is, after the pull request that changed it is closed.

## Decision

Record each architecture decision in `docs/adr/`, in the format of this file: a title, a status, the context, the decision, and its consequences ([Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)).

## Consequences

- Name each record `NNNN-short-title.md`, numbered in order. Never reuse a number.
- Keep every record. When a decision changes, write a new record and set the old one's status to `Superseded by NNNN`.
- A record is written in the pull request that makes the decision. The `intent/` folder of that change links to it.
