import React, { useState, useRef, useEffect } from "react";
import {
  User,
  MessageSquare,
  Users,
  Contact,
  Settings,
  Sun,
  Moon,
  LogOut,
  Pencil,
  ChevronDown,
  Search,
} from "lucide-react";

/* ----------------------------------------------------------------------- */
/*  Tooltip — small, no-dependency hover label                             */
/* ----------------------------------------------------------------------- */
function Tooltip({ label, children, side = "right" }) {
  const [open, setOpen] = useState(false);
  const sideClasses =
    side === "right"
      ? "left-full top-1/2 -translate-y-1/2 ml-2"
      : "top-full left-1/2 -translate-x-1/2 mt-2";

  return (
    <div
      className="relative flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-100 shadow-lg ${sideClasses}`}
        >
          {label}
        </span>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Dropdown — click to toggle, closes on outside click / Escape           */
/* ----------------------------------------------------------------------- */
function Dropdown({ trigger, children, align = "start" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={`absolute z-40 mt-2 min-w-[180px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl ${
            align === "end" ? "right-0" : "left-0"
          }`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ icon: Icon, children, danger }) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors ${
        danger
          ? "text-rose-600 hover:bg-rose-50"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {Icon && <Icon size={15} className="shrink-0" />}
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------------- */
/*  SimpleScroll — thin custom-scrollbar container (SimpleBar look-alike)  */
/* ----------------------------------------------------------------------- */
function SimpleScroll({ className = "", children }) {
  return (
    <div
      className={`overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-slate-300
        hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 ${className}`}
    >
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Tab config — icons only, panel content is a stub for now               */
/* ----------------------------------------------------------------------- */
const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "chat", label: "Chats", icon: MessageSquare },
  { id: "groups", label: "Groups", icon: Users },
  { id: "contacts", label: "Contacts", icon: Contact },
  { id: "settings", label: "Settings", icon: Settings },
];

/* ----------------------------------------------------------------------- */
/*  Sidebar 1 — narrow icon rail (pill nav + tooltips + profile dropdown)  */
/* ----------------------------------------------------------------------- */
function IconRail({ activeTab, onSelectTab, theme, onToggleTheme }) {
  return (
    <div className="flex h-full w-[70px] shrink-0 flex-col items-center border-r border-slate-200 bg-white py-4">
      {/* logo */}
      <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
        Ch
      </div>

      {/* pill tabs */}
      <nav className="flex flex-1 flex-col items-center gap-1.5">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <Tooltip key={id} label={label}>
              <button
                type="button"
                onClick={() => onSelectTab(id)}
                aria-current={active}
                className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                  active
                    ? "bg-teal-50 text-teal-600"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 2} />
              </button>
            </Tooltip>
          );
        })}
      </nav>

      {/* theme toggle */}
      <Tooltip label={theme === "light" ? "Dark mode" : "Light mode"}>
        <button
          type="button"
          onClick={onToggleTheme}
          className="mb-3 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </Tooltip>

      {/* profile dropdown */}
      <Dropdown
        trigger={
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-transparent transition hover:ring-slate-200"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
              PS
            </span>
          </button>
        }
      >
        <DropdownItem icon={User}>Profile</DropdownItem>
        <DropdownItem icon={Settings}>Settings</DropdownItem>
        <div className="my-1 h-px bg-slate-100" />
        <DropdownItem icon={LogOut} danger>
          Log out
        </DropdownItem>
      </Dropdown>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Sidebar 2 — content panel. Panels are placeholders/stubs only.         */
/* ----------------------------------------------------------------------- */
function StubPanel({ label }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-slate-400">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Pencil size={18} />
      </div>
      <p className="text-sm">
        «{label}» panel — content not implemented yet.
      </p>
    </div>
  );
}

function ContentPanel({ activeTab }) {
  const current = TABS.find((t) => t.id === activeTab);

  return (
    <div className="flex h-full w-[300px] shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <h2 className="text-lg font-semibold text-slate-800">
          {current.label}
        </h2>

        {activeTab === "profile" && (
          <Dropdown
            align="end"
            trigger={
              <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <ChevronDown size={16} />
              </button>
            }
          >
            <DropdownItem icon={Pencil}>Edit</DropdownItem>
            <DropdownItem>Another action</DropdownItem>
          </Dropdown>
        )}
      </div>

      {/* search box (visual only) */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
          <Search size={15} className="text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${current.label.toLowerCase()}…`}
            className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* scrollable stub area */}
      <SimpleScroll className="mt-3 flex flex-1 flex-col">
        <StubPanel label={current.label} />
      </SimpleScroll>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Combined demo export                                                   */
/* ----------------------------------------------------------------------- */
export default function ChatSidebars() {
  const [activeTab, setActiveTab] = useState("chat");
  const [theme, setTheme] = useState("light");

  return (
    <div className="flex h-[560px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 font-sans">
      <IconRail
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
      />
      <ContentPanel activeTab={activeTab} />
      <div className="hidden flex-1 items-center justify-center text-sm text-slate-300 md:flex">
        chat window goes here
      </div>
    </div>
  );
}