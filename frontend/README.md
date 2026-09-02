# React + Vite

Цей шаблон надає мінімальне налаштування для роботи React у Vite з HMR і деякими правилами ESLint.

Наразі доступні два офіційні плагіни:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) використовує [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) використовує [SWC](https://swc.rs/)

## React Compiler

React Compiler не увімкнено в цьому шаблоні через його вплив на продуктивність розробки та збірки. Щоб додати його, дивіться [цю документацію](https://react.dev/learn/react-compiler/installation).

## Розширення конфігурації ESLint

Якщо ви розробляєте продакшн-застосунок, ми рекомендуємо використовувати TypeScript з увімкненими правилами лінтингу з урахуванням типів. Перегляньте [TS-шаблон](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts), щоб дізнатися, як інтегрувати TypeScript і [`typescript-eslint`](https://typescript-eslint.io) у ваш проєкт.
