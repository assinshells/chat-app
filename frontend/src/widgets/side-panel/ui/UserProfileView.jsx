import { useEffect, useState } from "react";

import { fetchUserProfile } from "@shared/api/userProfile.api.js";
import { getMaritalStatusLabel } from "@shared/constants/maritalStatus.constants.js";
import { AppScrollbar } from "@shared/ui/scrollbar";

/**
 * UserProfileView — вміст панелі "Профіль" іншого користувача (відкривається
 * пунктом "Профіль" в меню дій, див. DmTriggerButton). Нік і хрестик
 * закриття — у шапці SidePanel. Тут, згори вниз: "Про себе" (лише якщо
 * заповнено), ім'я, місто, сімейний стан.
 */
export function UserProfileView({ login, onLoaded }) {
  // Результат останнього запиту разом із логіном, для якого він отриманий:
  // поки login інший — вважаємо, що йде завантаження (без setState в ефекті).
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!login) return undefined;

    let cancelled = false;

    fetchUserProfile(login)
      .then((data) => {
        if (cancelled) return;
        setResult({ login, profile: data.profile });
        onLoaded?.(data.profile);
      })
      .catch(() => {
        if (!cancelled) setResult({ login, error: true });
      });

    return () => {
      cancelled = true;
    };
  }, [login, onLoaded]);

  const current = result?.login === login ? result : null;

  if (!current) {
    return <div className="app-sidebar-empty">Завантаження…</div>;
  }

  if (current.error) {
    return <div className="app-sidebar-empty">Не вдалося завантажити профіль</div>;
  }

  const { profile } = current;
  const about = profile.about?.trim();

  const fields = [
    { label: "Ім'я", value: profile.displayName?.trim() },
    { label: "Місто", value: profile.city?.trim() },
    { label: "Сімейний стан", value: getMaritalStatusLabel(profile.maritalStatus) },
  ];

  return (
    <AppScrollbar className="app-panel-scroll">
      <div className="user-profile">
        {about && <p className="user-profile-about">{about}</p>}

        {fields.map(({ label, value }) => (
          <div key={label} className="user-profile-field">
            <div className="user-profile-label">{label}</div>
            <div className={`user-profile-value ${value ? "" : "is-empty"}`}>
              {value || "Не вказано"}
            </div>
          </div>
        ))}
      </div>
    </AppScrollbar>
  );
}
