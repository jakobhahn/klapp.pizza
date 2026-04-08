# Roadmap

## Phase 0: Product Decisions

- Use “Ich komme wieder” as the CTA copy for the repeat-visit incentive unless live testing suggests a better phrase.
- Issue the repeat-visit 5% only after prior redemption of the 10% code.
- Confirm privacy, consent, and 180-day retention requirements for transactional emails and optional marketing signup.
- Finalize admin redemption and reversal behavior.

## Phase 1: Foundation

- Add a permanent QR entry route on the `klapp.pizza` domain.
- Add Supabase tables for campaign redirects, registrations, verification codes, discount codes, and scan events.
- Add API endpoints for scan resolution, registration start, verification, and discount issuance.
- Add a secure session cookie flow for recognized returning users.
- Add SMTP email templates for verification codes.
- Add SMTP email templates for welcome discount delivery.
- Add rate limiting and basic abuse controls.

## Phase 2: User Experience

- Build a dedicated flyer landing page optimized for mobile.
- Keep the form to name and email only, plus required transactional-email copy and optional marketing consent.
- Add code entry flow with resend and error states.
- Show success state confirming that the code will be sent by email.
- Redirect verified users to `https://www.instagram.com/joschi_hamburg/`.
- Add a repeat-visit CTA such as “Ich komme wieder” for eligible returning users.
- Preserve session state when the user switches to the email app and back.

## Phase 3: Admin and Operations

- Add admin controls for changing the active Instagram target.
- Add admin controls for enabling or disabling capture mode.
- Add registration and discount-code inspection views.
- Add a fast redeem action in admin for POS use.
- Add redemption reversal in admin.
- Add search by code, name, or email.
- Add audit logs for code issuance and redemption status changes.

## Phase 4: Validation

- Test QR scan flow on iPhone and Android.
- Test email delivery and verification expiry paths.
- Test duplicate-registration and duplicate-claim scenarios.
- Test manual campaign URL changes without reprinting the QR.
- Run a small real-world pilot before printing at scale.

## Phase 5: Hardening

- Add bot and abuse monitoring.
- Add analytics for scan-to-register and register-to-redeem conversion.
- Add analytics for repeat-visit incentive performance.
- Add campaign scheduling if redirect changes need automation.
- Add a retention job to delete or anonymize personal data after 180 days.
