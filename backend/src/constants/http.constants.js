/**
 * HTTP_STATUS — общий для всех модулей набор статус-кодов.
 * Раньше жил внутри auth.constants.js, хотя используется и в
 * chat-роутах, и в globalException.middleware — вынесен сюда, чтобы
 * не тянуть auth-модуль из мест, не имеющих отношения к авторизации.
 */
export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY: 429,
  INTERNAL: 500,
});
