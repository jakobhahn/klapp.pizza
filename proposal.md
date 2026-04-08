# Proposal

## Summary

Build a small campaign gateway on the existing `klapp.pizza` stack:

- one permanent QR code
- multi-campaign redirect records in Supabase
- one mobile registration and verification flow
- one welcome discount issuance flow
- one returning-user redirect to Instagram
- one repeat-visit 5% incentive
- one admin redemption workflow for POS

This keeps phase 1 small, operationally realistic, and aligned with the current serverless-plus-Supabase architecture already used in the project.

## Recommended Solution

### 1. Stable QR Entry Point

Create a permanent route such as `/go/flyer` or `/r/flyer-2026`.

The QR on the printed flyer always points there. The backend reads the current active campaign target from Supabase and decides whether to:

- send an unknown user into the registration flow first, or
- send a recognized returning user straight to [joschi_hamburg on Instagram](https://www.instagram.com/joschi_hamburg/)

### 2. Lightweight Registration Flow

Create a dedicated landing page optimized for mobile:

- headline explaining that users get 10% by registering with name and email
- name field
- email field
- required service-email handling copy
- optional marketing consent checkbox
- submit
- email code entry
- confirmation that the discount code will arrive by email
- redirect to Instagram after successful verification

The flow should be single-purpose and separate from the reservation journey. Reusing the reservation form would create the wrong mental model and unnecessary friction.

### 3. Email Code Verification

Send a short-lived numeric code by email. This is preferable to a magic link for this use case because users often switch between browser and mail app when scanning from a flyer. Entering a code is more predictable than bouncing through deep links.

### 4. Discount Code Issuance

After successful verification:

- check if this email already has a welcome discount
- if not, create one
- if yes, do not issue another

The discount code should be persisted, emailed to the user, and searchable in admin so staff can redeem it reliably at the POS.

### 5. Repeat-Visit Incentive

Offer a second 5% incentive for coming again as a separate rule, not as part of the first registration discount. This should be triggered by an explicit CTA such as “Ich komme wieder” and modeled as its own coupon-record reason so reporting stays coherent.

This second code should only be valid for a later separate visit, never stacked onto the same redemption as the initial 10%. It should only become available after the first 10% code has been redeemed.

### 6. Admin Control

Add a lightweight admin surface or protected API to:

- change the active Instagram target
- turn capture mode on or off
- inspect issued codes and registrations
- mark discount codes as redeemed at the POS
- reverse mistaken redemptions
- search by code, name, or email

## Why This Proposal

- It satisfies the “same QR, different URL” requirement cleanly.
- It fits the current project architecture.
- It avoids passwords.
- It is smooth enough for a flyer scan journey.
- It gives a usable growth funnel without prematurely building a full loyalty platform.

## Technical Challenge to the Product Idea

### Email Verification Does Not Fully Prevent Abuse

You selected email as sufficient. That is reasonable for a small local campaign, but it is not strong identity. Users can still use aliases or second inboxes. The system can reduce abuse, not eliminate it.

### Coupon Validity Must Meet Real Checkout Behavior

Because redemption happens at the POS, the admin view becomes operationally critical. Staff need a fast lookup and a one-click redeem action, otherwise “single use” fails in practice.

### Redirect Semantics Need a Clear Business Rule

The practical interpretation is now clear:

- first-time or unknown user: register first
- recognized returning user: go straight to Instagram
- Instagram target: [joschi_hamburg](https://www.instagram.com/joschi_hamburg/)
- admins can change the active destination over time without changing the QR

### Consent and Marketing Use Need Separation

Marketing consent should be optional and clearly separate from the verification and coupon-delivery flow. The funnel depends on transactional emails, but that does not justify bundling newsletter permission into a required consent.

## Delivery Shape

### Phase 1

- stable QR redirect endpoint
- campaign config table
- registration page
- email code verification
- returning-user session cookie
- one-time welcome discount issuance by email
- Instagram redirect for returning users
- optional marketing-consent capture with audit trail
- basic admin controls
- event logging

### Phase 2

- resend and abuse dashboards
- CRM export
- second repeat-visit 5% discount flow
- richer campaign attribution
- POS or checkout redemption integration

## Retention

Retain registrations, scans, and redemption history for 180 days, then delete or anonymize identifiable personal data unless a stronger legal retention basis applies.

## Recommendation

Proceed with a small-campaign implementation, but treat the admin redemption workflow as first-class, not secondary. In this concept, POS redemption is the real enforcement point.
