// Единая точка правды для брейкпоинта "мобильный/десктоп". Совпадает с
// Bootstrap lg (992px) и с медиа-запросами, уже используемыми в вёрстке
// (app/styles/user-chat.css, sidebar-menu.css и т.д. — везде это
// max-width: 991.98px). Если менять брейкпоинт — менять здесь, а не
// расползаться числом по компонентам.
export const MOBILE_MEDIA_QUERY = "(max-width: 991.98px)";

/**
 * Синхронная проверка "сейчас мобильный вьюпорт?". Не хук — для рендера
 * (значений, влияющих на JSX) нужен был бы matchMedia + подписка на
 * resize, но здесь эта проверка нужна только в обработчиках событий
 * (например, "закрыть панель после выбора комнаты — но только на
 * мобильном"), поэтому достаточно прочитать состояние в момент клика.
 */
export function isMobileViewport() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}