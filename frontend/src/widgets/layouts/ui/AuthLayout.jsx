import SimpleBar from "simplebar-react";
import { Copyright } from "lucide-react";
import { DeveloperModal, RulesModal, CookiesModal, WarningModal } from "@features/info";

const creationYear = 2026;
const currentYear = new Date().getFullYear();
const DEVELOPER_MODAL_ID = "authDeveloperModal";
const WARNING_MODAL_ID = "authWarningModal";
const RULES_MODAL_ID = "authRulesModal";
const COOKIES_MODAL_ID = "authCookiesModal";

export function AuthLayout({ title, subtitle, children }) {
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
      <div className="auth-layout">
        <div className="container-fluid px-3 auth-layout-inner">
          <div className="auth-content text-center">
            <span className="d-inline-block auth-brand mb-5">{title}</span>
            {subtitle && <p className="text-muted mb-4">{subtitle}</p>}
            {children}
            {/*
              Порядок лінків — за спаданням важливості: "Попередження"
              (вікове обмеження й особиста безпека — критично побачити
              ще до реєстрації) → "Правила" (умови користування) →
              "Файли cookie" (суто технічна інформація) → "Розробники"
              (не юридична інформація, тому завжди останній). Усі три
              нові лінки відкривають "безшапкові" модалки (без
              заголовка й футера, лише хрестик закриття) — той самий
              патерн, що й уже наявна модалка "Розробники".
            */}
            <div className="small">
              <div className="mb-2">
                <a
                  href="#"
                  className="text-muted text-decoration-none me-3"
                  data-bs-toggle="modal"
                  data-bs-target={`#${WARNING_MODAL_ID}`}
                  onClick={(e) => e.preventDefault()}
                >
                  Попередження
                </a>
                <a
                  href="#"
                  className="text-muted text-decoration-none me-3"
                  data-bs-toggle="modal"
                  data-bs-target={`#${RULES_MODAL_ID}`}
                  onClick={(e) => e.preventDefault()}
                >
                  Правила
                </a>
                <a
                  href="#"
                  className="text-muted text-decoration-none me-3"
                  data-bs-toggle="modal"
                  data-bs-target={`#${COOKIES_MODAL_ID}`}
                  onClick={(e) => e.preventDefault()}
                >
                  Файли cookie
                </a>
                <a
                  href="#"
                  className="text-muted text-decoration-none"
                  data-bs-toggle="modal"
                  data-bs-target={`#${DEVELOPER_MODAL_ID}`}
                  onClick={(e) => e.preventDefault()}
                >
                  Розробники
                </a>
              </div>
              <p>
                <Copyright className="footer-icon" size="1em" />{" "}
                {creationYear}
                {creationYear !== currentYear && `-${currentYear}`} {title}.
              </p>
              <span>All rights reserved.</span>
            </div>
          </div>
        </div>
      </div>
      <WarningModal modalId={WARNING_MODAL_ID} />
      <RulesModal modalId={RULES_MODAL_ID} bare />
      <CookiesModal modalId={COOKIES_MODAL_ID} />
      <DeveloperModal modalId={DEVELOPER_MODAL_ID} />
    </SimpleBar>
  );
}