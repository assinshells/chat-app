import { useRef, useState } from "react";
import { useVerifyOtpStore } from "@features/auth/verify-otp/model/useVerifyOtpStore.js";

export function OtpForm({ email, onSuccess, onBack }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  const { loading, error, verify, clearError } = useVerifyOtpStore();

  const handleChange = (index, value) => {
    // Только цифры
    const digit = value.replace(/\D/g, "").slice(-1);

    if (!digit) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digit;

    setOtp(newOtp);
    clearError();

    // Перейти к следующей ячейке
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace — удалить текущую цифру
    // Если ячейка пустая — перейти назад
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }

    // Стрелка влево
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Стрелка вправо
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const pastedCode = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pastedCode) return;

    const newOtp = ["", "", "", "", "", ""];

    pastedCode.split("").forEach((digit, index) => {
      newOtp[index] = digit;
    });

    setOtp(newOtp);
    clearError();

    // Фокус на последнюю заполненную ячейку
    const focusIndex = Math.min(pastedCode.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      return;
    }

    clearError();
    verify({ email, otpCode }, onSuccess);
  };

  const isComplete = otp.every(Boolean);

  return (
    <>
      {error && <p className="text-danger text-center mb-3">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="d-flex justify-content-between gap-2 mb-4">
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
              className="form-control text-center fw-bold"
              style={{
                width: "3rem",
                height: "3.5rem",
                fontSize: "1.5rem",
                padding: 0,
              }}
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || !isComplete}
          className="btn btn-primary w-100 text-decoration-none rounded-4 fw-bold m-0"
        >
          {loading ? "Верифікація..." : "Верифікувати"}
        </button>
      </form>

      <p>
        <button
          type="button"
          onClick={onBack}
          className="btn btn-outline-primary w-100 text-break rounded-4 fw-bold mt-4"
        >
          Увійти
        </button>
      </p>
    </>
  );
}
