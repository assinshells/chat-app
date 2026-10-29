import SimpleBar from "simplebar-react";
import { ArrowLeft } from "lucide-react";
import brandImage from "@shared/assets/logo/brand.png";
import { APP_NAME } from "@shared/constants/auth.constants.js";

/**
 * AuthLayout — обгортка екранів авторизації (одна колонка, без поділу
 * екрана навпіл — однаково для входу, реєстрації, відновлення пароля).
 *
 * title — заголовок над формою.
 * onBack — якщо передано, показує кнопку "Назад" над заголовком.
 */
export function AuthLayout({ children, title, onBack }) {
  return (
    // height (не maxHeight): SimpleBar рахує область скролу за фактичною
    // висотою свого контенту лише тоді, коли сам корінь має явну висоту.
    <SimpleBar style={{ height: "100vh" }} autoHide={true}>
      <div className="container-fluid d-table w-100 vh-100 p-0">
        <div className="d-table-cell align-middle">
          <div className="auth-single">
            <a href="/" className="auth-logo">
              <img src={brandImage} alt={APP_NAME} className="auth-logo-img" />
            </a>

            <div className="auth-panel">
              {onBack && (
                <button
                  type="button"
                  className="auth-back-btn"
                  onClick={onBack}
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                  <span>Назад</span>
                </button>
              )}

              {title && <h1 className="auth-title">{title}</h1>}

              {children}
            </div>
          </div>
        </div>
      </div>
    </SimpleBar>
  );
}
