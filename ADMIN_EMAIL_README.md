# Admin frontend — email is removed

The API no longer sends accept or reject emails. Do not show email success or failure after Accept or Reject.

## What already happens

When the admin presses **Accept** or **Reject**, the API only updates the registration.

- **Accepted:** the candidate gets a roll number. They can open the admit card on the public site with the registration number and the mobile number from the form.
- **Rejected:** the registration is marked rejected. The admit-card page does not show a slip.

The candidate sees both numbers on the registration success page. They check the slip at `/admit-card`. If the academy has accepted the registration, the slip opens. If not, the page shows **Roll no slip coming soon**.

Do not add a “Send email” button. Do not ask for SMTP settings.

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

The JSON response no longer includes `emailSent` or `emailError`.

```json
{
  "id": "…",
  "status": "approved",
  "rollNumber": "RN-0001"
}
```

## What to change in the admin frontend

On the candidate detail screen, after Accept or Reject succeeds:

- Show only **Saved.** or **Accepted.** / **Rejected.**
- Remove **Email sent to the candidate.**
- Remove **Saved, but the email was not sent.**
- Do not read `emailSent` or `emailError`.

Keep the existing Accept, Reject, Delete, and roll-number slip buttons.

## Cursor prompt

Paste this into the admin frontend chat:

```
Email sending is removed from the API. PATCH /api/admin/registrations/:id still accepts { action: "approve" } or { action: "reject", note }. The response no longer includes emailSent or emailError.

After Accept or Reject, show only "Saved." or the new status. Delete any "Email sent to the candidate" and "Saved, but the email was not sent" messages. Do not add a send-email button and do not ask for SMTP settings. Keep Accept, Reject, Delete, and the roll-number slip controls.
```
