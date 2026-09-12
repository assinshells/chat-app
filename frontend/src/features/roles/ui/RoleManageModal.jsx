import { createPortal } from "react-dom";

import { ROOMS } from "@features/chat/constants/rooms.constants.js";
import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";
import {
  ASSIGNABLE_ROLE_OPTIONS,
  ROLE_VALUES,
  getRoleLabel,
} from "@shared/constants/role.constants.js";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { useRolesStore } from "@features/roles/model/useRolesStore.js";

/**
 * RoleManageModal — єдина на застосунок модалка керування роллю,
 * рендериться один раз у ChatLayout (портал у document.body — те саме
 * міркування, що й у SettingsModal.jsx щодо position: fixed).
 * Відкривається з пункту "Керувати роллю" в меню біля чужого ніка
 * (DmTriggerButton), стан — у useRolesStore.
 *
 * Дозволяє призначити роль "Модератор" (з вибором конкретних кімнат)
 * або "Адміністратор" (модерує всі кімнати одразу, без вибору), або
 * зняти наявну роль. Роль "Адміністратор" може призначати/знімати лише
 * суперадміністратор — узгоджено з backend RoleService (403, якщо
 * порушити це на клієнті обійти форму).
 */
export function RoleManageModal({ modalId = "roleManageModal" }) {
  const {
    targetLogin,
    targetColor,
    currentRole,
    selectedRole,
    selectedRooms,
    loading,
    saving,
    error,
    success,
    setSelectedRole,
    toggleRoom,
    submitAssign,
    submitRemove,
    clearStatus,
  } = useRolesStore();

  const ownRole = useCurrentUserStore((state) => state.role);
  const isSuperadmin = ownRole === ROLE_VALUES.SUPERADMIN;

  const roleOptions = ASSIGNABLE_ROLE_OPTIONS.filter(
    (option) => option.value !== ROLE_VALUES.ADMIN || isSuperadmin,
  );

  const targetIsSuperadmin = currentRole === ROLE_VALUES.SUPERADMIN;
  const targetIsLockedAdmin = currentRole === ROLE_VALUES.ADMIN && !isSuperadmin;
  const formLocked = loading || targetIsSuperadmin || targetIsLockedAdmin;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formLocked || saving) return;
    submitAssign();
  };

  // Тема — щоб нік у заголовку модалки рендерився правильним відтінком
  // кольору цілі (див. getEffectiveColorHex у ChatConversation.jsx).
  const isDarkTheme = useIsDarkTheme();

  return createPortal(
    <div
      className="modal fade"
      id={modalId}
      tabIndex="-1"
      aria-labelledby={`${modalId}Label`}
      aria-hidden="true"
      data-bs-backdrop="static"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content settings-modal">
          <div className="modal-header">
            <h5 className="modal-title" id={`${modalId}Label`}>
              Керування роллю
              {targetLogin ? (
                <>
                  {": "}
                  <span
                    style={{ color: getEffectiveColorHex(targetColor, isDarkTheme) }}
                  >
                    {targetLogin}
                  </span>
                </>
              ) : null}
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Закрити"
              onClick={clearStatus}
            />
          </div>

          <div className="modal-body">
            {loading ? (
              <p className="text-muted small mb-0">Завантаження...</p>
            ) : targetIsSuperadmin ? (
              <p className="text-muted small mb-0">
                Не можна змінювати роль суперадміністратора.
              </p>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="mb-3 text-muted small">
                  Поточна роль: <strong>{getRoleLabel(currentRole)}</strong>
                </p>

                {targetIsLockedAdmin && (
                  <p className="text-muted small mb-3">
                    Лише суперадміністратор може змінювати роль
                    адміністратора.
                  </p>
                )}

                <div className="d-flex flex-wrap mb-3">
                  {roleOptions.map((option) => (
                    <div className="form-check me-3" key={option.value}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="role-manage-role"
                        id={`role-manage-${option.value}`}
                        value={option.value}
                        checked={selectedRole === option.value}
                        disabled={targetIsLockedAdmin}
                        onChange={(e) => setSelectedRole(e.target.value)}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`role-manage-${option.value}`}
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>

                {selectedRole === ROLE_VALUES.MODERATOR && (
                  <div className="mb-3">
                    <label className="mb-2 text-muted small d-block">
                      Кімнати, які модерує
                    </label>
                    <div
                      className="d-flex flex-column"
                      style={{ maxHeight: 220, overflowY: "auto" }}
                    >
                      {ROOMS.map((room) => (
                        <label
                          key={room.id}
                          className="form-check d-flex align-items-center mb-1"
                        >
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            checked={selectedRooms.includes(room.id)}
                            disabled={targetIsLockedAdmin}
                            onChange={() => toggleRoom(room.id)}
                          />
                          {room.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {error && <p className="text-danger small mb-3">{error}</p>}
                {success && (
                  <p className="text-success small mb-3">{success}</p>
                )}

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary rounded-4 fw-bold"
                    disabled={formLocked || saving}
                  >
                    {saving ? "Зберігаємо..." : "Зберегти"}
                  </button>

                  {currentRole !== ROLE_VALUES.USER && (
                    <button
                      type="button"
                      className="btn btn-outline-danger rounded-4 fw-bold"
                      disabled={formLocked || saving}
                      onClick={submitRemove}
                    >
                      Зняти роль
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
