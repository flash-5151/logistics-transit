# Feature-Based Architecture & Reuse Strategy

This directory follows a feature-driven architecture. Instead of organizing by technical concerns (e.g., all contexts in one folder, all hooks in another), code is grouped by the business domain or feature it implements.

## Core Features
- `requests/`: Everything related to creating, matching, and viewing blood requests.
- `inventory/`: Blood stock management.
- `transfers/`: Logistics and transit tracking.
- `analytics/`: Prediction models, heatmaps, and stats.
- `users/`: Role management and directory.

## Strict Reuse Strategy

As mandated by the architecture plan, **we do NOT create role-specific copies of features or components.** 

### How it works:
1. **Generic Core**: Build a feature component like `RequestTable` to handle all possible actions.
2. **Prop-Driven Permissions**: Pass an `allowedActions` array prop from the parent Route/Page based on the authenticated user's role.
3. **No Duplication**: The `HospitalDashboard` and the `AdminRequestsView` import the *exact same* `RequestTable` from `src/features/requests/components/RequestTable.tsx`.

### Example
```tsx
// Inside Hospital Dashboard
<RequestTable 
  data={myRequests} 
  allowedActions={['match', 'cancel']} 
/>

// Inside Admin Global View
<RequestTable 
  data={allRequests} 
  allowedActions={['view_transfers']} 
/>
```
This guarantees zero code duplication and high maintainability.
