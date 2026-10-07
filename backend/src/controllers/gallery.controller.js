import { GalleryService } from "../services/gallery.service.js";
import { HTTP_STATUS } from "../constants/auth.constants.js";

const sendFile = (res, { mime, data }) => {
  // id незмінний (фото не редагується) — можна кешувати надовго, але
  // лише в браузері користувача (запит йде з Authorization).
  res.set({
    "Content-Type": mime,
    "Content-Length": data.length,
    "Cache-Control": "private, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
  });
  res.status(HTTP_STATUS.OK).end(data);
};

export const GalleryController = {
  list: async (req, res, next) => {
    try {
      const result = await GalleryService.list(req.userId);
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  upload: async (req, res, next) => {
    try {
      const photo = await GalleryService.upload({
        userId: req.userId,
        image: req.body?.image,
        thumb: req.body?.thumb,
      });
      res.status(HTTP_STATUS.CREATED).json({ success: true, photo });
    } catch (err) {
      next(err);
    }
  },

  listPublic: async (req, res, next) => {
    try {
      const result = await GalleryService.listPublic({
        before: req.query.before,
        limit: req.query.limit,
        search: req.query.q,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  listReview: async (req, res, next) => {
    try {
      const result = await GalleryService.listReview({
        userId: req.userId,
        before: req.query.before,
        limit: req.query.limit,
        search: req.query.q,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  approve: async (req, res, next) => {
    try {
      await GalleryService.approve({ id: req.params.id, userId: req.userId });
      res.status(HTTP_STATUS.OK).json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  getFull: async (req, res, next) => {
    try {
      sendFile(
        res,
        await GalleryService.getFile({ id: req.params.id, userId: req.userId, variant: "full" }),
      );
    } catch (err) {
      next(err);
    }
  },

  getThumb: async (req, res, next) => {
    try {
      sendFile(
        res,
        await GalleryService.getFile({ id: req.params.id, userId: req.userId, variant: "thumb" }),
      );
    } catch (err) {
      next(err);
    }
  },

  remove: async (req, res, next) => {
    try {
      await GalleryService.remove({ id: req.params.id, userId: req.userId });
      res.status(HTTP_STATUS.OK).json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};
