# Admin frontend — decision emails

Give this file to the admin frontend. The public website and the API already send the email. The admin screen only needs to show whether that email went out.

## What already happens

When the admin presses **Accept** or **Reject**, the API updates the registration and emails the candidate in English.

- **Accepted:** the email says the request was accepted, and it includes the registration number, the mobile number from the form, and the admit-card link `https://www.alkitabinternationalacademy.com/admit-card`.
- **Rejected:** the email says the request was not accepted, includes the registration number, and includes the optional rejection note if the admin typed one.

The candidate’s address is the `email` already saved on the registration. The admin frontend does not collect a new address and does not call a new email API.

Candidates who were already accepted or rejected before email was turned on are emailed automatically once, when the API starts with mail settings saved. Do not add a “send old emails” button.

Mail settings live on the API server (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `SITE_URL`). Do not put those values in the admin frontend.

## API

Same request the Accept and Reject buttons already send:

`PATCH /api/admin/registrations/:id`

```json
{ "action": "approve" }
```

Reject, with an optional note:

```json
{ "action": "reject", "note": "Payment receipt was not clear." }
```

Header: `Authorization: Bearer <token>` from `localStorage` key `alkitab_admin`.

The JSON response now also includes:

```json
{
  "id": "…",
  "status": "approved",
  "emailSent": true,
  "emailError": ""
}
```

- `emailSent: true` means the candidate’s inbox was sent the message.
- `emailSent: false` means the registration was still saved, but the email did not go. `emailError` is a short English reason, such as `Email is not configured on the server.`

Other actions (`pending`, `roll-slip`) return `emailSent: false` and an empty `emailError`. Do not show an email warning for those.

## What to build

On the candidate detail screen, after Accept or Reject succeeds:

- If `emailSent` is true, show: **Email sent to the candidate.**
- If `emailSent` is false, show: **Saved, but the email was not sent.** Then show `emailError` under it.
- Do not block Accept or Reject when the email fails. The decision is already saved.
- Do not add a separate “Send email” button.

## Cursor prompt

Paste this into the admin frontend chat:

```
The registration Accept and Reject action already calls PATCH /api/admin/registrations/:id with { action: "approve" } or { action: "reject", note }.

The response now includes emailSent (boolean) and emailError (string). The API emails the candidate. Do not add a new endpoint and do not ask for SMTP settings.

After a successful Accept or Reject, if emailSent is true show "Email sent to the candidate." If emailSent is false show "Saved, but the email was not sent." and the emailError text. Keep the existing Accept, Reject, and Delete buttons. Do not show this email note for other actions.
```
