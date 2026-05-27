## Why

Audit (docs_code_audit) found legacy `POST /approve` and `permissionsApproved` still in code while proposal-simple uses settings flow (P2b).

## What Changes

- Return **410 Gone** on `POST /api/modules/:id/approve` with migration message
- Add `core/src/modules/lifecycle.ts` with official status transitions
- Document `permissionsApproved` as deprecated (no runtime gate)

## Capabilities

### Modified Capabilities

- `standalone-settings-form-and-lifecycle`: Approve API removed from active flow

## Impact

- Breaking for clients calling `/approve` — intentional deprecation with 410 body
