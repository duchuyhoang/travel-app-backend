import { EMAIL_REGEX, MAX_FILE_SIZE, MOBILE_REGEX } from "@common/constants";
import { isInDesiredForm } from "@helpers/index";
import { isImage } from "@middleware/file";
import moment from "moment";
import * as yup from "yup";
import { AUTH_METHOD, DEL_FLAG, POST_STATUS, REACTION_TYPE } from "./enum";

const multipleFileValidation = yup
  .array()
  .test("file-too-large", "File is too large, 5MB is allowed", (values) => {
    if (!values) return true;
    return values.every((v) => v.size < MAX_FILE_SIZE);
  });

const singleImageValidation = yup
  .mixed()
  .test("file-invalid", "Only image required", (value) => {
    if (!value) return true;
    return isImage(value);
  })
  .test("file-too-large", "File is too large, 5MB is allowed", (value) => {
    if (!value) return true;
    return value.size < MAX_FILE_SIZE;
  });

const userInfoValidation = {
  mobile: yup
    .string()
    .nullable()
    .notRequired()
    .test("mobile-valid", "Mobile is not valid", (v) => {
      if (!v) return true;
      return MOBILE_REGEX.test(v);
    }),
  name: yup
    .string()
    .required("Name required")
    .min(6, "Name at lease 6 characters")
    .max(255, "Name is too long"),
  info: yup.string().nullable().notRequired().max(255, "Description too long"),
  avatar: singleImageValidation,
};

export const signUpSchema = yup.object().shape({
  email: yup
    .string()
    .required("Email required")
    .matches(EMAIL_REGEX, "Email is not valid"),
  password: yup
    .string()
    .required("Password required")
    .min(6, "Password at least 6 characters")
    .max(255, "Password is too long"),
  ...userInfoValidation,
});

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required("Email required")
    .matches(EMAIL_REGEX, "Email is not valid"),
  password: yup.string().required("Password required"),
});

export const loginSocialSchema = yup.object().shape({
  accessToken: yup.string().required("Access token required"),
  method: yup.string().test("Valid method", "Invalid method", (value) => {
    return value === AUTH_METHOD.FB || value === AUTH_METHOD.GOOGLE;
  }),
});

export const editProfileSchema = yup.object().shape({ ...userInfoValidation });

export const editPasswordSchema = yup.object().shape({
  newPassword: yup
    .string()
    .required("New password required")
    .min(6, "Password at least 6 characters")
    .max(255, "Password is too long"),
  oldPassword: yup.string().required("Old password required"),
});

export const forgetEmailSchema = yup.object().shape({
  email: yup.string().required("Email required").email("Invalid email"),
});

export const editForgotPasswordSchema = yup.object().shape({
  password: yup
    .string()
    .required("New password required")
    .min(6, "Password at least 6 characters")
    .max(255, "Password is too long"),
  token: yup.string().required("Token required"),
});

export const mediaUploadSchema = yup.object().shape({
  files: multipleFileValidation,
});

export const createTagsSchema = yup.object().shape({
  tags: yup
    .array()
    .typeError("Must be an array")
    .test("Valid schema", "Invalid object", (values) => {
      return !!values?.every((v) => {
        const keys = Object.keys(v);
        return ["tag_name", "tag_description"].every((field) =>
          keys.includes(field)
        );
      });
    }),
});

export const getTagSchema = yup.object().shape({
  limit: yup
    .string()
    .nullable()
    .test("limit-valid", "Invalid limit", (v) => {
      if (!v) return true;
      return isInDesiredForm(v);
    }),
  offset: yup
    .string()
    .nullable()
    .test("offset-valid", "Invalid offset", (v) => {
      if (!v) return true;
      return isInDesiredForm(v);
    }),
});

export const getPostSchema = yup.object().shape({
  limit: yup
    .string()
    .nullable()
    .test("limit-valid", "Invalid limit", (v) => {
      if (!v) return true;
      return isInDesiredForm(v);
    }),
  offset: yup
    .string()
    .nullable()
    .test("offset-valid", "Invalid offset", (v) => {
      if (!v) return true;
      return isInDesiredForm(v);
    }),
});

