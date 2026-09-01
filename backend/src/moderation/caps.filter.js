import { countUppercaseRatio } from "./textNormalize.js";
import { moderationConfig } from "../config/moderation.config.js";

export const capsFilter = {
  /**
   * isShouting — true, если в тексте достаточно букв (короткие реплики
   * вроде "ОК", "ДА!" не наказываются, см. caps.minLength) И доля
   * заглавных среди них превышает caps.threshold.
   */
  isShouting(text) {
    const letterCount = (String(text ?? "").match(/\p{L}/gu) ?? []).length;
    if (letterCount < moderationConfig.caps.minLength) return false;

    return countUppercaseRatio(text) > moderationConfig.caps.threshold;
  },
};
