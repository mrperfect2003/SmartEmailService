# SmartEmailService
Demo project: Smart email sending API with robust error handling and modern reliability patterns.


##  **`README.md`**
# SmartEmailService

A resilient Node.js email API with **retry logic**, **fallback providers**, **circuit breaker**, **idempotency**, **rate limiting**, and **status tracking** — all using **mock email providers**.

---

##  Features
Retry mechanism with **exponential backoff**  
Automatic fallback to a secondary provider on failure  
Circuit breaker pattern to handle repeated failures  
Idempotency to avoid duplicate sends  
Basic per-sender rate limiting  
Status tracking for every email request  
Simple HTML demo page for manual testing

---

## Project Structure

```

SmartEmailService/
├── server.js         # Express server
├── emailService.js   # Core logic: providers, retry, fallback, circuit breaker
├── public/
│   └── index.html    # Demo HTML form
├── **tests**/
│   └── emailService.test.js   # Unit tests (optional)
├── package.json
└── README.md

````

---

## Requirements

- Node.js 18+
- npm

---

##  Setup

```bash
# 1. Clone this repo
git clone https://github.com/YOUR-USERNAME/SmartEmailService.git

# 2. Navigate to the project
cd SmartEmailService

# 3. Install dependencies
npm install

# 4. Start the server
node server.js
````

Server runs by default at: **[http://localhost:3000/](http://localhost:3000/)**

---

## How it works

* **POST `/send`** — Send an email:

  ```json
  {
    "to": "abc@example.com",
    "subject": "Hello",
    "body": "This is the body",
    "sender": "sender@example.com",
    "idempotencyKey": "unique-key-123"
  }
  ```

* The service:

  1. Checks **rate limit**
  2. Checks **idempotency**
  3. Tries **Provider A** with retries
  4. If failed, falls back to **Provider B**
  5. Tracks status + attempt details

* **GET `/status/:id`** — Get full status of any email by `idempotencyKey`.

---

## Demo

Open [http://localhost:3000/](http://localhost:3000/) to access the **HTML form**.

Fill in the fields → Click **Send Email** → See JSON response immediately.

---

## Example Response

**POST `/send`**

```json
{
  "status": "SENT",
  "usedProvider": "ProviderB",
  "fallbackUsed": true,
  "attempts": [
    { "provider": "ProviderA", "attempt": 1, "result": "Failed" },
    { "provider": "ProviderA", "attempt": 2, "result": "Failed" },
    { "provider": "ProviderA", "attempt": 3, "result": "Failed" },
    { "provider": "ProviderB", "attempt": 1, "result": "Success" }
  ],
  "idempotencyKey": "unique-key-123"
}
```

---

##  Tests

Add unit tests inside `__tests__/` folder.

Example:

```bash
npm run test
```

---

##  Assumptions

* **Mock providers** simulate real email send with random failure rate.
* No real email is sent.
* Idempotency key must be **unique** per email.
* Rate limit: max 5 emails per sender per minute.

---

##  Author

**Keshav Raj**
[LinkedIn](https://www.linkedin.com/in/keshavraj18) • [GitHub](https://github.com/mrperfect2003)

---

##  License

MIT — feel free to fork, clone, and adapt!

---

##  Tips

 Use **Postman** or the **HTML demo** to test.
 Deploy to **Render**, **Vercel**, or **Railway** for free hosting.

---

Enjoy building reliable systems! 
