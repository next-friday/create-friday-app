# Test Admission

Keep tests as small, deterministic protections for observable contracts.

Name the contract and the distinct defect a proposed test can detect before writing it. Admit a test for externally observable behavior, a public contract, a demonstrated regression, a non-trivial invariant, a meaningful failure mode, or an explicit repository verification requirement.

Choose the narrowest existing layer that owns that contract. Give each test one defect to detect. Add a case only when it catches a defect remaining cases miss. Treat coverage percentage as a measurement.

Search existing coverage first. Extend the file that already owns the contract. Create a file only when the contract has no owner or needs a different harness. Follow the nearest directory and naming pattern. Keep setup local until multiple tests share live runtime logic, then extract one helper.

Use the framework's standard assertions. Use an inline snippet unless filesystem paths, module resolution, or compiler services are the contract. Keep fixtures declarative and read-only.

When the user asks to run tests, run the narrowest owning file or filter.

_Completion criterion_: Every added or modified case maps to an admitted contract and a defect current cases would miss. Tests stay unchanged when no proposed case survives admission.
