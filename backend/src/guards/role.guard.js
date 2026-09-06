import { UserRepository } from "../repositories/user.repository.js";
import { RoleForbiddenException } from "../exceptions/auth.exceptions.js";
import { NotFoundException } from "../exceptions/auth.exceptions.js";

/**
 * requireRole — Express middleware-фабрика, застосовується ПІСЛЯ
 * authGuard (потребує req.userId). На відміну від authGuard, роль
 * читається "наживо" з БД при кожному запиті, а не з access-токена:
 * access-токен навмисно несе лише userId (stateless, короткоживучий),
 * і роль, зашита в нього, могла б лишатися "старою" аж до сплину
 * терміну дії токена після зміни ролі — для дій керування ролями/
 * модерацією ця затримка неприйнятна. Ціна — один зайвий SELECT
 * лише на роутах, захищених цим guard'ом (їх мало і викликаються вони нечасто).
 *
 * Знайдена роль кладеться в req.userRole — контролеру/сервісу далі не
 * потрібно повторно її резолвити.
 */
export const requireRole = (allowedRoles) => async (req, _res, next) => {
  try {
    const user = await UserRepository.findById(req.userId);
    if (!user) return next(new NotFoundException());

    if (!allowedRoles.includes(user.role)) {
      return next(new RoleForbiddenException());
    }

    req.userRole = user.role;
    next();
  } catch (err) {
    next(err);
  }
};
