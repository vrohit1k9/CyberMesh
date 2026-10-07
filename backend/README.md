# CyberMesh Backend API Gateway

## Responsibilities (Team Member 1)
- Node.js & Express.js REST API Gateway.
- Dual-engine PostgreSQL connection layer (remote PostgreSQL via `pg` or zero-config embedded WebAssembly PostgreSQL via `pglite`).
- PostgreSQL Recursive CTE traversal query execution.
- 4-Factor Explainable Risk Scoring Engine.
- Complaints, Cases, Network, and Transactions CRUD controllers.

## How to Run
```bash
npm install
npm run db:init   # Seeds schema, indexes, procedures, and sample data
npm start         # Starts server on port 5000
```

## How to Test
```bash
npm test
```
