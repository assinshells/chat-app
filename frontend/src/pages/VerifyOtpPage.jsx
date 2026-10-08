import { AuthLayout } from "@widgets/layouts";
import { OtpForm } from "@features/auth/verify-otp/ui/OtpForm.jsx";
import { AUTH_SCREENS } from "@shared/constants/auth.constants.js";

export function VerifyOtpPage({ onNavigate, email }) {
  return (
    <AuthLayout
      title="Підтвердіть пошту"
      onBack={() => onNavigate(AUTH_SCREENS.LOGIN)}
    >
      <OtpForm
        email={email}
        onSuccess={(verifiedToken) =>
          onNavigate(AUTH_SCREENS.RESET, { verifiedToken })
        }
      />
    </AuthLayout>
  );
}