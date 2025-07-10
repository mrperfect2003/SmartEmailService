class MockProvider {
  constructor(name, failRate = 0.3) {
    this.name = name;
    this.failRate = failRate;
  }

  async sendEmail(email) {
    console.log(`[${this.name}] Sending email...`);
    await new Promise((r) => setTimeout(r, 200));
    if (Math.random() < this.failRate) {
      throw new Error(`[${this.name}] Failed to send email.`);
    }
    console.log(`[${this.name}] Email sent successfully.`);
    return true;
  }
}

class CircuitBreaker {
  constructor(failureThreshold = 3, cooldown = 5000) {
    this.failureThreshold = failureThreshold;
    this.cooldown = cooldown;
    this.failureCount = 0;
    this.lastFailedTime = null;
  }

  canRequest() {
    if (
      this.failureCount >= this.failureThreshold &&
      Date.now() - this.lastFailedTime < this.cooldown
    ) {
      return false;
    }
    return true;
  }

  recordSuccess() {
    this.failureCount = 0;
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailedTime = Date.now();
  }
}

class EmailService {
  constructor() {
    this.providerA = new MockProvider("ProviderA", 0.5);
    this.providerB = new MockProvider("ProviderB", 0.2);

    this.circuitA = new CircuitBreaker();
    this.circuitB = new CircuitBreaker();

    this.idempotencyStore = new Map();
    this.rateLimitStore = new Map();
    this.statusStore = new Map();

    this.RATE_LIMIT = 5; // per sender per minute
  }

  checkRateLimit(sender) {
    const now = Date.now();
    const timestamps = this.rateLimitStore.get(sender) || [];
    const fresh = timestamps.filter((t) => now - t < 60000);
    fresh.push(now);
    this.rateLimitStore.set(sender, fresh);
    return fresh.length <= this.RATE_LIMIT;
  }

  async send(email, idempotencyKey, sender) {
    if (this.idempotencyStore.has(idempotencyKey)) {
      console.log("Duplicate request. Skipping send.");
      return this.statusStore.get(idempotencyKey);
    }

    if (!this.checkRateLimit(sender)) {
      const response = {
        status: "RATE_LIMITED",
        message: "Rate limit exceeded. Try again later.",
        idempotencyKey
      };
      this.statusStore.set(idempotencyKey, response);
      return response;
    }

    this.idempotencyStore.set(idempotencyKey, true);

    const maxRetries = 3;
    let attemptDetails = [];

    const attemptSend = async (provider, circuit) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (!circuit.canRequest()) {
          attemptDetails.push({
            provider: provider.name,
            attempt,
            result: "Circuit breaker open",
          });
          throw new Error("Circuit breaker open");
        }
        try {
          await provider.sendEmail(email);
          circuit.recordSuccess();
          attemptDetails.push({
            provider: provider.name,
            attempt,
            result: "Success",
          });
          return true;
        } catch (err) {
          circuit.recordFailure();
          console.log(`[${provider.name}] Attempt ${attempt} failed.`);
          attemptDetails.push({
            provider: provider.name,
            attempt,
            result: "Failed",
          });
          const backoff = Math.pow(2, attempt) * 500;
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
      throw new Error(`[${provider.name}] All attempts failed`);
    };

    let usedProvider = null;
    let fallbackUsed = false;
    let finalStatus = "FAILED";

    try {
      if (this.circuitA.canRequest()) {
        await attemptSend(this.providerA, this.circuitA);
        usedProvider = this.providerA.name;
        finalStatus = "SENT";
      } else {
        throw new Error("ProviderA circuit open");
      }
    } catch {
      console.log("Fallback to ProviderB...");
      fallbackUsed = true;
      try {
        await attemptSend(this.providerB, this.circuitB);
        usedProvider = this.providerB.name;
        finalStatus = "SENT";
      } catch {
        finalStatus = "FAILED";
      }
    }

    const response = {
      status: finalStatus,
      usedProvider,
      fallbackUsed,
      attempts: attemptDetails,
      idempotencyKey
    };

    this.statusStore.set(idempotencyKey, response);
    return response;
  }

  getStatus(id) {
    return this.statusStore.get(id) || {
      status: "UNKNOWN",
      message: "No record found for this idempotencyKey.",
      idempotencyKey: id
    };
  }
}

module.exports = EmailService;
