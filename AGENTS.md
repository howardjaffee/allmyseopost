# Project conventions
- Keyword research uses authenticated server functions and the workspace Semrush connector; credentials never enter browser code.
- Keyword metric parsing lives in a client-safe module so missing data and numeric ranges can be tested independently.
- Article generator keyword handoff uses validated URL search parameters so a selected keyword survives direct navigation and refresh.