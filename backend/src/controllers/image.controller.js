import { ImageService } from "../services/image.service.js";

export const ImageController = {
  get: async (req, res, next) => {
    try {
      const { mime, data } = await ImageService.getForUser({
        id: req.params.id,
        userId: req.userId,
      });

      // id незмінний (файл не редагується) — безпечно кешувати надовго.
      // private: кеш лише в браузері користувача, не в проміжних проксі
      // (запит йде з Authorization).
      res.set({
        "Content-Type": mime,
        "Content-Length": data.length,
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      });
      res.status(200).end(data);
    } catch (err) {
      next(err);
    }
  },
};
