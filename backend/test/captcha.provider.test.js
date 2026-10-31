import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createCaptchaProvider } from "../src/providers/captcha.provider.js";
import { CaptchaUnavailableException, ValidationException } from "../src/exceptions/auth.exceptions.js";

const log = { info() {}, warn() {}, error() {} };
const cfg = { enabled: true, secret: "test-secret", verifyUrl: "https://captcha.test/verify", timeoutMs: 1000 };
const reply = (body, ok = true) => async () => ({ ok, status: ok ? 200 : 500, json: async () => body });

describe("CaptchaProvider (Turnstile)", () => {
  test("вимкнена — пропускає без запитів", async () => {
    let called = false;
    const p = createCaptchaProvider({ config: { ...cfg, enabled: false }, fetchImpl: async () => { called = true; }, log });
    assert.equal(await p.verify(undefined, "1.1.1.1"), true);
    assert.equal(called, false);
  });

  test("без токена — відмова", async () => {
    const p = createCaptchaProvider({ config: cfg, fetchImpl: reply({ success: true }), log });
    await assert.rejects(p.verify(undefined), ValidationException);
    await assert.rejects(p.verify(""), ValidationException);
    await assert.rejects(p.verify("x".repeat(5000)), ValidationException);
  });

  test("success:false — відмова; success:true — проходить; секрет іде лише в серверний запит", async () => {
    let sent;
    const p = createCaptchaProvider({
      config: cfg,
      fetchImpl: async (url, init) => {
        sent = { url, body: init.body.toString() };
        return { ok: true, json: async () => ({ success: true }) };
      },
      log,
    });
    assert.equal(await p.verify("tok", "9.9.9.9"), true);
    assert.equal(sent.url, cfg.verifyUrl);
    assert.match(sent.body, /secret=test-secret/);
    assert.match(sent.body, /response=tok/);
    assert.match(sent.body, /remoteip=9.9.9.9/);

    const bad = createCaptchaProvider({ config: cfg, fetchImpl: reply({ success: false, "error-codes": ["invalid-input-response"] }), log });
    await assert.rejects(bad.verify("tok"), ValidationException);
  });

  test("сервіс недоступний / 5xx — fail closed (503), не пропускає", async () => {
    const down = createCaptchaProvider({ config: cfg, fetchImpl: async () => { throw new Error("network"); }, log });
    await assert.rejects(down.verify("tok"), CaptchaUnavailableException);
    const err500 = createCaptchaProvider({ config: cfg, fetchImpl: reply({}, false), log });
    await assert.rejects(err500.verify("tok"), CaptchaUnavailableException);
  });

  test("hostname не збігається — відмова", async () => {
    const p = createCaptchaProvider({
      config: { ...cfg, expectedHostname: "chat.example.com" },
      fetchImpl: reply({ success: true, hostname: "evil.example" }),
      log,
    });
    await assert.rejects(p.verify("tok"), ValidationException);
  });
});
