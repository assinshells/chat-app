import { useEffect, useMemo, useState } from "react";

import { ChatHeader } from "@widgets/chat-header";
import { ChatConversation } from "@widgets/chat-conversation";
import { ChatComposer } from "@widgets/chat-composer";
import { LogoutConfirmModal } from "@features/auth/logout/ui/LogoutConfirmModal.jsx";
import { SidePanel } from "@widgets/side-panel";
import { RoomPickerModal, ROOM_PICKER_MODAL_ID } from "@widgets/room-picker";
import { useChatSocket } from "@features/chat";
import { useDmStore, DmToast } from "@features/dm";
import { useBlockStore } from "@features/block";
import { useFriendStore } from "@features/friends";
import { RulesModal, FeedbackModal } from "@features/info";
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
import {
  RULES_MODAL_ID,
  FEEDBACK_MODAL_ID,
} from "@shared/constants/infoModals.constants.js";
import { useSidePanelStore, SIDE_PANELS } from "@shared/lib/sidePanelStore.js";

// Скільки ніків/міток часу можна одночасно прикріпити до повідомлення
// через клік по ніку/часу в ChatConversation.
const MAX_TARGETS = 3;

// id модалки підтвердження виходу (кнопка-тригер — в ChatHeader).
const LOGOUT_MODAL_ID = "logoutConfirmModal";

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

  // Права панель (учасники / особисті / профіль) — стан у спільному
  // сторі (useSidePanelStore), бо її відкривають і з шапки, і з меню
  // біля ніка (DmTriggerButton), і з тосту нового особистого.
  const sidePanel = useSidePanelStore((state) => state.panel);
  const closeSidePanel = useSidePanelStore((state) => state.close);

  // Панель особистих закрита — діалог більше не "переглядається":
  // нові повідомлення знову рахуються непрочитаними, а наступне
  // відкриття починається зі списку діалогів (див. useDmStore).
  useEffect(() => {
    if (sidePanel !== SIDE_PANELS.DM) useDmStore.getState().closeConversation();
  }, [sidePanel]);

  // Escape закриває панель — але не поверх відкритої модалки, яка
  // сама обробляє Escape.
  useEffect(() => {
    if (!sidePanel) return undefined;

    const handleKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (document.querySelector(".modal.show")) return;
      closeSidePanel();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidePanel, closeSidePanel]);

  // Статус доступності поточного користувача (панель "Профіль",
  // див. @widgets/side-panel/ui/ProfilePanel). Джерело
  // правди — useCurrentUserStore: заповнюється
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

  const handleSelectRoom = (roomId) => {
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

  // Клік по ніку в панелі учасників. На телефоні панель займає весь
  // екран і закрила б форму відправлення, тож після вибору адресата
  // закриваємо її, щоб одразу можна було писати.
  const handlePanelNicknameClick = (nickname) => {
    handleNicknameClick(nickname);
    if (window.matchMedia("(max-width: 991.98px)").matches) closeSidePanel();
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
    <div className="layout-wrapper app-layout">
      <div className="user-chat">
        <div className="chat-main">
          <ChatHeader
            title={activeRoomName}
            online={connected}
            roomPickerModalId={ROOM_PICKER_MODAL_ID}
            logoutModalId={LOGOUT_MODAL_ID}
            usersCount={visibleRoomUsers.length}
          />
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
        </div>
      </div>

      {/* Права панель: на десктопі — колонка поруч із чатом (чат лишається
          доступним), на телефоні — на весь екран. */}
      {sidePanel && (
        <SidePanel
          panel={sidePanel}
          onClose={closeSidePanel}
          login={login}
          users={visibleRoomUsers}
          activeRoom={activeRoom}
          selectedNicknames={targetNicknames}
          onNicknameClick={handlePanelNicknameClick}
          currentUserStatus={currentUserStatus}
          onStatusChange={handleStatusChange}
        />
      )}

      <DmToast />

      <RoomPickerModal
        activeRoom={activeRoom}
        roomCounts={roomCounts}
        onSelectRoom={handleSelectRoom}
      />
      <LogoutConfirmModal modalId={LOGOUT_MODAL_ID} onConfirm={onLogout} />
      <RulesModal modalId={RULES_MODAL_ID} />
      <FeedbackModal modalId={FEEDBACK_MODAL_ID} />
      <RoleManageModal />
      <KickModal />
      <BanModal />
    </div>
  );
}
