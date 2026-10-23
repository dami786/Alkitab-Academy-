# Admin frontend — build this in a separate app

The public website already exists in `frontend`. Do not add the admin screens there. Create a new React + Tailwind app, for example `admin`, and connect it only to the API in `backend`.

Local API base URL: `http://localhost:4000`

The API already allows `http://localhost:5174`. Run the admin app on port 5174:

```bash
npm run dev -- --port 5174
```

In Vite, proxy `/api` to `http://localhost:4000`, or call `http://localhost:4000` directly and send the token header.

## Login

`POST /api/admin/login`

```json
{ "username": "admin", "password": "AlKitab@2026" }
```

Success:

```json
{ "token": "<jwt>", "username": "admin" }
```

Save the token. Send it on every admin request:

```
Authorization: Bearer <token>
```

Wrong password returns `401` with `{ "error": "..." }`.

## What the admin must show

One registrations screen with three tabs:

| Tab | API status | Meaning |
| --- | --- | --- |
| Pending | `pending` | Form submit ho chuka hai, abhi accept ya reject nahi hua |
| Accepted | `accepted` | Admin ne registration accept kar di hai |
| Rejected | `rejected` | Admin ne reject kar diya |

`accepted` aur `approved` dono same hain. List filter `accepted` bhejne par server `approved` records deta hai. Record ke andar status ki value `approved` hoti hai.

Har tab par us status ke tamam candidates ki list ho. Search name, father name, mobile, email, city, registration number, roll number, CNIC/B-Form, ya transaction ID se ho.

Ek candidate par click karne se us ki **sari** detail khule:

- Registration number, roll number
- Name, father name, date of birth, age, gender
- CNIC ya B-Form (`identityNumber`) aur document type (`identityType`: `CNIC` ya `B-Form`)
- Province, city, full address
- Mobile, email
- Payment method (`easypaisa` ya `bank`), transaction ID, aur receipt. Payment verify ya reject ka koi button nahi hai. Receipt sirf dekhne ke liye hai.
- Passport photo
- EasyPaisa ya bank ki payment receipt image
- Application status, rejection note
- Exam date, time
- Center status: `centerConfirmed` `true` ya `false`. Abhi koi sheher ka center confirm nahi hai, is liye default `false` hai
- Result, agar save ho

Photo aur receipt `GET /api/admin/registrations/:id` mein data URL hain. Inhein seedha image mein lagao:

```jsx
<img src={candidate.photo} alt="" />
<img src={candidate.receipt} alt="Payment receipt" />
```

Agar receipt PDF ho (`data:application/pdf`) to image ki jagah download link dikhao.

## List

`GET /api/admin/registrations?status=pending&q=`

`status` optional hai: `pending`, `accepted`, `rejected`, ya khali for everyone.

`payment` query ab admin screen par mat dikhao. Payment verify aur reject payment hata diye gaye hain.

Response:

```json
{
  "counts": { "all": 12, "pending": 5, "accepted": 4, "rejected": 3 },
  "registrations": [
    {
      "id": "uuid",
      "regNumber": "AKSQ-0001",
      "rollNumber": "",
      "fullName": "Ayesha Khan",
      "fatherName": "Imran Khan",
      "dob": "2012-04-15",
      "age": 14,
      "gender": "Female",
      "identityNumber": "12345-1234567-1",
      "identityType": "B-Form",
      "cnic": "",
      "bform": "12345-1234567-1",
      "province": "Punjab",
      "city": "Lahore",
      "address": "House 12, Street 4, Lahore",
      "mobile": "03001234567",
      "email": "ayesha@example.com",
      "paymentMethod": "easypaisa",
      "transactionId": "EP123456789",
      "paymentStatus": "unverified",
      "status": "pending",
      "adminNote": "",
      "examDate": "",
      "examTime": "",
      "centerConfirmed": false,
      "examVenue": "",
      "result": { "marks": "", "position": "", "remarks": "", "published": false },
      "createdAt": "2026-10-21T09:42:48.095Z",
      "hasPhoto": true,
      "hasReceipt": true
    }
  ]
}
```

List mein image file nahi aati, sirf `hasPhoto` aur `hasReceipt`. Image detail request par aati hai.

## One candidate

`GET /api/admin/registrations/:id`

Same fields as the list item, plus:

```json
{
  "photo": "data:image/png;base64,...",
  "receipt": "data:image/jpeg;base64,..."
}
```

## Actions

Candidate detail par sirf yeh decision buttons hon:

- **Accept** — jab status `pending` ya `rejected` ho
- **Reject** — jab status `pending` ya `approved` ho
- **Delete** — har status par

