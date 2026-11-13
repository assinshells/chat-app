import {
  STATUS_OPTIONS,
  DEFAULT_STATUS,
} from "@shared/constants/status.constants.js";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { StatusIcon } from "@shared/ui/status-icon";

import { SubPanelView } from "./SubPanelView.jsx";

/**
 * StatusView — вкладена панель "Статус" (Налаштування → Статус): той самий
 * вигляд, що й "Темний режим" — радіокнопки зі списком статусів. Вибір
 * одразу застосовується (onStatusChange → status:update по сокету;
 * поточний статус у useCurrentUserStore оновлюється після успіху).
 */
export function StatusView({ onBack, onStatusChange }) {
  const status =
    useCurrentUserStore((state) => state.status) ?? DEFAULT_STATUS;

  return (
    <SubPanelView title="Статус" onBack={onBack}>
      <div role="radiogroup" aria-label="Статус">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <label key={value} className="app-radio-row">
            <input
              type="radio"
              name="user-status"
              className="form-check-input"
              checked={status === value}
              onChange={() => onStatusChange?.(value)}
            />
            <StatusIcon status={value} size={14} />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </SubPanelView>
  );
}
