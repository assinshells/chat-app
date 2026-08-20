import { BaseException } from "./base.exception.js";
import { HTTP_STATUS } from "../constants/http.constants.js";
import { CHAT_ERRORS } from "../constants/chat.constants.js";

export class RoomNotFoundException extends BaseException {
  constructor(message = CHAT_ERRORS.ROOM_NOT_FOUND) {
    super(message, HTTP_STATUS.NOT_FOUND, "ROOM_NOT_FOUND");
  }
}

export class ChatValidationException extends BaseException {
  constructor(message = CHAT_ERRORS.VALIDATION_FAILED, details = []) {
    super(message, HTTP_STATUS.BAD_REQUEST, "VALIDATION_FAILED");
    this.details = details;
  }
}
