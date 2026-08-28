import { AuthLayout } from "@widgets/layouts";
import { LoginForm } from "@features/auth/login/ui/LoginForm.jsx";
import { AUTH_SCREENS } from "@shared/constants/auth.constants.js";
import { APP_NAME } from "@shared/constants/auth.constants.js";

export function LoginPage({ onNavigate, onLoginSuccess }) {
  return (
    <AuthLayout
      title={APP_NAME}
      subtitle="Тут усе пристойно. Майже. Це ж чат — а чати завжди трохи брудні."
    >
      <LoginForm
        onSuccess={(login, room) => {
          if (onLoginSuccess) {
            onLoginSuccess(login, room);
          } else {
            onNavigate(AUTH_SCREENS.APP);
          }
        }}
        onRegister={() => onNavigate(AUTH_SCREENS.REGISTER)}
        onForgot={() => onNavigate(AUTH_SCREENS.FORGOT)}
      />
    </AuthLayout>
  );
}
