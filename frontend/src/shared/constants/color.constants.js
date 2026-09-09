// Повна палітра кольорів повідомлень/ніка (налаштування профілю).
// Значення (value) збігаються з backend COLOR_OPTIONS (users.color в БД,
// CHECK-обмеження users_color_check у docker/postgres/init.sql) —
// усі три місця змінюються разом.
//
// Порядок пунктів навмисно відповідає логічному колірному спектру
// (тепла частина -> холодна частина -> ахроматичні/земляні тони в кінці),
// а не абетці чи порядку додавання - саме в такому порядку колір
// показується у палітрі вибору (RegisterForm.jsx).
//
// `hex` - колір для світлої теми, `hexDark` - злегка скоригований
// відтінок для темної теми. Він потрібен лише там, де "сирий" hex або
// зливається з темним фоном (чорний, темно-синій, коричневий, бордовий),
// або, навпаки, стає надто сліпучим на ньому (жовтий) - освітлені чи
// притлумлені варіанти лишаються впізнаваними в обох темах. Для
// кольорів, які однаково добре читаються на світлому й темному фоні,
// hexDark не задається - компонент тоді просто повторно використовує hex.
//
// "Білий" - єдиний запис, де сам hex (не hexDark) відхиляється від
// буквального значення кольору: "#f8f9fa" зливається зі світлим фоном
// так само, як "чорний" зливався б із темним, якби для нього не було
// hexDark. Симетрично чорному (де для темної теми не буквальний
// "#000", а освітлений "#e8e8e8") тут для світлої теми не буквальний
// "#fff", а затемнений "#495057" - інакше повідомлення/нік, обраний
// білим у темній темі, стає невидимим одразу після перемикання на
// світлу (див. getEffectiveColorHex нижче).
export const COLOR_OPTIONS = Object.freeze([
  { value: "maroon", hex: "#800020", hexDark: "#b0405a", label: "Бордовий" },
  { value: "red", hex: "#e63946", hexDark: "#ff5c68", label: "Червоний" },
  { value: "coral", hex: "#ff6f59", label: "Кораловий" },
  { value: "pink", hex: "#f06595", label: "Рожевий" },
  { value: "orange", hex: "#fd7e14", label: "Помаранчевий" },
  { value: "peach", hex: "#ffb37b", label: "Персиковий" },
  { value: "yellow", hex: "#f4c430", hexDark: "#ffd84d", label: "Жовтий" },
  { value: "gold", hex: "#c9971c", hexDark: "#d4af37", label: "Золотий" },
  { value: "lime", hex: "#8bc34a", hexDark: "#a3d95c", label: "Лаймовий" },
  { value: "green", hex: "#198754", hexDark: "#2fb478", label: "Зелений" },
  { value: "mint", hex: "#2dd4a7", label: "М'ятний" },
  { value: "turquoise", hex: "#14b8a6", hexDark: "#2dd4c8", label: "Бірюзовий" },
  { value: "skyblue", hex: "#38bdf8", label: "Блакитний" },
  { value: "blue", hex: "#0d6efd", hexDark: "#4d94ff", label: "Синій" },
  { value: "navy", hex: "#1e3a5f", hexDark: "#4a6fa5", label: "Темно-синій" },
  { value: "purple", hex: "#6f42c1", hexDark: "#9575d6", label: "Фіолетовий" },
  { value: "black", hex: "#1a1a1a", hexDark: "#e8e8e8", label: "Чорний" },
  { value: "white", hex: "#495057", hexDark: "#ffffff", label: "Білий" },
  { value: "gray", hex: "#6c757d", hexDark: "#9ba3ab", label: "Сірий" },
  { value: "brown", hex: "#8b5e3c", hexDark: "#b3835c", label: "Коричневий" },
]);

export const DEFAULT_COLOR = "black";

const COLOR_HEX_BY_VALUE = Object.fromEntries(
  COLOR_OPTIONS.map((option) => [option.value, option.hex]),
);

