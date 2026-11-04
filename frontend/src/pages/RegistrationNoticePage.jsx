import { AuthLayout } from "@widgets/layouts";
import { RegistrationNoticeForm } from "@features/auth/registration-notice/ui/RegistrationNoticeForm.jsx";
import { useCompleteRegistrationStore } from "@features/auth/complete-registration/model/useCompleteRegistrationStore.js";
import { AUTH_SCREENS } from "@shared/constants/auth.constants.js";

/**
 * Проміжна сторінка між входом і реєстрацією (екран REGISTRATION_NOTICE).
 * Сервер уже створив тимчасову реєстраційну сесію для нового логіна, тому
 * "Назад" скасовує її (як і на сторінці завершення реєстрації).
 */
export function RegistrationNoticePage({ login, room, onNavigate }) {
  const handleBack = async () => {
    const store = useCompleteRegistrationStore.getState();
    await store.cancel();
    store.reset();
    onNavigate(AUTH_SCREENS.LOGIN);
  };

  return (
    <AuthLayout
      title="Перед реєстрацією"
      subtitle="Ознайомтеся з умовами, щоб продовжити."
      onBack={handleBack}
    >
      <RegistrationNoticeForm
        onContinue={() =>
          onNavigate(AUTH_SCREENS.COMPLETE_REGISTRATION, { login, room })
        }
      />
    </AuthLayout>
  );
}
