import { useState } from "react";
import { useVerifyOtpStore } from "@features/auth/verify-otp/model/useVerifyOtpStore.js";
import {
  OTP_LENGTH,
  OTP_TTL_SECONDS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@shared/constants/auth.constants.js";
import { useCountdown, formatMmSs } from "@shared/lib/useCountdown.js";

export function OtpForm({ email, onSuccess }) {
  const [code, setCode] = useState("");

  const { loading, resending, error, info, verify, resend, clearError } =
    useVerifyOtpStore();

  // Час дії коду (3:00) і короткий кулдаун на повторну відправку.
  const ttl = useCountdown(OTP_TTL_SECONDS);
  const cooldown = useCountdown(OTP_RESEND_COOLDOWN_SECONDS);

  const expired = ttl.secondsLeft === 0;
  const canResend = cooldown.secondsLeft === 0 && !resending;
  const isComplete = code.length === OTP_LENGTH;

  const handleChange = (e) => {
    // Лише цифри; вставка з буфера теж обрізається до потрібної довжини.
    setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH));
    clearError();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isComplete || expired) return;
    clearError();
    verify({ email, otpCode: code }, onSuccess);
  };

  const handleResend = () => {
    if (!canResend) return;
    resend({ email }, () => {
      setCode("");
      ttl.restart();
      cooldown.restart();
    });
  };

  return (
    <form onSubmit={handleSubmit} role="form" className="auth-form">
      <div className="auth-fields">
        {error && <p className="text-danger mb-0">{error}</p>}
        {info && !error && <p className="text-success mb-0">{info}</p>}

        <div>
          <label htmlFor="otpInput" className="form-label d-block text-center">
            Одноразовий код
          </label>
          <input
            id="otpInput"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d*"
            maxLength={OTP_LENGTH}
            className="form-control otp-input"
            placeholder={"0".repeat(OTP_LENGTH)}
            value={code}
            onChange={handleChange}
            autoFocus
            required
          />
          <div className="form-text text-center">
            Код надіслано на {email}.{" "}
            {expired
              ? "Час дії коду минув — запросіть новий."
              : `Діє ще ${formatMmSs(ttl.secondsLeft)}.`}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !isComplete || expired}
          className="btn btn-primary w-100"
        >
          {loading ? "Верифікація..." : "Верифікувати"}
        </button>

        <div className="small text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend}
            className="btn btn-link p-0 align-baseline"
          >
            {resending ? "Надсилаємо..." : "Відправити код повторно"}
          </button>
          {cooldown.secondsLeft > 0 && (
            <span className="text-muted">
              {" "}
              (через {formatMmSs(cooldown.secondsLeft)})
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
