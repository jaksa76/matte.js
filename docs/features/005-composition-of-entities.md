# 005 – Entity Composition

## Overview
Composition lets one entity own and embed other structured parts as a single lifecycle unit ("has‑a" with tight coupling). Unlike relationships (loose linkage, independent persistence), composed/owned components are saved, validated, and deleted together with the parent. This enables modular reuse (e.g. Address, Money, AuditTrail) while keeping persistence atomic and reducing boilerplate joins.

## Example Usage
```ts
import { entity, string, number, component } from 'matte';

export const Address = component('Address', [
  string('street').required(),
  string('city').required(),
  string('country').required(),
]);

export const LineItem = component('LineItem', [
  string('sku').required(),
  number('qty').min(1),
  number('unitPriceCents').required()
]);

export const Order = entity('Order', [
  string('customerId').required(),
  component('shipping').of(Address).required(),        // embedded owned component
  component('items').list(LineItem).min(1),             // composed collection
]);
```

Components are stored in separate tables.
Components cannot be queried independently.
Atomic operations on entities include their composed components.
