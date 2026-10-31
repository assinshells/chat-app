import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildHarness, seedUser } from "./helpers/fakes.js";
import {
  AuthenticationException,
  ConflictException,
  RateLimitException,
  RegistrationSessionExpiredException,
  ValidationException,
} from "../src/exceptions/auth.exceptions.js";
import {
  validateLoginRequest,
  validateCompleteRegistrationRequest,
} from "../src/validators/auth.validator.js";
import { toCompleteRegistrationDto } from "../src/dto/auth.dto.js";
import { AUTH_ERRORS, LOGIN_STATUS } from "../src/constants/auth.constants.js";


describe("Авторизація (крок 1: логін/пароль)", () => {
  test("1. Існуючий логін і правильний пароль — вхід, реєстрація не стартує", async () => {
    const h = buildHarness();
    const user = await seedUser(h);
    const res = await h.service.loginOrStartRegistration({
      login: "alice",
      password: "secret1",
      ip: "1.1.1.1",
    });
    assert.equal(res.status, LOGIN_STATUS.AUTHENTICATED);
    assert.equal(res.accessToken, `access-${user.id}`);
    assert.equal(h.state.sessions.size, 0);
    assert.equal(h.state.createCalls.length, 0);
  });

  test("2. Існуючий логін і хибний пароль — відмова, нічого не змінюється", async () => {
    const h = buildHarness();
    const user = await seedUser(h);
    const hashBefore = user.password_hash;
    await assert.rejects(
      h.service.loginOrStartRegistration({ login: "alice", password: "wrong-pass", ip: "1.1.1.1" }),
      (err) =>
        err instanceof AuthenticationException &&
        err.message === AUTH_ERRORS.LOGIN_TAKEN_WRONG_PASSWORD &&
        err.statusCode === 401,
    );
    assert.equal(h.state.sessions.size, 0, "реєстраційна сесія не створюється");
    assert.equal(h.state.createCalls.length, 0, "акаунт не створюється");
    assert.equal(h.state.tokenCalls.length, 0, "токени не видаються");
    assert.equal(user.password_hash, hashBefore, "пароль не змінюється");
  });

  test("3. Новий логін — старт реєстрації без створення користувача, пароль лише у вигляді хеша", async () => {
    const h = buildHarness();
    const res = await h.service.loginOrStartRegistration({
      login: "newbie",
      password: "pass123",
      ip: "2.2.2.2",
    });
    assert.equal(res.status, LOGIN_STATUS.REGISTRATION_REQUIRED);
    assert.equal(h.state.users.length, 0, "користувача в БД ще немає");
    assert.equal(h.state.createCalls.length, 0);
    assert.equal(h.state.tokenCalls.length, 0, "авторизації ще немає");
    const stored = h.state.sessions.get(res.registrationSessionId);
    assert.equal(stored.data.login, "newbie");
    assert.ok(!JSON.stringify(stored.data).includes("pass123"), "чистого пароля в сесії немає");
    assert.equal(stored.ttl, 900, "у сесії є термін дії");
  });

  test("4–5. Порожній логін / порожній пароль — помилка валідації", () => {
    assert.throws(() => validateLoginRequest({ login: "", password: "secret1" }), ValidationException);
    assert.throws(() => validateLoginRequest({ login: "   ", password: "secret1" }), ValidationException);
    assert.throws(() => validateLoginRequest({ login: "alice", password: "" }), ValidationException);
    assert.throws(() => validateLoginRequest({ login: "alice" }), ValidationException);
    assert.throws(() => validateLoginRequest({ login: { $ne: 1 }, password: "secret1" }), ValidationException);
  });

  test("6. Перебір пароля — після ліміту невдалих спроб вхід блокується", async () => {
    const h = buildHarness();
    await seedUser(h);
    for (let i = 0; i < 3; i++) {
      await assert.rejects(
        h.service.loginOrStartRegistration({ login: "alice", password: `bad-pass-${i}`, ip: "3.3.3.3" }),
        AuthenticationException,
      );
    }
    // навіть правильний пароль тепер не проходить, поки не спливе вікно
    await assert.rejects(
      h.service.loginOrStartRegistration({ login: "Alice", password: "secret1", ip: "9.9.9.9" }),
      RateLimitException,
    );
    assert.equal(h.state.tokenCalls.length, 0);
  });

  test("Ліміт стартів реєстрації з однієї IP", async () => {
    const h = buildHarness();
    for (let i = 0; i < 3; i++) {
      await h.service.loginOrStartRegistration({ login: `user${i}`, password: "pass123", ip: "4.4.4.4" });
    }
    await assert.rejects(
      h.service.loginOrStartRegistration({ login: "user99", password: "pass123", ip: "4.4.4.4" }),
      RateLimitException,
    );
  });

  test("Правила нового акаунта: коротка/довга/з пробілами назва — відхиляється, сесія не створюється", async () => {
    const h = buildHarness();
    for (const login of ["ab", "x".repeat(21), " lead", "trail "]) {
      await assert.rejects(
        h.service.loginOrStartRegistration({ login, password: "pass123", ip: "5.5.5.5" }),
        ValidationException,
        `логін «${login}»`,
      );
    }
    assert.equal(h.state.sessions.size, 0);
  });

  test("Нова спроба входу замінює попередню незавершену реєстраційну сесію", async () => {
    const h = buildHarness();
    const first = await h.service.loginOrStartRegistration({ login: "first", password: "pass123", ip: "6.6.6.6" });
    const second = await h.service.loginOrStartRegistration({
      login: "second",
      password: "pass123",
      ip: "6.6.6.6",
      previousSessionId: first.registrationSessionId,
    });
    assert.equal(h.state.sessions.has(first.registrationSessionId), false);
    assert.equal(h.state.sessions.has(second.registrationSessionId), true);
  });
});

