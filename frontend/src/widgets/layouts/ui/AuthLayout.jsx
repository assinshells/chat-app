import SimpleBar from "simplebar-react";
import { Brand } from "@shared/ui/brand";
import { APP_NAME } from "@shared/constants/auth.constants.js";

export function AuthLayout({ children }) {
  return (
    // height (не maxHeight): SimpleBar рахує область скролу за
    // фактичною висотою свого контенту лише тоді, коли сам корінь має
    // явну висоту, а не просто верхню межу. З maxHeight контент, що
    // виріс вище екрана (довга форма реєстрації з палітрою кольорів і
    // рядком статі), іноді не отримував робочого скролу — ні
    // нативного (через overflow: visible на .auth-layout), ні від
    // самого SimpleBar, і заголовок сайту, що завжди першим у потоці,
    // ставав недосяжним.
    <SimpleBar style={{ height: "100vh" }} autoHide={true}>
      <div className="container-fluid d-table w-100 vh-100">
        <div className="d-table-cell align-middle">
          {/* Логотип спільний для всіх екранів авторизації (логін,
              реєстрація, відновлення пароля, OTP, скидання).
              Обгортка .auth-brand-wrap відтворює колишні розмір і
              позицію логотипа (ширина 40% від 280px, зсув -60px). */}
          <div className="mx-auto text-center auth-brand-wrap">
            <Brand className="mb-5" alt={APP_NAME} />
          </div>
          <div className="auth-content text-center">
            {children}
          </div>
        </div>
      </div>
    </SimpleBar>
  );
}
