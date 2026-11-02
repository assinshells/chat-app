import SimpleBar from "simplebar-react";
import { ArrowLeft } from "lucide-react";
import brandImage from "@shared/assets/logo/brand.png";
import { APP_NAME } from "@shared/constants/auth.constants.js";

/**
 * AuthLayout — обгортка екранів авторизації (одна колонка, без поділу
 * екрана навпіл — однаково для входу, реєстрації, відновлення пароля).
 *
 * title — заголовок над формою, subtitle — підзаголовок під ним.
 * onBack — якщо передано, показує кнопку "Назад" над заголовком.
 */
export function AuthLayout({ children, title, subtitle, onBack }) {
  return (
    // height (не maxHeight): SimpleBar рахує область скролу за фактичною
    // висотою свого контенту лише тоді, коли сам корінь має явну висоту.
    <SimpleBar style={{ height: "100vh" }} autoHide={true}>
      <div className="container-fluid d-table w-100 vh-100 p-0">
        <div className="d-table-cell align-middle">
          <div className="auth-single">
            <div className="auth-panel">
              <a href="/" className="auth-logo">
                <img src={brandImage} alt={APP_NAME} className="auth-logo-img" />
              </a>

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

              {(title || subtitle) && (
                <div className="auth-heading">
                  {title && <h1 className="auth-title">{title}</h1>}
                  {subtitle && <p className="auth-subtitle">{subtitle}</p>}
                </div>
              )}

              {children}
            </div>
          </div>
        </div>
      </div>
    </SimpleBar>
  );
}
