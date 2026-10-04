import { getStatusOption } from "@shared/constants/status.constants.js";

/**
 * StatusIcon — компактна lucide-іконка статусу доступності
 * (замість емодзі). Колір задається класом status-icon--<tone>.
 */
export function StatusIcon({ status, size = 12, className = "" }) {
  const { icon: Icon, tone } = getStatusOption(status);
  return (
    <Icon
      size={size}
      aria-hidden="true"
      className={`status-icon status-icon--${tone} ${className}`.trim()}
    />
  );
}
