# Test Quality Rubric — AI Review Responder

## What Makes a Test "Meaningful"

Every test must satisfy **at least 3 of the 5** criteria below to qualify as meaningful. Tests that only check "it doesn't crash" fail the rubric.

### Criteria

| # | Criterion | Description | Example |
|---|-----------|-------------|---------|
| **C1** | **Behavior verification** | Tests an observable behavior the user/caller cares about, not implementation details | "Returns 429 when free limit exceeded" vs "calls prisma.user.update" |
| **C2** | **Boundary testing** | Tests edge cases, limits, and transitions — not just the happy path | Rate limit at exactly 5, month rollover, empty strings, missing fields |
| **C3** | **Error path coverage** | Tests failure modes: bad input, missing auth, API failures, DB errors | Missing API key → 500, expired Google token → 400, invalid Stripe signature → 400 |
| **C4** | **Security assertion** | Verifies a security property: auth required, CSRF protection, injection prevention | Unauthenticated request → 401, forged OAuth state → redirect to error |
| **C5** | **Integration contract** | Verifies correct interaction with an external system (API call shape, DB query, etc.) | Stripe webhook updates user tier, Google review sync creates DB records with AI drafts |

### Coverage Target: 95%

Measured by **statement coverage** via `vitest --coverage`. The 5% slack is for:
- Framework boilerplate (layout.tsx, providers)
- Generated Prisma client
- Third-party type re-exports

### Test Structure

```
__tests__/
  api/
    auth/
      google.test.ts          # OAuth initiation + callback + CSRF
      login.test.ts           # Disabled endpoint returns 410
      session.test.ts         # Session cookie handling
    generate-response.test.ts # AI generation + rate limiting
    google/
      locations.test.ts       # Location fetching
      reply.test.ts           # Review publishing to Google
      reviews.test.ts         # Review listing (DB only, no sync)
      sync.test.ts            # Full sync flow + AI drafts + emails
    webhook.test.ts           # Stripe webhook handling
    create-checkout.test.ts   # Stripe checkout session
    audit.test.ts             # Audit lead capture
    verify-session.test.ts    # Post-checkout verification
    reviews-draft.test.ts     # AI draft generation
  lib/
    auth.test.ts              # Session management, findOrCreateUser
    db.test.ts                # Prisma client setup
    email.test.ts             # SES email sending
    google.test.ts            # OAuth client, GBP API helpers
    pro-check.test.ts         # Stripe tier checking
```

### Per-File Test Requirements

Each API route must have tests for:
1. ✅ **Happy path** — correct input → correct output
2. ❌ **Missing/invalid input** — returns appropriate error code
3. 🔒 **Auth check** — unauthenticated → 401 (where applicable)
4. 💥 **External failure** — mocked dependency throws → graceful error
5. 🔄 **State transitions** — verify DB state before/after (where applicable)

### Scoring

| Score | Meaning |
|-------|---------|
| 5/5 criteria per test | Excellent — covers behavior, edges, errors, security, and integration |
| 3-4/5 | Good — meaningful test that catches real bugs |
| 2/5 | Marginal — might catch something but low signal |
| 1/5 | Weak — only tests that code runs without crashing |
| 0/5 | Useless — delete it |

### What We're NOT Testing

- React component rendering (no jsdom/RTL for now — API-first product)
- CSS/styling
- Third-party library internals
- Generated Prisma client code

### How to Run

```bash
npm test                # Run all tests
npm run test:coverage   # Run with coverage report
npm run test:watch      # Watch mode for development
```
