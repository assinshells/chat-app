import { AuthLayout } from "@widgets/layouts";
import { ForgotPasswordForm } from "@features/auth/forgot-password/ui/ForgotPasswordForm.jsx";
import { AUTH_SCREENS } from "@shared/constants/auth.constants.js";

export function ForgotPasswordPage({ onNavigate }) {
  return (
    <AuthLayout
      title="Знайдемо шлях назад"
      subtitle="Віднови доступ до свого акаунта за кілька простих кроків."
      onBack={() => onNavigate(AUTH_SCREENS.LOGIN)}
    >
      <ForgotPasswordForm
        onSuccess={(email) => onNavigate(AUTH_SCREENS.OTP, { email })}
      />
    </AuthLayout>
  );
}