export const getUsersSchema = yup.object().shape({
  limit: yup
    .string()
    .nullable()
    .test("limit-valid", "Invalid limit", (v) => {
      if (!v) return true;
      return isInDesiredForm(v);
    }),
  offset: yup
    .string()
    .nullable()
    .test("offset-valid", "Invalid offset", (v) => {
      if (!v) return true;
      return isInDesiredForm(v);
    }),
});

export const manipulationPostSchema = yup.object().shape({
  status: yup
    .string()
    .required("Post status required")
    .test("Valid post status", "Invalid post status", (v: any) => {
      return Object.values(POST_STATUS).includes(v);
    }),
});

export const getPostByTimeSchema = yup.object().shape({
  start: yup
    .string()
    .required("Start time required")
    .test("Invalid start", "Invalid start", (v: any) => {
      return moment(parseInt(v)).isValid();
    }),
  end: yup
    .string()
    .required("End time required")
    .test("Invalid end", "Invalid end", (v: any) => {
      return moment(parseInt(v)).isValid();
    }),
});

export const updatePostSchema = yup.object().shape({
  id_post: yup.string().required("Id post required"),
});

export const deleteTagsSchema = yup.object().shape({
  tags: yup
    .array()
    .typeError("Must be array of id")
    .test("valid ids", "Must not empty", (v) => {
      return !!v?.length;
    }),
});

export const insertPostSchema = yup.object().shape({
  tags: yup
    .array()
    .typeError("Must be array of id")
    .test("valid tags", "Must not empty", (v) => {
      return !!v?.length;
    }),
  title: yup.string().required("Title required").max(255, "Title too long"),
  content: yup.string().required("Content required"),
});

export const searchPostSchema = yup.object().shape({
  // search: yup.string().required("Search required"),
  limit: yup
    .string()
    .nullable()
    .test("limit-valid", "Invalid limit", (v) => {
      if (!v) return true;
      return isInDesiredForm(v);
    }),
  offset: yup
    .string()
    .nullable()
    .test("offset-valid", "Invalid offset", (v) => {
      if (!v) return true;
      return isInDesiredForm(v);
    }),
});

export const updatePostReactionSchema = yup.object().shape({
  id_post: yup.string().required("Id post required"),
  reaction_type: yup
    .string()
    .typeError("Must be a valid reaction")
    .test("valid react type", "Must be a valid reaction", (v) => {
      return Object.values(REACTION_TYPE).some(
        (value) => value.toString() === v
      );
    }),
  status: yup
    .string()
    .typeError("Must be a valid status")
    .test("valid status", "Must be a valid status", (v) => {
      return Object.values(DEL_FLAG).some(
        (value) => value.toString() === v?.toString()
      );
    }),
});

export const createPostCommentSchema = yup.object().shape({
  id_post: yup.string().required("Id post required"),
  content: yup.string().required("content required"),
});

export const editPostCommentSchema = yup.object().shape({
  id_comment: yup.string().required("Id comment required"),
  content: yup.string().required("content required"),
});

export const deletePostCommentSchema = yup.object().shape({
  id_comment: yup.string().required("Id comment required"),
});

export const getPostCommentSchema = yup.object().shape({
  id_post: yup.string().required("Id post required"),
  limit: yup
    .string()
    .nullable()
    .test("limit-valid", "Invalid limit", (v) => {
      if (!v) return true;
      return isInDesiredForm(v);
    }),
  offset: yup
    .string()
    .nullable()
    .test("offset-valid", "Invalid offset", (v) => {
      if (!v) return true;
      return isInDesiredForm(v);
    }),
});

export const verifyEmailSchema = yup.object().shape({
  token: yup.string().required("Token required"),
});

export const getBookmarkSchema = yup.object().shape({
  limit: yup
    .string()
    .nullable()
    .test("limit-valid", "Invalid limit", (v) => {
      if (!v) return true;
      return isInDesiredForm(v);
    }),
  offset: yup
    .string()
    .nullable()
    .test("offset-valid", "Invalid offset", (v) => {
      if (!v) return true;
      return isInDesiredForm(v);
    }),
});

export const toggleBookmarkSchema = yup.object().shape({
  id_post: yup.string().required("Id post required"),
});
