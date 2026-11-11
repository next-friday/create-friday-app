---
name: compliance-policy
description: Apply the organization's compliance policy. Use whenever writing or reviewing a spec.md, a plan, or code that this policy covers.
---

# Compliance policy

Owner: the code owner of this folder in `.github/CODEOWNERS`.

Standard: the eight basic principles of the [OECD Guidelines Governing the Protection of Privacy and Transborder Flows of Personal Data](https://legalinstruments.oecd.org/en/instruments/OECD-LEGAL-0188) (adopted 1980, revised 2013), paragraphs 7 to 14. This is the default and names no country's law; the owner adds the laws and contracts that bind the organization by editing this file. The points below summarize those paragraphs; the standard's text governs.

## Rules

1. A change that collects, stores, shows, sends, or deletes no data about a person meets this policy; say "Does not apply" and why.
2. For any other change, the spec lists each kind of personal data the change touches and answers the eight points below for it. Each answer becomes a requirement.
   1. **Collection limitation:** what is collected, by what lawful and fair means, and how the person knows or consents.
   2. **Data quality:** why each field is relevant to the purpose, and how it is kept accurate and up to date.
   3. **Purpose specification:** the purpose, stated no later than the moment of collection.
   4. **Use limitation:** who else receives the data. A use that is incompatible with the stated purpose needs the person's consent or the authority of law.
   5. **Security safeguards:** how the data is protected against loss and against unauthorised access, destruction, use, modification, or disclosure. The security policy gives the rules.
   6. **Openness:** where a person can read what data is held, its main purposes, and who controls it.
   7. **Individual participation:** how a person learns whether data about them is held, gets it within a reasonable time and at no excessive charge, is given reasons when a request is denied, and challenges it; when the challenge succeeds, the data is erased, rectified, completed, or amended.
   8. **Accountability:** who in the organization answers for these points.
3. A point the spec cannot answer from the files is an area of concern. Never guess a legal basis.
4. Whether a specific law applies is a decision for the owner; raise it as an area of concern.
