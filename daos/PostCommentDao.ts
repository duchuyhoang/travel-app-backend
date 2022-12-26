import { DEL_FLAG } from "common/enum";
import { Client, QueryConfig } from "pg";
import { BaseDao } from "./BaseDao";
export class PostCommentDao extends BaseDao {
  constructor(client: Client) {
    super(client, "post_comments");
  }
  public getCommentByPost(id_post: string) {
    return this.getClient().query({
      text: `SELECT post_comments.*,
        json_build_object('id',users.id,'name',users.name,'email',users.email,'mobile',users.mobile,'info',users.info,'avatar',users.avatar) user_info
        FROM post_comments INNER JOIN users ON post_comments.id_user = users.id AND post_comments.id_post = $1 AND post_comments.del_flag = ${DEL_FLAG.EXIST};`,
      values: [id_post],
    });
  }
}
