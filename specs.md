# Flyer QR Redirect and Registration Spec

## Problem Statement

The flyer should always print the same QR code, while the destination behind that QR code can change over time without reprinting the flyer. On first use, the scanned experience should push the user through a minimal registration flow, verify identity with an email code, and grant a one-time 10% discount code by email.

The system must feel smooth on mobile, be simple enough for low-intent users, and still avoid obvious abuse.

Business goal: bring people into the shop, increase awareness locally, and lower the barrier for first-time trial of the pizza offer.

## Goals

- One permanent QR code on printed material.
- The redirect target can be changed by admins without regenerating the QR.
- Registration is minimal: name plus email, then email verification code.
- A verified user receives one 10% discount code exactly once.
- Returning users should be redirected straight to Instagram.
- The system may offer a second 5% incentive for coming again.
- The scan-to-discount journey should be fast, mobile-first, and understandable without explanation.

## Non-Goals

- Full loyalty program.
- Password-based accounts.
- Heavy CRM features in phase 1.
- Multi-channel identity verification beyond email in phase 1.
- Complex coupon stacking rules in phase 1 unless POS integration requires them.

## Core User Flow

1. User scans the flyer QR code.
2. QR lands on a stable redirect URL owned by us, for example `/go/flyer`.
3. System checks whether the browser already has a valid returning-user session.
4. If the user is already recognized, they are sent straight to Instagram.
5. If the user is not recognized, they land on a mobile-first registration page.
6. User enters name and email.
7. System sends a short-lived verification code by email.
8. User can verify immediately or later.
9. After verification, the system marks the identity as verified and generates one 10% discount code by email if the verified email has never received one before.
10. User is then redirected to Instagram.
11. The Instagram destination is `https://www.instagram.com/joschi_hamburg/`.
12. Returning users may trigger a second 5% repeat-visit incentive via a clear CTA such as “Ich komme wieder”.

## Functional Requirements

### QR Redirect Layer

- A single stable QR URL must exist and stay unchanged across flyer reprints.
- Admins must be able to change the destination URL without changing the QR.
- Redirect logic should support:
  - unknown user: registration flow first
  - recognized returning user: direct redirect to Instagram
  - fallback URL if campaign is disabled or misconfigured
- Redirect events should be logged with timestamp, campaign id, and coarse attribution metadata.
- User recognition should primarily rely on a durable browser session token linked to the verified registration.
- A scan alone cannot identify a person uniquely; recognition only works after the first successful registration in that browser context.

### Registration

- Registration form should ask only for:
  - full name
  - email
- The landing page should clearly explain that users receive 10% discount by registering with name and email.
- The form should separate required transactional email handling from optional marketing consent.
- Email input should be normalized to lowercase and trimmed.
- Name should support normal human names without over-validation.
- The form should be optimized for mobile and complete in under 30 seconds for most users.

### Identity Verification

- Verification should use a short numeric email code.
- Code TTL should be short, for example 10 minutes.
- Resend must be rate-limited.
- Verification attempts must be rate-limited per email and IP/device fingerprint where feasible.
- A verified email may only claim the welcome discount once.
- Users who do not complete verification immediately should be able to return later and finish verification without restarting from zero.
- Transactional emails for verification and discount delivery are required to operate the flow.

### Discount Issuance

- A verified identity receives one 10% discount code exactly once.
- The code must be unique, auditable, and tied to the verified identity record.
- Re-scanning the flyer should not issue a second welcome discount to the same verified user.
- The discount percent is fixed at 10 for this campaign.
- If the user already has a code, the system should not issue a new one.
- The first welcome discount code should be delivered by email, not shown immediately in the browser.
- A second 5% repeat-visit incentive is in scope as a separate promotional rule and must not be conflated with the one-time email-registration discount.
- The second 5% repeat-visit incentive should be triggered by an explicit user action such as clicking an “I want to come again” button.
- The second 5% repeat-visit incentive must be valid only for a later separate visit and must not stack with the first 10% welcome discount on the same purchase.
- The second 5% repeat-visit incentive becomes available only after the initial 10% welcome code has been redeemed.

### Consent and Compliance

- Marketing consent must be optional, separate from the discount flow, and not preselected.
- The system must record marketing consent evidence:
  - timestamp
  - consent text version
  - campaign source
  - request IP hash where feasible
- The user must be able to unsubscribe from marketing emails easily.
- Receiving the discount must not depend on marketing consent.

### Admin

