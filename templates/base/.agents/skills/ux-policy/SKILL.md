---
name: ux-policy
description: Apply the organization's UX policy. Use whenever writing or reviewing a spec.md, a plan, or code that this policy covers.
---

# UX policy

Owner: the code owner of this folder in `.github/CODEOWNERS`.

Standard: [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/), Level AA: the page satisfies all the Level A and Level AA success criteria. This is the default; the owner replaces or tightens it by editing this file.

## Rules

1. A change with no user interface meets this policy; say "Does not apply" and why.
2. For a change with a user interface, the spec lists the success criteria the change touches, by number and name, and each becomes a requirement.
3. Every interactive element works with the keyboard alone, shows where the focus is, and has a name a screen reader announces.
4. Text and meaningful graphics meet the contrast minimum, and no information is carried by colour alone.
5. Every form field has a visible label, and every error says in text which field is wrong and how to fix it.
6. Check the criteria that WCAG 2.2 added at Level A and AA: 2.4.11 Focus Not Obscured (Minimum), 2.5.7 Dragging Movements, 2.5.8 Target Size (Minimum), 3.2.6 Consistent Help, 3.3.7 Redundant Entry, and 3.3.8 Accessible Authentication (Minimum).
7. Every state the user can reach is designed: loading, empty, error, and success.
8. A criterion the change cannot meet is an area of concern. Never drop it silently.
