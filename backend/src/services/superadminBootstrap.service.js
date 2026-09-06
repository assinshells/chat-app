import { env } from "../config/env.js";
import { UserRepository } from "../repositories/user.repository.js";
import { PasswordProvider } from "../providers/password.provider.js";
import { ROLE_VALUES, GENDER_VALUES } from "../constants/auth.constants.js";
import logger from "../config/logger.js";

/**
 * ensureSuperadmin — гарантує, що при кожному старті бекенда існує
 * користувач SUPERADMIN_LOGIN з роллю 'superadmin' (саме він, за умовою
 * задачі, може призначати/знімати ролі іншим — див. constants/auth.constants.js
 * ROLE_MANAGER_ROLES і services/role.service.js).
 *
 *  - Немає такого користувача — створюється з паролем SUPERADMIN_PASSWORD.
 *  - Є, але роль інша (наприклад, хтось поправив БД напряму) — роль
 *    підвищується до 'superadmin'.
 *  - Пароль уже наявного користувача НІКОЛИ не перезаписується: інакше
 *    кожен рестарт бекенда відкочував би пароль, змінений вручну після
 *    першого запуску, назад до значення з .env.
 *
 * Викликається один раз при старті сервера (див. server.js), після
 * підключення до БД і до прийому HTTP-трафіку.
 */
export async function ensureSuperadmin() {
  const { login, password, email } = env.superadmin;

  const existing = await UserRepository.findByLogin(login);

  if (!existing) {
    const passwordHash = await PasswordProvider.hash(password);
    const created = await UserRepository.create({
      login,
      passwordHash,
      email,
      gender: GENDER_VALUES.MALE,
      role: ROLE_VALUES.SUPERADMIN,
    });

    if (created) {
      logger.info(`Заведено дефолтного суперадміна "${login}"`);
      return;
    }

    // Логін виявився зайнятий (гонка при паралельному старті кількох
    // інстансів бекенда) — просто підвищуємо роль нижче, як і для
    // випадку "користувач уже існував".
    logger.warn(
      `Не вдалося створити суперадміна "${login}" (логін вже зайнято) — перевіряю роль`,
    );
  }

  const user = existing ?? (await UserRepository.findByLogin(login));
  if (user && user.role !== ROLE_VALUES.SUPERADMIN) {
    await UserRepository.updateRole(user.id, ROLE_VALUES.SUPERADMIN);
    logger.info(`Користувача "${login}" підвищено до ролі superadmin`);
  }
}
