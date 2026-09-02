import { countUppercaseRatio } from "./textNormalize.js";
import { moderationConfig } from "../config/moderation.config.js";

export const capsFilter = {
  /**
   * isShouting — true, якщо в тексті достатньо букв (короткі репліки
   * на кшталт "ОК", "ТАК!" не караються, див. caps.minLength) І частка
   * великих серед них перевищує caps.threshold.
   */
  isShouting(text) {
    const letterCount = (String(text ?? "").match(/\p{L}/gu) ?? []).length;
    if (letterCount < moderationConfig.caps.minLength) return false;

    return countUppercaseRatio(text) > moderationConfig.caps.threshold;
  },
};
