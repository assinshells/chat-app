import LogoLight from "@shared/assets/logo/logo-light.svg";
import LogoDark from "@shared/assets/logo/logo-dark.svg";
import { SIDE_TABS } from "@shared/constants/sideTabs.constants.js";

export function SideMenu() {
  const logos = [
    ["dark", LogoDark],
    ["light", LogoLight],
  ];

  return (
    <div className="side-menu flex-lg-column me-lg-1 ms-lg-0">
      <div className="navbar-brand-box">
        {logos.map(([theme, logo]) => (
          <a key={theme} href="/" className={`logo logo-${theme}`}>
            <span className="logo-sm">
              <img src={logo} alt="Logo" height={30} />
            </span>
          </a>
        ))}
      </div>

      <div className="flex-lg-column my-auto">
        <ul
          className="nav nav-pills side-menu-nav justify-content-center"
          role="tablist"
        >
          {SIDE_TABS.map(({ id, title, icon: Icon, defaultActive }) => (
            <li className="nav-item" key={id} title={title}>
              <a
                className={`nav-link position-relative ${defaultActive ? "active" : ""}`}
                id={`pills-${id}-tab`}
                data-bs-toggle="pill"
                href={`#pills-${id}`}
                role="tab"
                aria-label={title}
              >
                <Icon />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
