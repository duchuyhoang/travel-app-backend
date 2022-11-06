import { AUTH_METHOD } from "@common/enum";
import { get, log } from "@helpers/index";
import { CreateUserPayload } from "@models/User";
import axios from "axios";
export type SocialData = Omit<CreateUserPayload, "password">;

interface SocialConfigs {
  url: string;
  transformer: (data: any) => SocialData;
}
const socialConfigs: { [key: string]: SocialConfigs } = {
  [AUTH_METHOD.FB]: {
    url: process.env.FACEBOOK_GRAPH_API!,
    transformer: (data) => {
      const keys: Array<{
        apiKey: string;
        server: keyof SocialData;
        field?: string;
      }> = [
        {
          apiKey: "name",
          server: "name",
        },
        {
          apiKey: "picture",
          server: "avatar",
          field: "picture.data.url",
        },
        {
          apiKey: "email",
          server: "email",
        },
        {
          apiKey: "quote",
          server: "info",
        },
        {
          apiKey: "phone",
          server: "mobile",
        },
      ];
      return keys.reduce((prev, key, index) => {
        prev[key.server] = get(data, key.field || key.apiKey) || null;
        return prev;
      }, {} as SocialData);
    },
  },

  [AUTH_METHOD.GOOGLE]: {
    url: process.env.GOOGLE_GRAPH_API!,
    transformer: (data) => {
      const keys: Array<{
        apiKey: string;
        server: keyof SocialData;
        field?: string;
      }> = [
        {
          apiKey: "names",
          server: "name",
          field: "displayName",
        },
        {
          apiKey: "photos",
          server: "avatar",
          field: "url",
        },
        {
          apiKey: "phoneNumbers",
          server: "mobile",
        },
        {
          apiKey: "emailAddresses",
          server: "email",
        },
        {
          apiKey: "biographies",
          server: "info",
        },
      ];
      return keys.reduce((prev, key, index) => {
        const _data =
          data[key.apiKey] && data[key.apiKey][0] ? data[key.apiKey][0] : null;
        prev[key.server] = _data ? get(_data, key.field || "value") : null;
        return prev;
      }, {} as SocialData);
    },
  },
};

export const getUserSocialInfo = (accessToken: string, method: AUTH_METHOD) => {
  const configs = socialConfigs[method] || socialConfigs[AUTH_METHOD.GOOGLE];
  return axios
    .get(configs.url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((data) => configs.transformer(data.data));
};
