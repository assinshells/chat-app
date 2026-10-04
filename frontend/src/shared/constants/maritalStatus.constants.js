// Сімейний стан користувача. value — код, що зберігається в БД
// (узгоджено з MARITAL_STATUS_OPTIONS на бекенді), label — підпис в UI.
export const MARITAL_STATUS_OPTIONS = Object.freeze([
  { value: "single", label: "Без пари" },
  { value: "in_relationship", label: "У стосунках" },
  { value: "married", label: "У шлюбі" },
  { value: "civil_marriage", label: "У цивільному шлюбі" },
  { value: "cohabiting", label: "Спільне проживання" },
  { value: "open_relationship", label: "У відкритих стосунках" },
  { value: "complicated", label: "Усе складно" },
  { value: "separated", label: "Розійшлися" },
  { value: "divorced", label: "Розлучений(-а)" },
]);

export const getMaritalStatusLabel = (value) =>
  MARITAL_STATUS_OPTIONS.find((option) => option.value === value)?.label ?? null;
