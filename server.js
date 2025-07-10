const express = require("express");
const EmailService = require("./emailService");

const app = express();
app.use(express.json());

const emailService = new EmailService();

app.get("/", (req, res) => {
  res.send("SmartEmailService is running!!!!");
});

app.post("/send", async (req, res) => {
  const { to, subject, body, idempotencyKey, sender } = req.body;

  if (!to || !subject || !body || !idempotencyKey || !sender) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const status = await emailService.send(
      { to, subject, body },
      idempotencyKey,
      sender
    );
    res.json({ status });
  } catch (err) {
    res.status(429).json({ error: err.message });
  }
});

app.get("/status/:id", (req, res) => {
  const status = emailService.getStatus(req.params.id);
  res.json({ status });
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`SmartEmailService running at http://localhost:${PORT}`)
);