const COLOR_HEX_DARK_BY_VALUE = Object.fromEntries(
  COLOR_OPTIONS.map((option) => [option.value, option.hexDark ?? option.hex]),
);

const COLOR_LABEL_BY_VALUE = Object.fromEntries(
  COLOR_OPTIONS.map((option) => [option.value, option.label]),
);

/**
 * getColorHex - hex-код для значення кольору з БД/сокета (світла тема).
 * Невідоме або відсутнє значення (наприклад, старе повідомлення без поля
 * color) тихо відкочується на колір за замовчуванням, а не ламає рендер.
 */
export const getColorHex = (value) =>
  COLOR_HEX_BY_VALUE[value] ?? COLOR_HEX_BY_VALUE[DEFAULT_COLOR];

/**
 * getColorHexDark - те саме, але скоригований під темну тему відтінок
 * (див. hexDark у COLOR_OPTIONS вище). Використовується там, де колір
 * малюється не через CSS-каскад (--swatch-color / --swatch-color-dark
 * в _color-picker.css), а напряму інлайн-стилем в JS.
 */
export const getColorHexDark = (value) =>
  COLOR_HEX_DARK_BY_VALUE[value] ?? COLOR_HEX_DARK_BY_VALUE[DEFAULT_COLOR];

/**
 * getEffectiveColorHex - єдина точка входу для будь-якого інлайн-стилю
 * в JS (текст повідомлення, нік, підпис у KickModal/BanModal/
 * RoleManageModal/DirectMessagesModal/Sidebar тощо): сама вирішує,
 * hex чи hexDark повернути, за прапорцем поточної теми (useIsDarkTheme).
 *
 * Раніше "чорний" був єдиним кольором з особливим винятком (інлайн-стиль
 * узагалі не виставлявся, компонент просто успадковував колір теми) —
 * це рятувало від чорного тексту на темному фоні, але не рятувало
 * "білий" від симетричної проблеми на світлому фоні. Тепер, коли стать
 * і колір обов'язково обираються явно на реєстрації (не мають значення
 * "не задано"), усі кольори — включно з "чорним" і "білим" —
 * рівноправні: для кожного просто підставляється відповідний hex/hexDark,
 * без особливих випадків.
 */
export const getEffectiveColorHex = (value, isDarkTheme) =>
  isDarkTheme ? getColorHexDark(value) : getColorHex(value);

/**
 * getColorLabel - назва кольору для тултипа/підпису під палітрою.
 */
export const getColorLabel = (value) =>
  COLOR_LABEL_BY_VALUE[value] ?? COLOR_LABEL_BY_VALUE[DEFAULT_COLOR];

/**
 * getVisibleColorOptions - список для рендеру самої палітри (RegisterForm.jsx),
 * з прибраною крайністю, яка на поточній темі все одно нечитабельна:
 * "білий" - у світлій темі (майже зливається зі світлим фоном картки й
 * чату), "чорний" - у темній (та сама проблема дзеркально). Обидва
 * значення лишаються дійсними в COLOR_OPTIONS/бекенді - приховується
 * лише свотч у палітрі вибору, старі повідомлення з таким кольором
 * рендеряться як і раніше (getColorHex/getColorHexDark це не чіпають).
 */
export const getVisibleColorOptions = (isDarkTheme) =>
  COLOR_OPTIONS.filter((option) => {
    if (option.value === "white") return isDarkTheme;
    if (option.value === "black") return !isDarkTheme;
    return true;
  });

/**
 * getDefaultColorForTheme - "чорний" як типовий вибір має сенс лише на
 * світлій темі (типове чорнило на світлому папері); на темній темі
 * симетричний за замовчуванням вибір - "білий". Використовується лише
 * для початкового стану форми реєстрації (RegisterForm.jsx) - на
 * бекенді DEFAULT_COLOR лишається 'black', бо форма завжди явно
 * надсилає обране значення в POST /api/auth/register.
 */
export const getDefaultColorForTheme = (isDarkTheme) =>
  isDarkTheme ? "white" : DEFAULT_COLOR;
