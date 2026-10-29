import { useState } from "react";

import {
  confirmPasswordChange,
  requestPasswordChange,
} from "@shared/api/profile.api.js";
import {
  OTP_LENGTH,
  OTP_TTL_SECONDS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@shared/constants/auth.constants.js";
import { useCountdown, formatMmSs } from "@shared/lib/useCountdown.js";

import { SubPanelView } from "./SubPanelView.jsx";

/**
 * PasswordOtpView — вкладка введення коду з листа при зміні пароля.
 * Одне поле для коду (як на сторінці відновлення пароля), код діє
 * 3 хвилини, є посилання "Відправити код повторно". Кнопка
 * "Підтвердити" надсилає код разом із новим паролем.
 */
export function PasswordOtpView({
  email,
  password,
  confirmPassword,
  onBack,
  onDone,
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const ttl = useCountdown(OTP_TTL_SECONDS);
  const cooldown = useCountdown(OTP_RESEND_COOLDOWN_SECONDS);

  const expired = ttl.secondsLeft === 0;
  const canResend = cooldown.secondsLeft === 0 && !resending;
  const isComplete = code.length === OTP_LENGTH;

  const handleChange = (e) => {
    setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH));
    setError("");
  };

  const handleConfirm = async () => {
    if (!isComplete || expired || loading) return;
    setLoading(true);
    setError("");
    setInfo("");
    try {
      await confirmPasswordChange({ otpCode: code, password, confirmPassword });
      onDone();
    } catch (err) {
      setError(err?.message || "Не вдалося змінити пароль. Спробуйте ще раз.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    setError("");
    setInfo("");
    try {
      await requestPasswordChange();
      setCode("");
      setInfo("Новий код надіслано.");
      ttl.restart();
      cooldown.restart();
    } catch (err) {
      setError(err?.message || "Не вдалося надіслати код. Спробуйте ще раз.");
    } finally {
      setResending(false);
    }
  };

  return (
    <SubPanelView
      title="Підтвердження"
      onBack={onBack}
      footer={
        <button
          type="button"
          className="btn btn-primary fw-bold w-100"
          disabled={!isComplete || expired || loading}
          onClick={handleConfirm}
        >
          {loading ? "Перевіряємо..." : "Підтвердити"}
        </button>
      }
    >
      <div className="p-3">
        <p className="small mb-3">
          Ми надіслали код на <strong>{email}</strong>. Введіть його, щоб
          змінити пароль.
        </p>

        <label htmlFor="password-otp-input" className="form-label small">
          Одноразовий код
        </label>
        <input
          id="password-otp-input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={OTP_LENGTH}
          className="form-control otp-input"
          placeholder={"0".repeat(OTP_LENGTH)}
          value={code}
          onChange={handleChange}
          autoFocus
        />
        <div className="form-text mb-3">
          {expired
            ? "Час дії коду минув — запросіть новий."
            : `Діє ще ${formatMmSs(ttl.secondsLeft)}.`}
        </div>

        {error && <div className="text-danger small mb-2">{error}</div>}
        {info && !error && (
          <div className="text-success small mb-2">{info}</div>
        )}

        <button
          type="button"
          className="btn btn-link p-0 small align-baseline"
          disabled={!canResend}
          onClick={handleResend}
        >
          {resending ? "Надсилаємо..." : "Відправити код повторно"}
        </button>
        {cooldown.secondsLeft > 0 && (
          <span className="text-muted small">
            {" "}
            (через {formatMmSs(cooldown.secondsLeft)})
          </span>
        )}
      </div>
    </SubPanelView>
  );
}
