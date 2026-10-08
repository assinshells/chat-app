import { AuthLayout } from "@widgets/layouts";
import { RegisterForm } from "@features/auth/register/ui/RegisterForm.jsx";
import { AUTH_SCREENS } from "@shared/constants/auth.constants.js";

export function RegisterPage({ onNavigate }) {
  return (
    <AuthLayout split title="Створіть акаунт">
      <RegisterForm
        onSuccess={() => onNavigate(AUTH_SCREENS.LOGIN)}
        onBack={() => onNavigate(AUTH_SCREENS.LOGIN)}
      />
    </AuthLayout>
  );
}