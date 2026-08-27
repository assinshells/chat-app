import { LogOut } from "lucide-react";
import { useLogoutStore } from "@features/auth/logout/model/useLogoutStore.js";

/**
 * LogoutButton — кнопка выхода из аккаунта.
 * Вызывает logout() из useLogoutStore: шлёт запрос на /api/auth/logout,
 * затем в любом случае (даже если сессия уже истекла) чистит локальную
 * сессию и вызывает onLoggedOut().
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
