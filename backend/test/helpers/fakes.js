import { createAuthFlowService } from "../../src/services/authFlow.service.js";

/**
 * Простий in-memory набір залежностей для AuthFlowService: без Redis і
 * PostgreSQL. Паролі "хешуються" детермінованим префіксом, щоб тести
 * могли перевірити, що в сесії/БД чистого пароля немає.
 */
export const buildHarness = (overrides = {}) => {
  const state = {
    users: [], // { id, login, email, password_hash, gender, color }
    sessions: new Map(),
    locks: new Set(),
    counters: new Map(),
    createCalls: [],
    tokenCalls: [],
    nextId: 1,
    captchaCalls: [],
  };

  const users = {
    async findByLogin(login) {
      return state.users.find((u) => u.login === login) ?? null;
    },
    async findByEmail(email) {
      return state.users.find((u) => u.email === email) ?? null;
    },
    async create(row) {
      state.createCalls.push(row);
      if (state.users.some((u) => u.login === row.login)) return null;
      if (row.email && state.users.some((u) => u.email === row.email)) return null;
      const user = {
        id: state.nextId++,
        login: row.login,
        email: row.email ?? null,
        password_hash: row.passwordHash,
        gender: row.gender,
        color: row.color,
      };
      state.users.push(user);
      return { id: user.id };
    },
  };

  let idSeq = 0;
  const sessions = {
    newId: () => `session-id-${String(++idSeq).padStart(24, "0")}`,
    async create(id, data, ttl) {
      state.sessions.set(id, { data, ttl });
    },
    async get(id) {
      const s = state.sessions.get(id);
      return s ? { data: s.data, ttlSeconds: s.ttl } : null;
    },
    async delete(id) {
      state.sessions.delete(id);
      state.locks.delete(id);
    },
    async acquireLock(id) {
      if (state.locks.has(id)) return false;
      state.locks.add(id);
      return true;
    },
    async releaseLock(id) {
      state.locks.delete(id);
    },
  };

  const counters = {
    loginFailKey: (login) => `fail:${login.toLowerCase()}`,
    regStartKey: (ip) => `start:${ip}`,
    async increment(key) {
      const n = (state.counters.get(key) ?? 0) + 1;
      state.counters.set(key, n);
      return n;
    },
    async read(key) {
      return state.counters.get(key) ?? 0;
    },
    async reset(key) {
      state.counters.delete(key);
    },
  };

  const passwords = {
    async hash(p) {
      return `hash(${p.split("").reverse().join("")})`;
    },
    async verify(p, stored) {
      return stored === `hash(${p.split("").reverse().join("")})`;
    },
  };

  const tokens = {
    async issueTokenPair(userId) {
      state.tokenCalls.push(userId);
      return {
        accessToken: `access-${userId}`,
        refreshToken: `refresh-${userId}`,
        csrfToken: `csrf-${userId}`,
      };
    },
  };

  const captcha = {
    ok: true,
    async verify(token, ip) {
      state.captchaCalls.push({ token, ip });
      if (!captcha.ok) {
        const { ValidationException } = await import(
          "../../src/exceptions/auth.exceptions.js"
        );
        throw new ValidationException("captcha failed");
      }
      return true;
    },
  };

  const config = {
    loginGuard: { maxFailures: 3, windowSeconds: 900 },
    registration: { sessionTtlSeconds: 900, startMaxPerIp: 3, startWindowSeconds: 900 },
  };

  const log = { info() {}, warn() {}, error() {} };

  const deps = { users, sessions, counters, passwords, tokens, captcha, config, log, ...overrides };
  const service = createAuthFlowService(deps);
  return { service, state, deps, captcha };
};

export const seedUser = async (h, login = "alice", password = "secret1") => {
  const hash = await h.deps.passwords.hash(password);
  const user = {
    id: h.state.nextId++,
    login,
    email: `${login}@example.com`,
    password_hash: hash,
    gender: "female",
    color: "red",
  };
  h.state.users.push(user);
  return user;
};
