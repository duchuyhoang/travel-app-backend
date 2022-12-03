import { DEL_FLAG, REACTION_TYPE } from "@common/enum";

export interface PostCommentReaction {
  id_comment: number;
  id: number;
  id_user: number;
  reaction_type: REACTION_TYPE;
  del_flag: DEL_FLAG;
  create_at: Date;
}
