import { ModerationActionService } from "../services/moderationAction.service.js";
import {
  toKickDto,
  toKickChatDto,
  toBanDto,
  toBanRoomDto,
  toUnbanDto,
} from "../dto/moderationAction.dto.js";
import {
  validateKickRequest,
  validateKickChatRequest,
  validateBanRequest,
  validateBanRoomRequest,
  validateUnbanRequest,
  validateReleaseConfinementRequest,
} from "../validators/moderationAction.validator.js";
import { HTTP_STATUS } from "../constants/auth.constants.js";

/**
 * ModerationActionController — усі роути змонтовані за
 * requireRole(MODERATION_ACTOR_ROLES) (див. routes/moderationAction.routes.js),
 * тому req.userRole тут завжди вже заповнений цим guard'ом. `io`
 * дістається з req.app (див. server.js: app.set("io", io)) — єдине
 * місце в HTTP-шарі, де знадобився прямий доступ до Socket.IO сервера,
 * бо кік/бан мають діяти на вже підключені сокети негайно, а не лише
 * "заднім числом" при наступній дії жертви.
 */
export const ModerationActionController = {
  kick: async (req, res, next) => {
    try {
      validateKickRequest(req.body);
      const dto = toKickDto(req.body);
      const result = await ModerationActionService.kick({
        io: req.app.get("io"),
        actorId: req.userId,
        actorRole: req.userRole,
        targetLogin: dto.login,
        room: dto.room,
        durationMs: dto.durationMs,
        reason: dto.reason,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  kickChat: async (req, res, next) => {
    try {
      validateKickChatRequest(req.body);
      const dto = toKickChatDto(req.body);
      const result = await ModerationActionService.kickChat({
        io: req.app.get("io"),
        actorId: req.userId,
        actorRole: req.userRole,
        targetLogin: dto.login,
        durationMs: dto.durationMs,
        reason: dto.reason,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  banRoom: async (req, res, next) => {
    try {
      validateBanRoomRequest(req.body);
      const dto = toBanRoomDto(req.body);
      const result = await ModerationActionService.banRoom({
        io: req.app.get("io"),
        actorId: req.userId,
        actorRole: req.userRole,
        targetLogin: dto.login,
        durationMs: dto.durationMs,
        reason: dto.reason,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  ban: async (req, res, next) => {
    try {
      validateBanRequest(req.body);
      const dto = toBanDto(req.body);
      const result = await ModerationActionService.ban({
        io: req.app.get("io"),
        actorId: req.userId,
        actorRole: req.userRole,
        targetLogin: dto.login,
        scope: dto.scope,
        room: dto.room,
        durationMs: dto.durationMs,
        reason: dto.reason,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  unban: async (req, res, next) => {
    try {
      validateUnbanRequest(req.body);
      const dto = toUnbanDto(req.body);
      const result = await ModerationActionService.unban({
        actorId: req.userId,
        actorRole: req.userRole,
        banId: dto.banId,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  listActiveBans: async (req, res, next) => {
    try {
      const login = req.params.login;
      const [bans, confinement] = await Promise.all([
        ModerationActionService.listActiveBans({ login }),
        ModerationActionService.getActiveConfinement({ login }),
      ]);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        bans: bans.map((b) => ({
          id: b.id,
          room: b.room,
          scope: b.room ? "room" : "global",
          reason: b.reason,
          createdAt: b.created_at,
          expiresAt: b.expires_at,
        })),
        confinement: confinement
          ? {
              confinedRoom: confinement.confined_room,
              sourceRoom: confinement.source_room,
              reason: confinement.reason,
              expiresAt: confinement.expires_at,
            }
          : null,
      });
    } catch (err) {
      next(err);
    }
  },

  releaseConfinement: async (req, res, next) => {
    try {
      validateReleaseConfinementRequest(req.body);
      const result = await ModerationActionService.releaseConfinement({
        actorId: req.userId,
        actorRole: req.userRole,
        targetLogin: req.body.login,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};