Verify payment aur Reject payment buttons mat banao. `verify-payment` aur `reject-payment` ab `400` dete hain: `Payment is not a separate step. Accept or reject the registration.`

Decision baad mein badli ja sakti hai. Pehle Accept kiya ho to baad mein Reject kar sakte ho. Pehle Reject kiya ho to baad mein Accept kar sakte ho.

`PATCH /api/admin/registrations/:id`

Body JSON. `action` required.

| Action | Body | Result |
| --- | --- | --- |
| `approve` | `{ "action": "approve" }` | Status `approved`. Pehli dafa roll number `RN-0001` milta hai. Payment verify zaroori nahi |
| `reject` | `{ "action": "reject", "note": "Reason" }` | Status `rejected`. Note candidate ke status page par dikhti hai. Pehle accept kiya hua record bhi reject ho jata hai |
| `roll-slip` | Neeche dekho | Us candidate ki roll number slip ki date, time, aur center |

`schedule` aur `roll-slip` dono same kaam karte hain. Naya admin `roll-slip` use kare.

Accept pending aur rejected dono par chalega. Agar roll number pehle mil chuka hai, dubara Accept par wahi number rehta hai. Naya number nahi banta.

Reject ke baad admit card band ho jata hai. Roll number database mein rehta hai, lekin candidate tab tak slip nahi khol sakta jab tak registration dubara accept na ho.

Accepted tab wahi records hain jinka `status` `approved` hai. Slip accept ke baad print hoti hai.

## Delete

`DELETE /api/admin/registrations/:id`

Bearer token chahiye. Yeh candidate, us ki passport photo, aur payment receipt delete karta hai.

```json
{ "ok": true, "id": "uuid", "regNumber": "AKSQ-0001" }
```

Record na mile to `404`.

Delete ke baad wahi CNIC, B-Form, mobile, aur email dubara register ho sakte hain. UI mein delete se pehle confirm poocho: candidate ka naam aur registration number dikhao. Delete ke baad detail band karo aur list refresh karo.

## Roll number slip

Candidate public site par Admit Card page se slip kholta hai. Admin yahi slip set karta hai. Slip par CNIC, mobile, email, aur ghar ka address nahi hota.

Abhi kisi bhi sheher ka test center confirm nahi hai. Har city aur har candidate par do options hain:

1. **Center not confirmed yet** — default. `centerConfirmed: false`, `examVenue: ""`. Slip par sheher ka naam rehta hai aur yeh jumla:
   `The test center for this city has not been confirmed yet. Your selected city is printed on this slip. The academy will add the exact address when the center is confirmed.`
2. **Center confirmed** — `centerConfirmed: true` aur `examVenue` mein kam az kam 8 characters ka address. Address khali ho to server `400` deta hai.

Date aur time khali ho sakte hain. Khali hone par slip "To be announced" dikhati hai.

### Ek candidate

`PATCH /api/admin/registrations/:id`

```json
{
  "action": "roll-slip",
  "examDate": "",
  "examTime": "",
  "centerConfirmed": false,
  "examVenue": ""
}
```

Center confirm ho jaye to:

```json
{
  "action": "roll-slip",
  "examDate": "15 March 2027",
  "examTime": "10:00 AM",
  "centerConfirmed": true,
  "examVenue": "Govt. College Hall, Mall Road, Lahore"
}
```

UI: Accepted candidate ki detail mein "Roll number slip" panel.

- Date input
- Time input
- Checkbox **Center not confirmed yet**, default checked
- Checkbox hatne par address field dikhao
- Save slip button

### Print

`GET /api/admin/registrations/:id/roll-slip`

Sirf tab chalti hai jab status `approved` ho aur roll number mil chuka ho. Warna `403`: `Accept the registration before opening the roll number slip.`

```json
{
  "regNumber": "AKSQ-0001",
  "rollNumber": "RN-0001",
  "name": "Ayesha Khan",
  "fatherName": "Imran Khan",
  "gender": "Female",
  "city": "Lahore",
  "province": "Punjab",
  "photo": "data:image/jpeg;base64,...",
  "date": "To be announced",
  "time": "To be announced",
  "centerConfirmed": false,
  "venue": "",
  "venueMessage": "The test center for this city has not been confirmed yet. ...",
  "instructions": ["Bring your printed or digital admit card and original CNIC or B-Form."],
  "competition": "Rahmat-e-Kainat ﷺ Quiz Competition 2026–27"
}
```

Is response se ek print page banao. Screen par admin chrome ho, print par sirf slip. CSS:

```css
@media print {
  .no-print { display: none !important; }
}
```

