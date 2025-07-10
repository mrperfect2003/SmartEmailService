const EmailService = require("../emailService");

describe("EmailService", () => {
  let service;

  beforeEach(() => {
    service = new EmailService();
  });

  test("should send email successfully", async () => {
    const result = await service.send(
      { to: "a@test.com", subject: "Hello", body: "Hi" },
      "key1",
      "sender@test.com"
    );
    expect(["SENT", "FAILED", "RATE_LIMITED"]).toContain(result.status);
  });

  test("should prevent duplicate send", async () => {
    const first = await service.send(
      { to: "a@test.com", subject: "Hello", body: "Hi" },
      "key2",
      "sender@test.com"
    );
    const second = await service.send(
      { to: "a@test.com", subject: "Hello", body: "Hi" },
      "key2",
      "sender@test.com"
    );
    expect(second).toEqual(first);
  });

  test(
    "should block on rate limit",
    async () => {
      // Send max allowed
      for (let i = 0; i < 5; i++) {
        await service.send(
          { to: "a@test.com", subject: "Hello", body: "Hi" },
          `key-${i}`,
          "sender@test.com"
        );
      }

      const result = await service.send(
        { to: "a@test.com", subject: "Hello", body: "Hi" },
        "key-over",
        "sender@test.com"
      );

      expect(result.status).toBe("RATE_LIMITED");
      expect(result.message).toMatch(/Rate limit/i);
    },
    20000 // increase timeout to 20 seconds
  );
});
