import { AuthLayout } from "@widgets/layouts";
import { ResetPasswordForm } from "@features/auth/reset-password/ui/ResetPasswordForm.jsx";
import { AUTH_SCREENS } from "@shared/constants/auth.constants.js";

export function ResetPasswordPage({ onNavigate, verifiedToken }) {
  return (
    <AuthLayout
      title="Час для нового пароля"
      subtitle="Створи надійний пароль і повертайся до спілкування."
      onBack={() => onNavigate(AUTH_SCREENS.LOGIN)}
    >
      <ResetPasswordForm
        verifiedToken={verifiedToken}
        onSuccess={() => onNavigate(AUTH_SCREENS.LOGIN)}
      />
    </AuthLayout>
  );
}