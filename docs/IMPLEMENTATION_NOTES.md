# Implementation Notes

## Purpose
This is a Week 2 source-code skeleton, not a final POS implementation.

## Design choices
- Feature-oriented organization separates POS and Serial/IMEI boundaries.
- Backend uses a minimal Controller -> Service flow for the skeleton.
- Frontend keeps API access in dedicated feature API modules and a shared Axios client.
- No persistence layer is created because the Week 2 assignment does not provide approved database entities/business rules.
- No payment, inventory or customer workflow is invented.

## Decisions still required before expanding the module
- POS transaction data model.
- Product lookup rules.
- Cart/line-item calculation rules.
- Payment methods and payment workflow.
- Inventory deduction timing.
- Serial/IMEI validation, assignment and lifecycle rules.
- Error contract and persistence design.
