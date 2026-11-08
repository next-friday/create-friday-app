# Documentation

This folder describes the project as it is now. A page changes in the same pull request as the code it describes. People and agents read the same files; documents for a change still in progress are in `intent/`.

Each page answers one kind of question ([Diátaxis](https://diataxis.fr/)). Create a folder when its first page exists.

| Folder         | Answers                      | Examples                                                 |
| :------------- | :--------------------------- | :------------------------------------------------------- |
| `tutorials/`   | How do I get started?        | First run of the project on a new machine                |
| `how-to/`      | How do I do this task?       | Deploy, roll back, rotate a secret, an incident runbook  |
| `reference/`   | What exactly is it?          | API, configuration, environment variables, commands      |
| `explanation/` | Why is it this way?          | Architecture, data flow, trade-offs                      |
| `adr/`         | What did we decide, and why? | Architecture decision records, as `adr/0001-…` describes |

Write each page so a person can scan it and an agent can quote it:

- Start with one `#` heading and a one-sentence summary of what the page covers.
- Cover one topic. Split a page that answers two kinds of question.
- Prefer tables and numbered steps to long paragraphs.
- Use plain Markdown. Link to other pages by relative path.
