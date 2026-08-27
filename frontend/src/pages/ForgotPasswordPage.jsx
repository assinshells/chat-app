import { AuthLayout } from "@widgets/layouts";
import { ForgotPasswordForm } from "@features/auth/forgot-password/ui/ForgotPasswordForm.jsx";
import { AUTH_SCREENS } from "@shared/constants/auth.constants.js";
import { APP_NAME } from "@shared/constants/auth.constants.js";

export function ForgotPasswordPage({ onNavigate }) {
  return (
    <AuthLayout
      title={APP_NAME}
      subtitle="Забули пароль? Не страшно. Ми теж не пам'ятаємо все на світі — зараз все виправимо."
    >
      <ForgotPasswordForm
        onSuccess={(email) => onNavigate(AUTH_SCREENS.OTP, { email })}
        onBack={() => onNavigate(AUTH_SCREENS.LOGIN)}
      />
    </AuthLayout>
  );
}
