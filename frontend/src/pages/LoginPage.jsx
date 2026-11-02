import { AuthLayout } from "@widgets/layouts";
import { LoginForm } from "@features/auth/login/ui/LoginForm.jsx";
import { AUTH_SCREENS } from "@shared/constants/auth.constants.js";

/**
 * Єдина сторінка входу й початку реєстрації. Окремої сторінки/посилання
 * реєстрації немає: якщо логіна ще не існує, сервер відповідає
 * registration_required, і ми переходимо до завершення реєстрації.
 */
export function LoginPage({ onNavigate, onLoginSuccess }) {
  return (
    <AuthLayout
      title="Раді бачити знову"
      subtitle="Твої розмови вже чекають на тебе."
    >
      <LoginForm
        onSuccess={(login, room) => {
          if (onLoginSuccess) {
            onLoginSuccess(login, room);
          } else {
            onNavigate(AUTH_SCREENS.APP);
          }
        }}
        onRegistrationRequired={({ login, password, room }) =>
          // Пароль передається лише в пам'яті (стан App), не через URL і
          // не через localStorage/sessionStorage.
          onNavigate(AUTH_SCREENS.COMPLETE_REGISTRATION, {
            login,
            password,
            room,
          })
        }
        onForgot={() => onNavigate(AUTH_SCREENS.FORGOT)}
      />
    </AuthLayout>
  );
}
