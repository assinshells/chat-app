import { ImageRepository } from "../repositories/image.repository.js";
import { ImageNotFoundException } from "../exceptions/chat.exceptions.js";

export const ImageService = {
  /**
   * getForUser — повертає { mime, data } або кидає ImageNotFoundException.
   *
   * Правила доступу:
   *  - scope='room' — будь-який автентифікований користувач (як і сама
   *    стрічка публічної кімнати);
   *  - scope='dm'   — лише відправник (owner_id) і одержувач
   *    (recipient_id). Стороннім повертається ТОЙ САМИЙ 404, що й для
   *    неіснуючого id — не розкриваємо факт існування чужої картинки.
   */
  async getForUser({ id, userId }) {
    if (!/^\d{1,18}$/.test(String(id))) throw new ImageNotFoundException();

    const image = await ImageRepository.findById(id);
    if (!image) throw new ImageNotFoundException();

    if (image.scope === "dm") {
      const uid = Number(userId);
      if (image.owner_id !== uid && image.recipient_id !== uid) {
        throw new ImageNotFoundException();
      }
    }

    return { mime: image.mime, data: image.data };
  },
};
