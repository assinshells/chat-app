import { useRef, useState } from "react";

import {
  confirmPasswordChange,
  requestPasswordChange,
} from "@shared/api/profile.api.js";

import { SubPanelView } from "./SubPanelView.jsx";

const OTP_LENGTH = 6;
const EMPTY_OTP = Array(OTP_LENGTH).fill("");

/**
 * PasswordOtpView — вкладка введення коду з листа при зміні пароля
 * (6 комірок, вставка з буфера, навігація стрілками/Backspace — так
 * само, як OtpForm на сторінці відновлення пароля). Кнопка
 * "Підтвердити" надсилає код разом із новим паролем; "Надіслати код
 * ще раз" генерує новий OTP.
 */
export function PasswordOtpView({
  email,
  password,
  confirmPassword,
  onBack,
  onDone,
}) {
  const [otp, setOtp] = useState(EMPTY_OTP);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const inputRefs = useRef([]);

  const isComplete = otp.every(Boolean);

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError("");
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft" && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1)
      inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = [...EMPTY_OTP];
    pasted.split("").forEach((digit, i) => {
      next[i] = digit;
    });
    setOtp(next);
    setError("");
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleConfirm = async () => {
    if (!isComplete || loading) return;
    setLoading(true);
    setError("");
    setInfo("");
    try {
      await confirmPasswordChange({
        otpCode: otp.join(""),
        password,
        confirmPassword,
      });
      onDone();
    } catch (err) {
      setError(err?.message || "Не вдалося змінити пароль. Спробуйте ще раз.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setError("");
    setInfo("");
    try {
      await requestPasswordChange();
      setOtp(EMPTY_OTP);
      setInfo("Новий код надіслано.");
      inputRefs.current[0]?.focus();
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
          disabled={!isComplete || loading}
          onClick={handleConfirm}
        >
          {loading ? "Перевіряємо..." : "Підтвердити"}
        </button>
      }
    >
      <div className="p-3">
        <p className="small mb-3">
          Ми надіслали 6-значний код на <strong>{email}</strong>. Введіть
          його, щоб змінити пароль.
        </p>

        <div className="d-flex justify-content-between gap-2 mb-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="form-control text-center px-0"
              style={{ minWidth: 0 }}
              aria-label={`Цифра коду ${index + 1}`}
            />
          ))}
        </div>

        {error && <div className="text-danger small mb-2">{error}</div>}
        {info && <div className="text-success small mb-2">{info}</div>}

        <button
          type="button"
          className="btn btn-link p-0 small"
          disabled={resending}
          onClick={handleResend}
        >
          {resending ? "Надсилаємо..." : "Надіслати код ще раз"}
        </button>
      </div>
    </SubPanelView>
  );
}
