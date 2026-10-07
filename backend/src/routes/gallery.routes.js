import { Router, json } from "express";
import { GalleryController } from "../controllers/gallery.controller.js";
import { authGuard } from "../guards/auth.guard.js";
import { csrfProtection } from "../middlewares/csrf.middleware.js";
import { RateLimitProvider } from "../providers/rateLimit.provider.js";
import { GALLERY_ERRORS, GALLERY_LIMITS } from "../constants/gallery.constants.js";
import { GalleryValidationException } from "../exceptions/gallery.exceptions.js";

const router = Router();

// Власний JSON-парсер з підвищеним лімітом (глобальний — 100 КБ). Цей
// роутер підключається в app.js ДО глобального express.json(), інакше
// фото відхилялось би ще там. Помилки парсера (завеликий/битий JSON)
// перетворюємо на наш виняток — інакше globalExceptionHandler віддав би 500.
const jsonParser = json({ limit: GALLERY_LIMITS.MAX_BODY });
const parseBody = (req, res, next) =>
  jsonParser(req, res, (err) => {
    if (!err) return next();
    const tooLarge = err.type === "entity.too.large";
    next(
      new GalleryValidationException(
        tooLarge ? GALLERY_ERRORS.TOO_LARGE : GALLERY_ERRORS.INVALID_BODY,
        tooLarge ? "GALLERY_TOO_LARGE" : "GALLERY_INVALID_BODY",
      ),
    );
  });

router.get("/", authGuard, GalleryController.list);
// Статичні шляхи — ДО "/:id", інакше "public"/"review" сприйнялись би як id.
router.get("/public", authGuard, GalleryController.listPublic);
router.get("/review", authGuard, GalleryController.listReview);
router.post(
  "/",
  authGuard,
  csrfProtection,
  RateLimitProvider.galleryUpload,
  parseBody,
  GalleryController.upload,
);
router.post("/:id/approve", authGuard, csrfProtection, GalleryController.approve);
router.get("/:id/thumb", authGuard, GalleryController.getThumb);
router.get("/:id", authGuard, GalleryController.getFull);
router.delete("/:id", authGuard, csrfProtection, GalleryController.remove);

export default router;
