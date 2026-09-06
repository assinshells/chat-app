import { RoleService } from "../services/role.service.js";
import { toAssignRoleDto, toRemoveRoleDto } from "../dto/role.dto.js";
import {
  validateAssignRoleRequest,
  validateRemoveRoleRequest,
} from "../validators/role.validator.js";
import { HTTP_STATUS } from "../constants/auth.constants.js";

/**
 * RoleController — усі роути змонтовані за requireRole([admin, superadmin])
 * (див. routes/role.routes.js), тому req.userRole тут завжди вже
 * заповнений цим guard'ом.
 */
export const RoleController = {
  getRole: async (req, res, next) => {
    try {
      const result = await RoleService.getRoleInfo({
        login: req.params.login,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  assign: async (req, res, next) => {
    try {
      validateAssignRoleRequest(req.body);
      const dto = toAssignRoleDto(req.body);
      const result = await RoleService.assignRole({
        actorId: req.userId,
        actorRole: req.userRole,
        targetLogin: dto.login,
        role: dto.role,
        rooms: dto.rooms,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  remove: async (req, res, next) => {
    try {
      validateRemoveRoleRequest(req.body);
      const dto = toRemoveRoleDto(req.body);
      const result = await RoleService.removeRole({
        actorId: req.userId,
        actorRole: req.userRole,
        targetLogin: dto.login,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};