- Admins need a simple way to:
  - update current Instagram destination
  - enable or disable registration gating
  - inspect registrations
  - inspect issued discount codes
  - mark discount codes as redeemed at the POS
  - invalidate misconfigured campaigns
- Admin access should reuse the existing admin password model already used in the project.
- Staff should be able to search redemption records by code, name, or email.
- Before redeeming, staff should see name, email, issued time, redeemed status, and redeemed time if applicable.
- Redemption mistakes must be reversible by admin.

## Data Model

### `campaign_redirects`

- `id`
- `slug`
- `target_url`
- `channel` (`instagram`, `other`)
- `mode` (`capture_then_redirect`, `direct_for_returning`)
- `is_active`
- `starts_at`
- `ends_at`
- `created_at`
- `updated_at`

### `lead_registrations`

- `id`
- `campaign_id`
- `name`
- `email_normalized`
- `email_verified_at`
- `service_email_accepted_at`
- `marketing_consent_granted_at` nullable
- `marketing_consent_text_version` nullable
- `first_scan_at`
- `last_scan_at`
- `created_at`
- `updated_at`

### `email_verification_codes`

- `id`
- `registration_id`
- `code_hash`
- `expires_at`
- `consumed_at`
- `attempt_count`
- `created_at`

### `discount_codes`

- `id`
- `registration_id`
- `code`
- `discount_percent`
- `reason` (`welcome_registration`, `repeat_visit`)
- `eligible_after_redemption_id` nullable
- `issued_at`
- `redeemed_at`
- `redemption_reference`
- `redeemed_by_admin`
- `status`

### `scan_events`

- `id`
- `campaign_id`
- `registration_id` nullable
- `request_ip_hash`
- `user_agent`
- `referer`
- `created_at`

## Technical Constraints and Risks

### Identity is not the same as personhood

Email verification proves control over an inbox, not that the scanner is a unique real-world person. If “one discount per human” matters, email-only verification is weak and will be abused with alias emails or multiple inboxes.

This design accepts that tradeoff because the campaign is intentionally small.

### Coupon Redemption Depends on Operations

Because redemption happens at the POS, staff or admin tooling must explicitly mark codes as redeemed. If that step is skipped in real operations, one-time enforcement collapses even if the software is correct.

### QR Redirect Must Stay Under Our Control

The QR code should point to a domain and route we own permanently. If it points directly at a third-party campaign URL, the “same QR, changing destination” requirement fails.

### Smooth UX Requires Session Design

If the user is forced to re-enter data after email verification or after switching apps to open email, drop-off will increase. The flow should survive app switching and resume smoothly.

## Recommended Phase 1 Approach

- Use a stable redirect endpoint on the existing domain.
- Store multi-campaign config in Supabase.
- Build a dedicated mobile landing page for flyer scans.
- Use passwordless email-code verification, not magic links, because codes are easier when the email app opens separately.
- Send one welcome discount by email after successful verification.
- Set a signed browser session cookie after successful verification so returning users can skip registration and go straight to Instagram for 90 days.
- Model the repeat-visit 5% incentive separately from the registration discount.
- Start with basic anti-abuse controls, because this is a small campaign and email-only is acceptable.
- Separate required transactional email handling from optional marketing consent in both UI and storage.
- Use `https://www.instagram.com/joschi_hamburg/` as the returning-user destination.

## Acceptance Criteria

- A printed QR code continues working after the target URL changes.
- An admin can update the active target URL without code changes.
- A new user can register with name and email and verify with an email code.
- A verified user receives one 10% welcome discount code by email once.
- A repeated scan by the same verified email does not generate another first-time discount.
- A recognized returning user in the same browser can scan again within 90 days and go straight to Instagram.
- The Instagram destination used for returning users is `https://www.instagram.com/joschi_hamburg/`.
- Admins can inspect and mark codes as redeemed in the protected admin area.
- Admins can search redemption records by code, name, or email.
- Admins can reverse an accidental redemption.
- Users can receive the discount without opting into marketing emails.
- Optional marketing consent is stored with audit data.
- A returning user can request a separate 5% repeat-visit code through an explicit CTA.
- The 5% repeat-visit code cannot be redeemed on the same visit as the first 10% welcome code.
- All critical actions are logged.

## Open Decisions

- The repeat-visit CTA copy should be “Ich komme wieder” unless later campaign testing suggests a better phrase.
- Personal data, scan data, and redemption data should be deleted or anonymized after 180 days unless a stronger legal retention basis applies.