Slip par dikhao: academy name, competition title, "Admit Card / Roll Number Slip", photo, name, father name, registration number, roll number, city and province, gender, date, time. Venue tab `centerConfirmed` ho to `venue`, warna `venueMessage`. Neeche `instructions`. Button: Print / Save PDF, `window.print()`.

### Poora sheher ek sath

`PUT /api/admin/roll-slip-city`

```json
{
  "province": "Punjab",
  "city": "Lahore",
  "examDate": "",
  "examTime": "",
  "centerConfirmed": false,
  "examVenue": ""
}
```

Yeh city ka default save karta hai aur us city ke **tamam** candidates par wahi date, time, aur center likh deta hai. Response: `{ "updated": 12, "centerConfirmed": false, ... }`.

Alag screen: har city ka card.

- Province, city
- Checkbox **Center not confirmed yet**
- Confirmed ho to address
- Optional date aur time
- Button: Apply to every candidate in this city

Jab tak center confirm na ho, checkbox checked rakho aur address mat bhejo. Naya candidate jis city ko choose kare, us waqt ka city default us ki slip par copy hota hai. Approve karte waqt agar city baad mein confirm ho chuki ho aur candidate ka center abhi pending ho, to confirmed address slip par aa jata hai.

## Result

`PUT /api/admin/registrations/:id/result`

```json
{ "marks": "92", "position": "1st", "remarks": "Excellent", "published": true }
```

`published: true` hone par candidate registration number se apna result dekh sakta hai.

## Excel

`GET /api/admin/export`

Bearer token ke sath. Response ek `.xlsx` file hai. Ismein har candidate ki sari fields hain, CNIC/B-Form ek column mein.

## Counts for the home of the admin app

`GET /api/admin/overview`

```json
{
  "total": 12,
  "pending": 5,
  "approved": 4,
  "rejected": 3,
  "paymentPending": 2,
  "messages": 0
}
```

`approved` ko Accepted samjho. Admin home par "payments to check" card mat dikhao. `paymentPending` purani ginti hai. Nayi screen sirf total, pending, accepted, aur rejected dikhaye.

## Public registration, for context only

Admin app registration form na banaye. Woh public site par hai.

`POST /api/register` multipart form:

- `fullName`, `fatherName`, `dob`, `gender`
- `identityNumber` — CNIC aur B-Form ka **ek** field. Placeholder `12345-1234567-1`. 13 digits. 18 se kam umar par yeh B-Form mana jata hai, 18 ya us se zyada par CNIC.
- `province`, `city`, `address`, `mobile`, `email`
- `paymentMethod`: `easypaisa` ya `bank`
- `transactionId`
- `declaration`: `true`
- file `photo`
- file `receipt` — EasyPaisa ya bank ki payment image

Ek CNIC, B-Form, mobile, ya email dobara submit nahi ho sakta, chahe pehli application reject ho chuki ho. Server `400` deta hai.

## Suggested screens

1. Login page.
2. Registrations page: three tabs (Pending, Accepted, Rejected), search box, candidate cards or table.
3. Detail drawer or page: all text fields, passport photo, payment receipt image, and only three actions: Accept, Reject, and Delete. Do not add Verify payment or Reject payment.
4. On an accepted candidate, show Reject so the decision can be changed. On a rejected candidate, show Accept. After Accept, show the roll number and the roll-number slip panel. Default option is **Center not confirmed yet**. A separate Cities screen applies one city's date, time, and center choice to every candidate in that city. Print uses `GET /api/admin/registrations/:id/roll-slip`. Delete asks for confirmation, then removes that candidate.

Use the same burgundy `#7C2D3A`, gold `#E4B15C`, and page background `#FBF6F1` as the public site.

## Where to deploy

API Node.js aur Express hai. Registrations, messages, site text, passport photos, aur payment receipts MongoDB mein hain. Files alag `files` collection mein BSON documents hain, is liye server restart par images delete nahi hoti.

Production layout:

- **Database:** MongoDB Atlas. Connection string `MONGODB_URI` environment variable mein rakho. Database name `alkitab-quiz`.
- **API:** Render ya Railway. Root folder `backend`, start command `npm start`. `MONGODB_URI`, `MONGODB_DB`, aur `CORS_ORIGINS` set karo. `CORS_ORIGINS` mein public site aur admin site dono ke addresses hon.
- **Public website aur admin website:** do alag Cloudflare Pages projects.

Local par `backend/.env.example` ko `backend/.env` banao, Atlas URI paste karo, phir `cd backend` aur `npm run dev`. Admin app `http://localhost:4000` se baat kare.
