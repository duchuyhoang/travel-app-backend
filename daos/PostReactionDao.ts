import { DEL_FLAG, REACTION_TYPE } from "@common/enum";
import { Client } from "pg";
import { BaseDao } from "./BaseDao";

export class PostReactionDao extends BaseDao {
  constructor(client: Client) {
    super(client, "post_reactions");
  }
  public updatePostReaction(
    id_post: string,
    reactionType: REACTION_TYPE,
    id_user: string,
    status: DEL_FLAG
  ) {
    return this.insertOne(
      {
        id_post,
        reaction_type: reactionType,
        del_flag: status,
        id_user,
      },
      {
        onConflictQuery: ` ON CONFLICT(id_post,id_user) DO UPDATE SET del_flag = excluded.del_flag,reaction_type=excluded.reaction_type `,
      }
    );
  }
}
