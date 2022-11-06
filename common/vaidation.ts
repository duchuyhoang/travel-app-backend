import { EMAIL_REGEX, MOBILE_REGEX } from "@common/constants";
import * as yup from "yup";
import { AUTH_METHOD } from "./enum";

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
  mobile: yup
    .string()
    .nullable()
    .notRequired()
    .matches(MOBILE_REGEX, "Mobile is not valid"),
  name: yup
    .string()
    .required("Name required")
    .min(6, "Name at lease 6 characters")
    .max(255, "Name is too long"),
  info: yup.string().nullable().notRequired().max(255, "Description too long"),
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
