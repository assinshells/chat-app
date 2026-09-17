import { useEffect, useRef, useState } from "react";
import { Pencil, Check, X, Loader2, AlertCircle } from "lucide-react";

// Скільки часу тримати "success" перед автоматичним поверненням у
// "view" — досить, щоб користувач встиг помітити галочку, але не
// настільки довго, щоб плутати з дійсно активним станом.
const SUCCESS_DISPLAY_MS = 1200;

/**
 * EditableProfileField — точкове редагування одного поля в аккордеоні
 * "Personal Info" (ChatLeftSidebar, таб "Налаштування"). Кожне поле —
 * своя незалежна кнопка "Edit" і своя state machine, тому редагування
 * email не чіпає city і навпаки (кожен виклик onSave стосується лише
 * цього конкретного поля).
 *
 * Стани:
 *  - view    — показ поточного значення й кнопки "Редагувати".
 *  - edit    — поле вводу з поточним значенням, "Зберегти"/"Скасувати".
 *  - saving  — запит на сервері, поле вводу заблоковане, спінер.
 *  - success — коротке підтвердження, потім автоматично -> view.
 *  - error   — повідомлення про помилку; введене значення НЕ втрачається,
 *              можна одразу повторити спробу або скасувати.
 *
 * @param {string} label - підпис поля ("Email", "Місто")
 * @param {string|null} value - поточне збережене значення
 * @param {(next: string) => Promise<void>} onSave - викликається з
 *   обрізаним значенням поля; має кинути помилку (з .message) при невдачі
 * @param {string} [placeholder] - плейсхолдер, якщо значення порожнє
 * @param {string} [type] - тип <input> (за замовчуванням "text")
 * @param {number} [maxLength]
 */
export function EditableProfileField({
  label,
  value,
  onSave,
  placeholder = "Не вказано",
  type = "text",
  maxLength,
}) {
  const [status, setStatus] = useState("view");
  const [draft, setDraft] = useState(value ?? "");
  const [errorMessage, setErrorMessage] = useState(null);
  const inputRef = useRef(null);
  const successTimerRef = useRef(null);

  // Якщо значення прийшло ззовні (наприклад, після getMe при
  // перезаході), а поле зараз просто відображається — синхронізуємо
  // чернетку. Під час edit/saving/error чуже втручання не повинно
  // затирати те, що користувач вже вводить.
  useEffect(() => {
    if (status === "view") setDraft(value ?? "");
  }, [value, status]);

  useEffect(() => {
    if (status === "edit") {
      // Фокус і курсор у кінець — зручніше правити наявне значення,
      // а не передруковувати його заново. setSelectionRange не
      // підтримується браузерами для деяких типів input (зокрема
      // "email" — саме тому баг проявлявся лише на полі Email, а не
      // на текстовому Location), тому обгортаємо в try/catch:
      // сфокусувати поле все одно важливіше, ніж поставити курсор.
      const input = inputRef.current;
      input?.focus();
      try {
        input?.setSelectionRange(input.value.length, input.value.length);
      } catch {
        // Тип input не підтримує selection range — курсор і так
        // з'явиться в кінці за замовчуванням при фокусі непорожнього
        // поля в більшості браузерів, нічого критичного не втрачено.
      }
    }
  }, [status]);

  useEffect(() => () => clearTimeout(successTimerRef.current), []);

  const startEdit = () => {
    setDraft(value ?? "");
    setErrorMessage(null);
    setStatus("edit");
  };

  const cancel = () => {
    setDraft(value ?? "");
    setErrorMessage(null);
    setStatus("view");
  };

  const save = async () => {
    const next = draft.trim();
    // Нічого не змінилось — просто закриваємо поле вводу без запиту.
    if (next === (value ?? "")) {
      setStatus("view");
      return;
    }

    setStatus("saving");
    try {
      await onSave(next);
      setStatus("success");
      successTimerRef.current = setTimeout(() => {
        setStatus("view");
      }, SUCCESS_DISPLAY_MS);
    } catch (err) {
      setErrorMessage(err?.message || "Не вдалося зберегти зміни");
      setStatus("error");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  const isBusy = status === "saving";
  const showInput = status === "edit" || status === "saving" || status === "error";

  return (
    <div className="mt-4 editable-profile-field" data-field-status={status}>
      <div className="d-flex align-items-center justify-content-between">
        <p className="text-muted mb-1">{label}</p>

        {status === "view" && (
          <button
            type="button"
            className="btn btn-light btn-sm editable-profile-field-edit"
            onClick={startEdit}
            aria-label={`Редагувати поле «${label}»`}
          >
            <Pencil size={13} className="me-1 align-middle" />
            Edit
          </button>
        )}

        {status === "success" && (
          <span className="editable-profile-field-success" role="status">
            <Check size={14} className="me-1" />
            Збережено
          </span>
        )}
      </div>

      {status === "view" && (
        <h5 className="font-size-14 mb-0">
          {value || <span className="text-muted fst-italic">{placeholder}</span>}
        </h5>
      )}

      {status === "success" && <h5 className="font-size-14 mb-0">{value}</h5>}

      {showInput && (
        <div>
          <div className="input-group input-group-sm">
            <input
              ref={inputRef}
              type={type}
              className={`form-control ${status === "error" ? "is-invalid" : ""}`}
              value={draft}
              maxLength={maxLength}
              disabled={isBusy}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-invalid={status === "error"}
              aria-label={label}
            />
            <button
              type="button"
              className="btn btn-success"
              onClick={save}
              disabled={isBusy}
              aria-label="Зберегти"
            >
              {isBusy ? (
                <Loader2 size={14} className="editable-profile-field-spinner" />
              ) : (
                <Check size={14} />
              )}
            </button>
            <button
              type="button"
              className="btn btn-light"
              onClick={cancel}
              disabled={isBusy}
              aria-label="Скасувати"
            >
              <X size={14} />
            </button>
          </div>

          {status === "error" && (
            <div className="editable-profile-field-error">
              <AlertCircle size={13} className="me-1" />
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
