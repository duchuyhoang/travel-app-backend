import { DEL_FLAG } from "common/enum";
import { Post } from "./Post";
import { UserInfo } from "./User";

export interface Bookmark {
  id: string;
  post: Post;
  user: UserInfo;
  del_flag: DEL_FLAG;
}
