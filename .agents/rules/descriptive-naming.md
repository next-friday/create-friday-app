# Descriptive Naming

A path or identifier names what it holds. A reader knows what a file, directory, module, or route contains without opening it.

- **Name the responsibility.** Each file and directory name states the feature, domain concept, or role it holds.
- **No organization names.** Do not put an organization, brand, customer, or tenant name in a path or identifier. User-visible text that names the organization reads it from one configured source, not from a literal.
- **Distinguishable siblings.** Qualify a generic word such as `settings`, `config`, `utils`, `helpers`, `common`, or `detail` with its domain noun. Files that sit together each name the role they play.
- **Do not copy a name that breaks this rule.** Sibling style does not override it. Give new code a descriptive name and report the existing name to the user.

Folder names and file suffixes that the framework or toolchain requires follow that tool's convention.

_Completion criterion_: Every path and identifier the diff adds names its responsibility, contains no organization name, and is distinguishable from its siblings.
