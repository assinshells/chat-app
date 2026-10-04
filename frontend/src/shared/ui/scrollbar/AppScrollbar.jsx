import SimpleBar from "simplebar-react";

/**
 * AppScrollbar — SimpleBar з автоприховуванням для всіх скрол-областей
 * застосунку (стрічка кімнати, листування, списки в правій панелі,
 * вибір кімнати). Повзунок з'являється при прокрутці/наведенні й
 * ховається сам, нативного скролбара не видно.
 *
 * Будова: зовнішній "host" — flex-item (flex: 1 1 auto; min-height: 0;
 * overflow: hidden), усередині SimpleBar з height: 100%. Так зроблено
 * свідомо: внутрішня обгортка SimpleBar бере висоту з кореня
 * (height: inherit), а в flex-item вона обчислюється як auto — тоді
 * вміст росте разом із текстом, нічого не прокручується в самому
 * SimpleBar і з'являється нативний скрол у батька. Відсоток від
 * host-елемента з фіксованою flex-висотою цю проблему знімає.
 *
 * Батько має бути flex-колонкою з обмеженою висотою. className
 * застосовується до host-елемента. Горизонтальна прокрутка вимкнена
 * (.no-horizontal), якщо не передано horizontal. Стилі SimpleBar
 * підключені в main.jsx.
 */
export function AppScrollbar({
  className = "",
  style,
  horizontal = false,
  children,
  ...rest
}) {
  return (
    <div className={`app-scroll-host ${className}`.trim()} style={style}>
      <SimpleBar
        autoHide
        className={horizontal ? undefined : "no-horizontal"}
        style={{ height: "100%" }}
        {...rest}
      >
        {children}
      </SimpleBar>
    </div>
  );
}
