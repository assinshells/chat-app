import { MessageCircle } from "lucide-react";

import { useDmStore } from "@features/dm";
import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";
import { SplitModal } from "@shared/ui/split-modal";
import { DialogsList } from "./PrivateMessagesPanel.jsx";
import { PrivateChat } from "./PrivateChat.jsx";

/**
 * PrivateMessagesModal — модалка особистих повідомлень на оболонці
 * SplitModal: ліворуч список діалогів, праворуч листування (на телефоні
 * спочатку список, після вибору — чат із кнопкою "Назад"). Окремого
 * стану для цього нема: усе визначає useDmStore.panelLogin.
 */
export function PrivateMessagesModal() {
  const modalOpen = useDmStore((state) => state.modalOpen);
  const closeModal = useDmStore((state) => state.closeModal);
  const closeConversation = useDmStore((state) => state.closeConversation);
  const login = useDmStore((state) => state.panelLogin);
  const color = useDmStore((state) =>
    state.panelLogin ? state.conversations[state.panelLogin]?.color : null,
  );
  const isDarkTheme = useIsDarkTheme();

  return (
    <SplitModal
      open={modalOpen}
      onClose={closeModal}
      listTitle="Особисті повідомлення"
      list={<DialogsList />}
      hasDetail={Boolean(login)}
      onBack={closeConversation}
      detailTitle={login}
      detailTitleStyle={{ color: getEffectiveColorHex(color, isDarkTheme) }}
      placeholder={
        <>
          <MessageCircle size={36} />
          <p className="mb-0">Оберіть діалог зі списку</p>
        </>
      }
    >
      <PrivateChat key={login} login={login} />
    </SplitModal>
  );
}
