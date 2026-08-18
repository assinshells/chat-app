import { LogOut } from "lucide-react";
import { useLogoutStore } from "@features/auth/logout/model/useLogoutStore.js";

/**
 * LogoutButton — кнопка выхода из аккаунта.
 * Вызывает logout() из useLogoutStore: шлёт запрос на /api/auth/logout,
 * затем в любом случае (даже если сессия уже истекла) чистит локальную
 * сессию и вызывает onLoggedOut().
 *
 * variant="button"     — самостоятельная кнопка (по умолчанию).
 * variant="menu-item"  — пункт выпадающего меню (Bootstrap .dropdown-item),
 *                        иконка справа, как у соседних пунктов Profile/Setting.
 */
export function LogoutButton({
  onLoggedOut,
  variant = "button",
  className,
  label,
  loadingLabel,
}) {
  const { loading, logout } = useLogoutStore();

  const handleClick = () => logout(onLoggedOut);

  if (variant === "menu-item") {
    return (
      <button
        type="button"
        className={
          className ??
          "dropdown-item d-flex align-items-center justify-content-between"
        }
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (loadingLabel ?? "Виходимо…") : (label ?? "Log out")}
        <LogOut className="text-muted" size={20} strokeWidth={2} />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={className ?? "btn btn-outline-danger"}
      onClick={handleClick}
      disabled={loading}
    >
      <LogOut size={18} strokeWidth={2} className="me-2" />
      {loading ? (loadingLabel ?? "Виходимо...") : (label ?? "Вийти")}
    </button>
  );
}