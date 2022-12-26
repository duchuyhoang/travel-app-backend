import { DEL_FLAG } from "@common/enum";

export interface PostComment {
  id_comment: number;
  id_post: number;
  content: string;
  id_user: string;
  del_flag: DEL_FLAG;
}

export type CreatePostCommentPayload = Pick<
  PostComment,
  "id_post" | "content"
> & {};
