import { UserInfo } from "./User";
import { DEL_FLAG, POST_STATUS } from "@common/enum";
export interface Post {
  id_post: number;
  author: UserInfo;
  title: string;
  slug: string;
  content: string;
  create_at: Date;
  del_flag: DEL_FLAG;
  status: POST_STATUS;
  view: number;
  reactions: {
    likes: number;
    angries: number;
    sads: number;
    wows: number;
    laughs: number;
    hearts: number;
  };
}
export type DBPost = Omit<Post, "author"> & {
  author: string;
};

export type IPostPayload = Omit<
  Post,
  | "id_post"
  | "create_at"
  | "del_flag"
  | "status"
  | "author"
  | "slug"
  | "view"
  | "reactions"
> & {
  tags: Array<string>;
};
