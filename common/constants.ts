export const HTML_REGEX = /(<([^>]+)>)/gi;
export const EMAIL_REGEX =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
export const MOBILE_REGEX = /^(\+\d{1,3}[- ]?)?\d{10}$/;

export const STATUS_CODE = {
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CREATED: 201,
  SUCCESS: 200,
};

export const DB_ERROR_MESSAGES: {
  [key: string]: string;
} = {
  "23505": "Violent key constraint",
};

export const MAX_FILE_SIZE = 5 * 1000000;
export const UPLOAD_FOLDER = "uploads"