# Specification Lock Evidence

- Research handoff SHA-256: `989C2102F06CD13C380FF04AA9C8C53F2DE1343898ACA5E01EEEA2BCF953F435`
- Stage 1 SHA-256: `40EEF9100154CF008A6D424D703772ED730FE15B1C416E9B3BB4112EFCE2DB1B`
- Stage 2 SHA-256: `0B7A1FBF383DE4541E4E25F8F0556A399D312331D0BB1204D554F24A428CCC07`
- Canonical R12 SHA-256: `3464E830908CB1D87504057567242D36BDCD0C4FD59934B7D22F6482C6799ED2`
- `genvm-linter 0.11.0` with runner `v0.2.16` and dependency `1jb45...`: lint and semantic validation PASS; schema exposed one address constructor, one `u256`/integer view argument, and one write.
- Newer dependency `1zr6...` with runner `v0.3.0-rc7`: lint PASS, semantic validation FAIL `E101: Failed to load SDK: No module named 'genlayer.py'`; not selected.
- Official documentation checked 2026-09-07: linter/schema workflow, class-body storage, sized `u256`, `gl.nondet.exec_prompt(..., response_format='json')`, and custom `gl.vm.run_nondet_unsafe` remain documented.
- Technical decision: preserve the Stage 2 custom leader/validator mechanism; independently rederive the complete stable label vector and mutate storage only after accepted consensus.
- Material adaptation: none.
