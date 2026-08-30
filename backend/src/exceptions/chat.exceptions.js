import { BaseException } from "./base.exception.js";
import { HTTP_STATUS } from "../constants/auth.constants.js";
import { CHAT_ERRORS, DM_ERRORS } from "../constants/chat.constants.js";

export class MessageValidationException extends BaseException {
  constructor(message = CHAT_ERRORS.MESSAGE_EMPTY) {
    super(message, HTTP_STATUS.BAD_REQUEST, "MESSAGE_VALIDATION_FAILED");
  }
}

export class PrivateMessageValidationException extends BaseException {
  constructor(message = DM_ERRORS.MESSAGE_EMPTY) {
    super(message, HTTP_STATUS.BAD_REQUEST, "PRIVATE_MESSAGE_VALIDATION_FAILED");
  }
}