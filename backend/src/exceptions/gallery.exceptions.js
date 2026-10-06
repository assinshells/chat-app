import { BaseException } from "./base.exception.js";
import { HTTP_STATUS } from "../constants/auth.constants.js";
import { GALLERY_ERRORS } from "../constants/gallery.constants.js";

export class GalleryValidationException extends BaseException {
  constructor(message = GALLERY_ERRORS.INVALID_BODY, code = "GALLERY_INVALID_BODY") {
    super(message, HTTP_STATUS.BAD_REQUEST, code);
  }
}

export class GalleryLimitException extends BaseException {
  constructor() {
    super(GALLERY_ERRORS.LIMIT_REACHED, HTTP_STATUS.CONFLICT, "GALLERY_LIMIT_REACHED");
  }
}

export class GalleryPhotoNotFoundException extends BaseException {
  constructor() {
    super(GALLERY_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND, "GALLERY_PHOTO_NOT_FOUND");
  }
}
