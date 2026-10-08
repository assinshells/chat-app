import SimpleBar from "simplebar-react";
import { ArrowLeft } from "lucide-react";
import brandImage from "@shared/assets/logo/brand.png";
import { APP_NAME } from "@shared/constants/auth.constants.js";

/**
 * AuthLayout — обгортка екранів авторизації.
 *
 * title — заголовок над формою (напр. "З поверненням",
 * "Скидання пароля"). Показується на всіх сторінках авторизації.
 *
 * split — розділяє екран навпіл: ліворуч секція з логотипом,
 * праворуч секція з формою. Використовується лише на логіні та
 * реєстрації.
 *
 * onBack — для сторінок без split (забули пароль, OTP, скидання):
 * показує кнопку "Назад" над заголовком (повернення на логін).
 */

// Логотип — угорі зліва найближчого position: relative предка
// (ліва секція в split-режимі або колонка .auth-single).
function AuthLogo() {
  return (
    <a href="/" className="auth-split-name auth-split-logo">
      <img src={brandImage} alt={APP_NAME} className="auth-split-logo-img" />
    </a>
  );
}

function AuthHeading({ title }) {
  if (!title) return null;

  return (
    <div className="auth-heading">
      <h1 className="auth-heading-title">{title}</h1>
    </div>
  );
}

// Блок без split: [кнопка "Назад"] + стек (заголовок + форма).
function AuthSection({ title, onBack, children }) {
  return (
    <div className="auth-section">
      {onBack && (
        <button type="button" className="auth-back-btn" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Назад</span>
        </button>
      )}
      <div className="auth-stack">
        <AuthHeading title={title} />
        {children}
      </div>
    </div>
  );
}

export function AuthLayout({ children, title, onBack, split = false }) {
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
      {/* p-0: колонки прилягають до країв екрана, без внутрішніх
          відступів .container-fluid. */}
      <div className="container-fluid d-table w-100 vh-100 p-0">
        <div className="d-table-cell align-middle">
          {split ? (
            <div className="auth-split">
              {/* Ліва секція: логотип. Сама секція position: relative,
                  тому логотип стоїть угорі зліва саме в ній. */}
              <section className="auth-split-left auth-split-col">
                <AuthLogo />
              </section>

              {/* Права секція: панель → стек → блок форми → стек
                  із заголовком і самою формою. */}
              <section className="auth-split-right auth-split-col">
                <div className="auth-split-panel">
                  <div className="auth-stack">
                    <div className="auth-split-form">
                      <div className="auth-stack">
                        <AuthHeading title={title} />
                        {children}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            // Одиночна сторінка: колонка → логотип + панель → тіло →
            // секція ("Назад", стек із заголовком і формою).
            <div className="auth-split-col auth-single">
              <AuthLogo />
              <div className="auth-split-panel">
                <div className="auth-panel-body">
                  <AuthSection title={title} onBack={onBack}>
                    {children}
                  </AuthSection>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SimpleBar>
  );
}