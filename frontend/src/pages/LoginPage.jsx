import { AuthLayout } from "@widgets/layouts";
import { LoginForm } from "@features/auth/login/ui/LoginForm.jsx";
import { AUTH_SCREENS } from "@shared/constants/auth.constants.js";

/**
 * Єдина сторінка входу й початку реєстрації (новий логін -> сторінка попередження -> завершення). Окремої сторінки/посилання
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
        onRegistrationRequired={({ login, room }) =>
          // Пароль далі не передається: він уже лежить (як хеш) у серверній
          // реєстраційній сесії, а форми реєстрації його більше не показують.
          onNavigate(AUTH_SCREENS.REGISTRATION_NOTICE, { login, room })
        }
        onForgot={() => onNavigate(AUTH_SCREENS.FORGOT)}
      />
    </AuthLayout>
  );
}
