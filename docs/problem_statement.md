# Problem Statement

Account Takeover (ATO) attacks are a leading cause of online banking fraud. An
attacker who obtains a customer's credentials can log in from a new device, in a
new geography, at unusual times, and quickly drain funds via large transfers to
new beneficiaries.

Static rules alone (block country X, allow IP range Y) are easy to bypass and
generate too many false positives. Manual review queues cannot keep up with the
volume of digital transactions.

## What we are solving

AccountGuard AI demonstrates a practical, explainable risk engine that scores
each login and transaction against multiple behavioural signals:

- New / unknown device
- Unusual city or country
- Login at odd hours (12 AM - 5 AM)
- Login outside the customer's usual hours
- Failed login / wrong password
- Suspicious IP
- High transaction amount vs the customer's average
- New beneficiary
- Transactions in an unfamiliar geography or at odd hours

Each signal contributes points to a final 0-100 risk score. The score maps to a
risk level (Low / Medium / High / Critical) which drives a recommended action
(allow, step-up verification, block, or freeze the session).

## Why this approach

- **Explainable**: every score comes with a list of contributing reasons that an
  analyst can read in plain English.
- **Lightweight**: the engine is a pure function over the request data and
  customer profile, so it runs in milliseconds and is easy to A/B test.
- **ML-ready**: signal extraction is decoupled from scoring, so the same
  features can later feed a supervised fraud model trained on historical labels.
