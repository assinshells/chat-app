import { useState } from "react";
import {
  ChevronRight,
  Code,
  Cookie,
  MessageSquareText,
  ScrollText,
  TriangleAlert,
} from "lucide-react";

import {
  CookiesContent,
  DeveloperContent,
  FeedbackForm,
  RulesContent,
  WarningContent,
} from "@features/info";

import { SubPanelView } from "./SubPanelView.jsx";

const HELP_ITEMS = [
  { id: "warning", label: "Попередження", icon: TriangleAlert, Content: WarningContent },
  { id: "rules", label: "Правила", icon: ScrollText, Content: RulesContent },
  { id: "cookies", label: "Файли cookie", icon: Cookie, Content: CookiesContent },
  { id: "developers", label: "Розробники", icon: Code, Content: DeveloperContent },
  {
    id: "feedback",
    label: "Зворотний зв'язок",
    icon: MessageSquareText,
    Content: FeedbackForm,
  },
];

/**
 * HelpView — вкладена панель "Допомога" (Налаштування → Допомога): список
 * розділів (попередження, правила, cookie, розробники, зворотний зв'язок).
 * Кожен розділ відкривається не модалкою, а вкладеною вкладкою
 * (SubPanelView) поверх списку — той самий патерн, що й у SecurityView.
 */
export function HelpView({ onBack }) {
  const [selected, setSelected] = useState(null);
  const closeSubView = () => setSelected(null);

  const current = HELP_ITEMS.find((item) => item.id === selected);

  return (
    <>
      <SubPanelView title="Допомога" onBack={onBack}>
        {HELP_ITEMS.map(({ id, label, icon: ItemIcon }) => (
          <button
            key={id}
            type="button"
            className="app-sidebar-theme-btn"
            onClick={() => setSelected(id)}
          >
            <ItemIcon size={18} />
            <span className="app-panel-summary-label">{label}</span>
            <ChevronRight size={16} className="ms-auto" />
          </button>
        ))}
      </SubPanelView>

      {current && (
        <SubPanelView key={current.id} title={current.label} onBack={closeSubView}>
          <div className="p-3">
            <current.Content />
          </div>
        </SubPanelView>
      )}
    </>
  );
}
