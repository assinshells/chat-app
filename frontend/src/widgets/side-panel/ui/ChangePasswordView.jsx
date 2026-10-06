import { useState } from "react";

import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { requestPasswordChange } from "@shared/api/profile.api.js";

import { SubPanelView } from "./SubPanelView.jsx";
import { PasswordOtpView } from "./PasswordOtpView.jsx";

const MIN_PASSWORD_LENGTH = 6;

/**
 * ChangePasswordView — вкладена панель "Змінити пароль" (Безпека).
 *
 * Без ел. адреси форми немає — лише повідомлення, що для зміни пароля
 * потрібна ел. пошта (з кнопкою її додати). З адресою: новий пароль +
 * повторення, валідація на клієнті, по "Зберегти" сервер надсилає OTP
 * на пошту і відкривається нова вкладка введення коду (PasswordOtpView)
 * — той самий сценарій, що й при відновленні пароля на сторінці входу.
 * Пароль на сервер іде лише разом із кодом (другий крок).
 */
export function ChangePasswordView({ onBack, onAddEmail, onDone }) {
  const email = useCurrentUserStore((state) => state.email)?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("form"); // "form" | "otp"

  if (!email) {
    return (
      <SubPanelView title="Змінити пароль" onBack={onBack}>
        <div className="p-3">
          <div className="alert alert-warning mb-3" role="alert">
            Для зміни пароля потрібна ел. пошта. Додайте її, щоб ми могли
            надіслати код підтвердження.
          </div>
          <button
            type="button"
            className="btn btn-primary fw-bold w-100"
            onClick={onAddEmail}
          >
            Додати ел. адресу
          </button>
        </div>
      </SubPanelView>
    );
  }

  const passwordError =
    password.length < MIN_PASSWORD_LENGTH
      ? `Пароль має містити щонайменше ${MIN_PASSWORD_LENGTH} символів`
      : "";
  const confirmError =
    confirmPassword !== password ? "Паролі не збігаються" : "";
  const isValid = !passwordError && !confirmError;

  const handleSave = async () => {
    setTouched(true);
    if (!isValid || sending) return;

    setSending(true);
    setError("");
    try {
      await requestPasswordChange();
      setStep("otp");
    } catch (err) {
      setError(err?.message || "Не вдалося надіслати код. Спробуйте ще раз.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <SubPanelView
        title="Змінити пароль"
        onBack={onBack}
        footer={
          <button
            type="button"
            className="btn btn-primary fw-bold w-100"
            disabled={sending}
            onClick={handleSave}
          >
            {sending ? "Надсилаємо код..." : "Зберегти"}
          </button>
        }
      >
        <div className="p-3">
          <label htmlFor="new-password-input" className="mb-2 small d-block">
            Новий пароль
          </label>
          <input
            id="new-password-input"
            type="password"
            className={`form-control ${touched && passwordError ? "is-invalid" : ""}`}
            autoComplete="new-password"
            placeholder="Введіть новий пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {touched && passwordError && (
            <div className="invalid-feedback d-block">{passwordError}</div>
          )}

          <label
            htmlFor="confirm-password-input"
            className="mb-2 mt-3 small d-block"
          >
            Повторіть пароль
          </label>
          <input
            id="confirm-password-input"
            type="password"
            className={`form-control ${touched && confirmError ? "is-invalid" : ""}`}
            autoComplete="new-password"
            placeholder="Повторіть новий пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {touched && confirmError && (
            <div className="invalid-feedback d-block">{confirmError}</div>
          )}

          <div className="text-muted small mt-3">
            Після збереження ми надішлемо код підтвердження на {email}.
          </div>

          {error && <div className="text-danger small mt-2">{error}</div>}
        </div>
      </SubPanelView>

      {step === "otp" && (
        <PasswordOtpView
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          onBack={() => setStep("form")}
          onDone={onDone}
        />
      )}
    </>
  );
}
