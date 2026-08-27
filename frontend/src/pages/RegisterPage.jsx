import { AuthLayout } from "@widgets/layouts";
import { RegisterForm } from "@features/auth/register/ui/RegisterForm.jsx";
import { AUTH_SCREENS } from "@shared/constants/auth.constants.js";
import { APP_NAME } from "@shared/constants/auth.constants.js";

export function RegisterPage({ onNavigate }) {
  return (
    <AuthLayout
      title={APP_NAME}
      subtitle="Ще не з нами? Буває. У кожного колись перший раз — приєднуйтесь і побачите самі."
    >
      <RegisterForm
        onSuccess={() => onNavigate(AUTH_SCREENS.LOGIN)}
        onBack={() => onNavigate(AUTH_SCREENS.LOGIN)}
      />
    </AuthLayout>
  );
}
