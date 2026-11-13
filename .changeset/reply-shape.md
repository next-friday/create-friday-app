---
"@next-friday/create-app": minor
---

A reply of the `sdlc` plugin has a new shape. Its first line is `**Answer:**`, `**Result:**`, or `**No change:**`; a `**Not yet:**` line says what the person must not do yet; its last line is `**Now:**`, with the one thing the person does and one link, or with nothing to do and no link. The `**Status:**` line and its `Next:` link are gone. The plugin's hook blocks a `**Now:**` line that links a list page, links the page the `**Not yet:**` line names, or holds more than one link. To use the new shape in a project created earlier, copy `plugins/sdlc/` from a new project of the same stack.
