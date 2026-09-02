import { LogOut } from "lucide-react";
import { useLogoutStore } from "@features/auth/logout/model/useLogoutStore.js";

/**
 * LogoutButton — кнопка виходу з акаунту.
 * Викликає logout() з useLogoutStore: надсилає запит на /api/auth/logout,
 * потім у будь-якому разі (навіть якщо сесія вже минула) чистить локальну
 * сесію і викликає onLoggedOut().
 */
export function LogoutButton({ onLoggedOut, className = "btn btn-outline-danger" }) {
  const { loading, logout } = useLogoutStore();

  const handleClick = () => logout(onLoggedOut);

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={loading}
    >
      <LogOut size={18} strokeWidth={2} className="me-2" />
      {loading ? "Виходимо..." : "Вийти"}
    </button>
  );
}