describe("Завершення реєстрації («В чат»)", () => {
  const start = async (h, login = "newbie", password = "pass123") =>
    (await h.service.loginOrStartRegistration({ login, password, ip: "7.7.7.7" })).registrationSessionId;

  test("7+16. Коректний email + CAPTCHA — акаунт створено, вхід виконано, стать unknown і колір black", async () => {
    const h = buildHarness();
    const sessionId = await start(h);
    const res = await h.service.completeRegistration({
      sessionId,
      email: "new@example.com",
      captchaToken: "tok",
      ip: "7.7.7.7",
    });
    assert.equal(res.status, LOGIN_STATUS.AUTHENTICATED);
    assert.ok(res.accessToken && res.refreshToken && res.csrfToken);
    assert.equal(h.state.users.length, 1);
    const [u] = h.state.users;
    assert.equal(u.login, "newbie");
    assert.equal(u.email, "new@example.com");
    assert.equal(u.gender, "unknown");
    assert.equal(u.color, "black");
    assert.ok(!u.password_hash.includes("pass123"), "пароль зберігається лише як хеш");
    assert.deepEqual(h.state.captchaCalls, [{ token: "tok", ip: "7.7.7.7" }]);
    assert.equal(h.state.sessions.size, 0, "сесія завершена");
  });

  test("8. Відмова від email — реєстрація без email (null, без фіктивної адреси)", async () => {
    const h = buildHarness();
    const sessionId = await start(h);
    const dto = toCompleteRegistrationDto({ noEmail: true, email: "ignored@example.com" });
    assert.equal(dto.email, null);
    await h.service.completeRegistration({ sessionId, ...dto, ip: "7.7.7.7" });
    assert.equal(h.state.users[0].email, null);
  });

  test("9–10. Email без відмови обов'язковий і має бути коректним", () => {
    assert.throws(() => validateCompleteRegistrationRequest({ noEmail: false }), ValidationException);
    assert.throws(() => validateCompleteRegistrationRequest({ noEmail: false, email: "  " }), ValidationException);
    assert.throws(() => validateCompleteRegistrationRequest({ noEmail: false, email: "not-an-email" }), ValidationException);
    assert.throws(() => validateCompleteRegistrationRequest({ email: "a@b.co" }), ValidationException, "noEmail обов'язковий булевий прапор");
    assert.doesNotThrow(() => validateCompleteRegistrationRequest({ noEmail: false, email: "a@b.co" }));
    assert.doesNotThrow(() => validateCompleteRegistrationRequest({ noEmail: true }));
  });

  test("11. Некоректна CAPTCHA — відмова, акаунт не створюється, сесія залишається для повтору", async () => {
    const h = buildHarness();
    const sessionId = await start(h);
    h.captcha.ok = false;
    await assert.rejects(
      h.service.completeRegistration({ sessionId, email: "a@b.co", captchaToken: "bad", ip: "7.7.7.7" }),
      ValidationException,
    );
    assert.equal(h.state.users.length, 0);
    assert.equal(h.state.createCalls.length, 0);
    assert.ok(h.state.sessions.has(sessionId));
    assert.equal(h.state.locks.size, 0, "замок знято");
  });

  test("12. Відсутня / прострочена сесія — відмова з пропозицією почати заново", async () => {
    const h = buildHarness();
    for (const sessionId of [undefined, "nonexistent-session-id-000000"]) {
      await assert.rejects(
        h.service.completeRegistration({ sessionId, email: "a@b.co", captchaToken: "t", ip: "1.1.1.1" }),
        (err) => err instanceof RegistrationSessionExpiredException && err.statusCode === 410,
      );
    }
    assert.equal(h.state.createCalls.length, 0);
  });

  test("13. Повторна/паралельна відправка — рівно один акаунт", async () => {
    const h = buildHarness();
    const sessionId = await start(h);
    const args = { sessionId, email: "a@b.co", captchaToken: "t", ip: "7.7.7.7" };
    const results = await Promise.allSettled([
      h.service.completeRegistration(args),
      h.service.completeRegistration(args),
      h.service.completeRegistration(args),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(h.state.users.length, 1);
    assert.equal(h.state.createCalls.length, 1);
    // повторне використання вже завершеної сесії
    await assert.rejects(h.service.completeRegistration(args), RegistrationSessionExpiredException);
    assert.equal(h.state.users.length, 1);
  });

  test("14. Логін зайнято до завершення реєстрації — акаунт не створюється, сесія знищується", async () => {
    const h = buildHarness();
    const sessionId = await start(h, "racer");
    await seedUser(h, "racer", "someone-else");
    await assert.rejects(
      h.service.completeRegistration({ sessionId, email: "a@b.co", captchaToken: "t", ip: "7.7.7.7" }),
      (err) => err instanceof ConflictException && err.message === AUTH_ERRORS.LOGIN_TAKEN,
    );
    assert.equal(h.state.createCalls.length, 0);
    assert.equal(h.state.sessions.size, 0);
    assert.equal(h.state.tokenCalls.length, 0);
  });

  test("14b. Email уже зайнятий — 409, сесія лишається, можна виправити email", async () => {
    const h = buildHarness();
    await seedUser(h, "alice"); // alice@example.com
    const sessionId = await start(h);
    await assert.rejects(
      h.service.completeRegistration({ sessionId, email: "alice@example.com", captchaToken: "t", ip: "7.7.7.7" }),
      (err) => err instanceof ConflictException && err.message === AUTH_ERRORS.EMAIL_TAKEN,
    );
    assert.ok(h.state.sessions.has(sessionId));
    await h.service.completeRegistration({ sessionId, email: "other@example.com", captchaToken: "t", ip: "7.7.7.7" });
    assert.equal(h.state.users.filter((u) => u.login === "newbie").length, 1);
  });

  test("14c. Гонка на рівні БД (UNIQUE) — create повертає null → 409, без 500 і без токенів", async () => {
    const h = buildHarness();
    const sessionId = await start(h, "racer2");
    let findCalls = 0;
    // Перша перевірка бачить "вільно"; між нею і INSERT інший запит
    // встиг зайняти логін — репозиторій (23505) повертає null.
    h.deps.users.findByLogin = async (login) => (++findCalls === 1 ? null : { id: 99, login });
    h.deps.users.create = async (row) => {
      h.state.createCalls.push(row);
      return null;
    };
    await assert.rejects(
      h.service.completeRegistration({ sessionId, email: "a@b.co", captchaToken: "t", ip: "7.7.7.7" }),
      (err) => err instanceof ConflictException && err.message === AUTH_ERRORS.LOGIN_TAKEN,
    );
    assert.equal(h.state.tokenCalls.length, 0);
    assert.equal(h.state.sessions.size, 0);
  });

  test("15. Помилка БД при створенні — без часткового акаунта, без токенів, повтор можливий", async () => {
    const h = buildHarness();
    const sessionId = await start(h);
    const realCreate = h.deps.users.create;
    h.deps.users.create = async () => {
      throw new Error("db down");
    };
    await assert.rejects(
      h.service.completeRegistration({ sessionId, email: "a@b.co", captchaToken: "t", ip: "7.7.7.7" }),
      /db down/,
    );
    assert.equal(h.state.users.length, 0);
    assert.equal(h.state.tokenCalls.length, 0);
    assert.ok(h.state.sessions.has(sessionId), "сесія збережена для повторної спроби");
    assert.equal(h.state.locks.size, 0, "замок знято");

    h.deps.users.create = realCreate;
    const res = await h.service.completeRegistration({ sessionId, email: "a@b.co", captchaToken: "t2", ip: "7.7.7.7" });
    assert.equal(res.status, LOGIN_STATUS.AUTHENTICATED);
    assert.equal(h.state.users.length, 1);
  });

  test("Скасування реєстрації видаляє сесію; getRegistrationSession віддає логін із сервера", async () => {
    const h = buildHarness();
    const sessionId = await start(h, "cancelme");
    const info = await h.service.getRegistrationSession({ sessionId });
    assert.equal(info.login, "cancelme");
    await h.service.cancelRegistration({ sessionId });
    await assert.rejects(h.service.getRegistrationSession({ sessionId }), RegistrationSessionExpiredException);
    await assert.doesNotReject(h.service.cancelRegistration({ sessionId: undefined }));
  });

  test("Вхід після реєстрації тим самим логіном і паролем працює (сценарій A)", async () => {
    const h = buildHarness();
    const sessionId = await start(h);
    await h.service.completeRegistration({ sessionId, email: null, captchaToken: "t", ip: "7.7.7.7" });
    const res = await h.service.loginOrStartRegistration({ login: "newbie", password: "pass123", ip: "8.8.8.8" });
    assert.equal(res.status, LOGIN_STATUS.AUTHENTICATED);
  });
});
