import { AuthLayout } from "@widgets/layouts";
import { CompleteRegistrationForm } from "@features/auth/complete-registration/ui/CompleteRegistrationForm.jsx";
import { useCompleteRegistrationStore } from "@features/auth/complete-registration/model/useCompleteRegistrationStore.js";
import { AUTH_SCREENS } from "@shared/constants/auth.constants.js";

/**
 * Сторінка завершення реєстрації (екран COMPLETE_REGISTRATION) — другий
 * крок процесу, розпочатого на сторінці входу. Дані (логін, пароль,
 * кімната) приходять від App.jsx лише в пам'яті; без них екран не
 * показується (див. App.jsx).
 */
export function CompleteRegistrationPage({
  login,
  password,
  room,
  onNavigate,
  onLoginSuccess,
}) {
  // "Назад": скасовуємо незавершену реєстрацію на сервері (сесія в Redis
  // і cookie) і повертаємось на сторінку входу. Пароль з пам'яті
  // зникає разом із параметрами екрана (App.navigate).
  const handleBack = async () => {
    const store = useCompleteRegistrationStore.getState();
    await store.cancel();
    store.reset();
    onNavigate(AUTH_SCREENS.LOGIN);
  };

  return (
    <AuthLayout
      title="Ще мить — і готово"
      subtitle="Заверши останній крок, щоб продовжити."
      onBack={handleBack}
    >
      <CompleteRegistrationForm
        login={login}
        password={password}
        onSuccess={(registeredLogin) => onLoginSuccess(registeredLogin, room)}
        onBack={handleBack}
      />
    </AuthLayout>
  );
}
