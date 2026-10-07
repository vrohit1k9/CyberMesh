# CyberMesh Relational Database Layer

## Responsibilities (Team Member 1)
- Normalized Third Normal Form (3NF) relational design in PostgreSQL.
- Foreign keys, check constraints, and unique constraints.
- Strategic B-tree and composite indexes on identifiers, complaints, and transactions.
- PostgreSQL Recursive CTE traversal procedure.
- Synthetic realistic seed dataset featuring guaranteed demo syndicates.

## Files
- `schema.sql`: 3NF DDL table definitions.
- `indexes.sql`: B-tree performance indexing strategy.
- `procedures.sql`: Recursive CTE traversal stored function and telemetry view.
- `sample_data.sql`: 55 complaints, 127 identifiers, 125 transactions, and 4 cases.
- `generate_seed.js`: Deterministic seed generator.
