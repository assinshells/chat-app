import { useEffect, useMemo, useState } from "react";
import { X, User as UserIcon } from "lucide-react";

import { ChatHeader } from "@widgets/chat-header";
import { ChatConversation } from "@widgets/chat-conversation";
import { ChatComposer } from "@widgets/chat-composer";
import { SideMenu } from "@widgets/side-menu";
import { ChatLeftSidebar } from "@widgets/chat-leftsidebar";
import { PrivateChat } from "@widgets/private-chat";
import { useChatSocket } from "@features/chat";
import { useDmStore } from "@features/dm";
import { useBlockStore } from "@features/block";
import { useFriendStore } from "@features/friends";
import { RoleManageModal } from "@features/roles";
import {
  KickModal,
  BanModal,
  BannedScreen,
  ConfinementBanner,
  RoomBanNoticeBanner,
} from "@features/moderation";
import { ROOMS_BY_ID } from "@features/chat/constants/rooms.constants.js";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { getRoleLabel, ROLE_VALUES } from "@shared/constants/role.constants.js";

// Скільки ніків/міток часу можна одночасно прикріпити до повідомлення
// через клік по ніку/часу в ChatConversation.
const MAX_TARGETS = 3;

export function ChatLayout({ login, initialRoom, onLogout }) {
  // useDmStore потрібен свій логін, щоб за вхідним dm:new {sender,
  // recipient} розуміти, хто тут "співрозмовник" (див. _handleIncoming).
  useEffect(() => {
    useDmStore.getState().setCurrentUser(login);
  }, [login]);

  const {
    activeRoom,
    switchRoom,
    messages,
    connected,
    roomCounts,
    roomUsers,
    sendMessage,
    cooldownMs,
    roomBan,
    confinement,
    roomBanNotice,
    banInfo,
    joinError,
    dismissJoinError,
    updateStatus,
  } = useChatSocket({
    enabled: Boolean(login),
    initialRoom,
  });

  // Тиха синхронізація зведення особистих діалогів одразу після
  // встановлення/відновлення з'єднання — без цього бейдж лічильника в
  // шапці (ChatHeader) лишався б порожнім аж до першого ручного
  // відкриття інбоксу: conversations на старті сесії порожній, і
  // ніщо, крім openInbox (клік по іконці "Пошта"), його раніше не
  // наповнювало. Спрацьовує і на перший конект, і на кожне
  // перепідключення (наприклад, якщо мережа моргнула, поки прилітали
  // офлайн-повідомлення) — саме той сценарій "написали, поки я був
  // офлайн, зайшов — лічильник мовчить".
  useEffect(() => {
    if (!login || !connected) return;
    useDmStore.getState().syncList();
  }, [login, connected]);

  // Персональні блокування (див. features/block/model/useBlockStore.js):
  // синхронізуємо одразу після конекту, тим самим принципом, що й
  // useDmStore.syncList вище — без цього вкладка "Заблоковані" в
  // сайдбарі лишалася б порожньою аж до першого відкриття, а
  // заблоковані користувачі не зникали б із чату/списку до неї.
  useEffect(() => {
    if (!login || !connected) return;
    useBlockStore.getState().syncList();
  }, [login, connected]);

  // Список друзів (див. features/friends/model/useFriendStore.js): той
  // самий принцип синхронізації одразу після конекту, що й
  // useBlockStore вище — без цього вкладка "Друзі" в сайдбарі лишалася
  // б порожньою аж до першого відкриття.
  useEffect(() => {
    if (!login || !connected) return;
    useFriendStore.getState().syncList();
  }, [login, connected]);

  // blockedLogins — підписка на сам Set (а не на функцію isBlocked),
  // щоб компонент коректно перерендерився при зміні списку заблокованих
  // (нова/старий Set — різні референси, isBlocked-функція сама по собі
  // стабільна і не викликала б ререндер).
  const blockedLogins = useBlockStore((state) => state.blockedLogins);

  // Заблокований користувач "повністю ігнорується" ЛИШЕ для того, хто
  // його заблокував: зникає зі списку онлайн (roomUsers) і з публічного
  // чату (messages, включно із системними подіями вхід/вихід/перехід).
  // Це персональна фільтрація перегляду на фронтенді (а не серверне
  // приховування) — інші учасники кімнати й далі бачать заблокованого
  // користувача як звичайного, і історія/лічильники кімнати на бекенді
  // не змінюються.
  const visibleRoomUsers = useMemo(
    () => roomUsers.filter((user) => !blockedLogins.has(user.login)),
    [roomUsers, blockedLogins],
  );

  const visibleMessages = useMemo(
    () =>
      messages.filter((message) => {
        const author =
          message.type === "system" ? message.login : message.author;
        return !blockedLogins.has(author);
      }),
    [messages, blockedLogins],
  );

  // targetNicknames / targetTimes — "цілі" повідомлення, зібрані кліками
  // по ніку/часу в ChatConversation, до MAX_TARGETS кожного. Живуть
  // тут, а не в ChatComposer, тому що заповнюються з сусіднього
  // компонента (ChatConversation) — спільний стан двох "дітей".
  const [targetNicknames, setTargetNicknames] = useState([]);
  const [targetTimes, setTargetTimes] = useState([]);

  // Показ/приховування панелі профілю користувача (справа) — кнопка
  // "user-profile-show" у шапці (ChatHeader) відкриває, хрестик
  // усередині панелі закриває. Проста булева стейт-машина: панель
  // рендериться завжди, видимість перемикається класом .is-open
  // (transform у app/styles/layout/_user-profile-sidebar.css), щоб
  // анімація відкриття/закриття працювала плавно.
  const [isProfileSidebarOpen, setProfileSidebarOpen] = useState(false);
  const openProfileSidebar = () => setProfileSidebarOpen(true);
  const closeProfileSidebar = () => setProfileSidebarOpen(false);

  // Escape закриває панель профілю, якщо вона зараз відкрита.
  useEffect(() => {
    if (!isProfileSidebarOpen) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeProfileSidebar();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isProfileSidebarOpen]);

  // Роль поточного користувача — єдине джерело правди на фронті (див.
  // коментар у currentUserStore.js), показуємо в панелі профілю.
  const currentUserRole = useCurrentUserStore((state) => state.role);

  // Статус доступності поточного користувача (таб "Налаштування" ->
  // "Профіль" у лівому сайдбарі, див. ChatLeftSidebar). Джерело
  // правди — той самий useCurrentUserStore, що й роль вище: заповнюється
  // з GET /api/auth/me при завантаженні і оптимістично оновлюється
  // одразу після успішного status:update (handleStatusChange нижче).
  const currentUserStatus = useCurrentUserStore((state) => state.status);

  const handleStatusChange = (status) => {
    updateStatus(status)
      .then(() => useCurrentUserStore.getState().setStatus(status))
      .catch(() => {
        // Немає з'єднання або сервер відхилив — просто лишаємо
        // попередній статус, окремого UI для помилки тут не потрібно
        // (той самий підхід, що й для теми/кольору в цьому файлі).
      });
  };

  const activeRoomName = ROOMS_BY_ID[activeRoom]?.name;

  // panelLogin — приватний діалог, розгорнутий ЗАМІСТЬ стрічки кімнати
  // в основній області (таб "Приватні повідомлення" в лівій рейці або
  // пункт "Написати особисте повідомлення" біля ніка). Живе в
  // useDmStore, а не в локальному стані: той самий стор тримає
  // історію/лічильники діалогів, і обидва входи мають вести в один
  // і той самий стан.
  //
  // ВАЖЛИВО: сокет-підписка на кімнату (useChatSocket вище) при цьому
  // не розривається — користувач лишається в кімнаті, її повідомлення
  // продовжують накопичуватися, і після "Назад" стрічка на місці.
  const dmPanelLogin = useDmStore((state) => state.panelLogin);
  const openDmPanel = useDmStore((state) => state.openConversation);
  const closeDmPanel = useDmStore((state) => state.closeConversation);

  const handleSelectDialog = (dialogLogin, color) => {
    openDmPanel(dialogLogin, color);
  };

  const handleSelectRoom = (roomId) => {
    // Вибір кімнати — явне повернення до публічного чату: якщо зараз
    // відкрито приватний діалог, він згортається, інакше клік по
    // кімнаті виглядав би так, ніби нічого не сталося.
    closeDmPanel();
    switchRoom(roomId);
    // Ніки/час обиралися з повідомлень поточної кімнати — при переході
    // в іншу кімнату вони втрачають сенс.
    setTargetNicknames([]);
    setTargetTimes([]);
  };

  const handleNicknameClick = (nickname) => {
    setTargetNicknames((prev) => {
      if (prev.includes(nickname) || prev.length >= MAX_TARGETS) return prev;
      return [...prev, nickname];
    });
  };

  const handleTimeClick = (time) => {
    setTargetTimes((prev) => {
      if (prev.includes(time) || prev.length >= MAX_TARGETS) return prev;
      return [...prev, time];
    });
  };

  const handleRemoveNickname = (nickname) => {
    setTargetNicknames((prev) => prev.filter((n) => n !== nickname));
  };

  const handleRemoveTime = (time) => {
    setTargetTimes((prev) => prev.filter((t) => t !== time));
  };

  const handleClearTargets = () => {
    setTargetNicknames([]);
    setTargetTimes([]);
  };

  // Відновлює цілі, якщо відправлення повідомлення не вдалося (ChatComposer
  // вже встиг оптимістично очистити їх перед відправленням).
  const handleRestoreTargets = ({ nicknames, times }) => {
    setTargetNicknames(nicknames);
    setTargetTimes(times);
  };

  // Глобальний бан — рендеримо ЗАМІСТЬ усього чату. Важливо: перевірка
  // йде ПІСЛЯ всіх hooks вище (useState/useEffect для сайдбара, цілей
  // тощо) — banInfo може з'явитися вже після монтування (жива подія
  // moderation:banned), і якби early return стояв РАНІШЕ якогось hook,
  // кількість викликаних hooks між рендерами різнилася б (порушення
  // Rules of Hooks). Тут гілкується лише JSX, hooks усі й завжди викликані.
  if (banInfo) {
    return <BannedScreen banInfo={banInfo} onLogout={onLogout} />;
  }

  return (
    <div className="layout-wrapper d-lg-flex">
      {/* Два ліві сайдбари: іконкова "рейка" (@widgets/side-menu, тут
          же — правила/фідбек у дропдауні профілю) і панель-вміст її
          вкладок (@widgets/chat-leftsidebar: кімнати, і користувачі —
          з підвкладками "Онлайн" (фільтр за статтю)/"Друзі"/
          "Заблоковані"). Пов'язані між собою лише спільними Bootstrap
          pill/pane id, React-стану в ChatLayout для цього не потрібно.
          Третій (порожній) сайдбар прибрано — весь його функціонал
          переїхав у ці два. */}
      <SideMenu login={login} onLogout={onLogout} />
      <ChatLeftSidebar
        login={login}
        activeRoom={activeRoom}
        roomCounts={roomCounts}
        roomUsers={visibleRoomUsers}
        onSelectRoom={handleSelectRoom}
        onNicknameClick={handleNicknameClick}
        onSelectDialog={handleSelectDialog}
        activeDialog={dmPanelLogin}
        selectedNicknames={targetNicknames}
        currentUserStatus={currentUserStatus}
        onStatusChange={handleStatusChange}
      />

      <div className="user-chat w-100 overflow-hidden">
        <div className="chat-main">
          <ChatHeader
            title={dmPanelLogin ? `Приватні · ${dmPanelLogin}` : activeRoomName}
            online={connected}
            onOpenProfile={openProfileSidebar}
          />
          {/* Основна область — або стрічка публічної кімнати, або
              приватний діалог, обраний у табі "Приватні повідомлення"
              лівого сайдбара (див. dmPanelLogin вище). Банери модерації
              і композер кімнати стосуються саме кімнати, тому в
              приватному режимі не рендеряться — свій композер у
              PrivateChat, зі своїми правилами (blocked). */}
          {dmPanelLogin ? (
            <PrivateChat
              key={dmPanelLogin}
              login={dmPanelLogin}
              onClose={closeDmPanel}
            />
          ) : (
            <>
            <ConfinementBanner confinement={confinement} />
            <RoomBanNoticeBanner notice={roomBanNotice} />
            {roomBan && (
              <div className="alert alert-danger m-2 mb-0 py-2 px-3 small">
                Вас заблоковано в цій кімнаті
                {roomBan.expiresAt
                  ? ` до ${new Date(roomBan.expiresAt).toLocaleString()}`
                  : " назавжди"}
                {roomBan.reason ? ` · Причина: ${roomBan.reason}` : ""}
              </div>
            )}
            {joinError && (
              <div className="alert alert-warning m-2 mb-0 py-2 px-3 small d-flex align-items-center justify-content-between">
                <span>
                  {joinError.message || "Не вдалося приєднатися до кімнати"}
                  {joinError.details?.expiresAt &&
                    ` · до ${new Date(joinError.details.expiresAt).toLocaleString()}`}
                </span>
                <button
                  type="button"
                  className="btn-close ms-2"
                  aria-label="Закрити"
                  onClick={dismissJoinError}
                />
              </div>
            )}
            <ChatConversation
              messages={visibleMessages}
              currentUser={login}
              onNicknameClick={handleNicknameClick}
              onTimeClick={handleTimeClick}
              onRoomClick={handleSelectRoom}
              selectedNicknames={targetNicknames}
              selectedTimes={targetTimes}
              roomUsers={visibleRoomUsers}
              activeRoom={activeRoom}
            />
            <ChatComposer
              onSend={sendMessage}
              cooldownMs={cooldownMs}
              targetNicknames={targetNicknames}
              targetTimes={targetTimes}
              onRemoveNickname={handleRemoveNickname}
              onRemoveTime={handleRemoveTime}
              onClearTargets={handleClearTargets}
              onRestoreTargets={handleRestoreTargets}
              disabled={Boolean(roomBan)}
              disabledReason={
                roomBan &&
                `Вас заблоковано в цій кімнаті${
                  roomBan.expiresAt
                    ? ` до ${new Date(roomBan.expiresAt).toLocaleString()}`
                    : " назавжди"
                }`
              }
            />
            </>
          )}

        </div>
        {/* Підкладка — клік поза панеллю закриває її (той самий патерн, що
          й Bootstrap-модалки: data-bs-backdrop="static" тут не потрібен,
          профіль не блокує критичних дій, тому закриття по кліку зовні
          доречне). Рендериться лише коли панель відкрита. */}
        {isProfileSidebarOpen && (
          <div
            className="user-profile-sidebar-backdrop"
            onClick={closeProfileSidebar}
            aria-hidden="true"
          />
        )}

        {/* Панель профілю користувача (справа) — показ/приховування через
          isProfileSidebarOpen (клас .is-open, див.
          app/styles/layout/_user-profile-sidebar.css). Рендериться
          завжди, щоб анімація закриття встигала відіграти, а не
          зникала миттєво разом з розмонтуванням. */}
        <aside
          className={`user-profile-sidebar ${isProfileSidebarOpen ? "is-open" : ""}`}
          aria-hidden={!isProfileSidebarOpen}
        >
          <div className="user-profile-sidebar-header">
            <span className="user-profile-sidebar-title">Профіль</span>
            <button
              type="button"
              className="user-profile-sidebar-close"
              id="user-profile-hide"
              title="Закрити"
              aria-label="Закрити профіль"
              onClick={closeProfileSidebar}
            >
              <X size={18} />
            </button>
          </div>

          <div className="user-profile-sidebar-content">
            <div className="user-profile-avatar" aria-hidden="true">
              <UserIcon size={28} />
            </div>

            <p className="user-profile-login">{login}</p>

            {currentUserRole && currentUserRole !== ROLE_VALUES.USER && (
              <span className="user-profile-role-badge">
                {getRoleLabel(currentUserRole)}
              </span>
            )}

            <div className="user-profile-info-row">
              <span className="user-profile-info-label">Кімната</span>
              <span className="user-profile-info-value">
                {activeRoomName ?? "—"}
              </span>
            </div>

            <div className="user-profile-info-row">
              <span className="user-profile-info-label">Статус</span>
              <span
                className={`user-profile-info-value ${connected ? "is-online" : "is-offline"}`}
              >
                {connected ? "Онлайн" : "Підключення…"}
              </span>
            </div>
          </div>
        </aside>
      </div>

      <RoleManageModal />
      <KickModal />
      <BanModal />
    </div>
  );
}
