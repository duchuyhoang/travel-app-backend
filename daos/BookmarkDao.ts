import { DEL_FLAG, ORDER_BY, POST_STATUS } from "@common/enum";
import { Client } from "pg";
import { BaseDao } from "./BaseDao";

export class BookmarkDao extends BaseDao {
  constructor(client: Client) {
    super(client, "bookmark");
  }
  public async toggleBookmark(id_post: string, id_user: string) {
    return this.insertOne(
      {
        id_post,
        id_user,
      },
      {
        onConflictQuery: ` ON CONFLICT(id_post,id_user) 
        DO UPDATE SET del_flag = CASE WHEN bookmark.del_flag = ${DEL_FLAG.DELETED} THEN ${DEL_FLAG.EXIST} ELSE ${DEL_FLAG.DELETED} END `,
      }
    );
  }

  public async getBookmarkByCurUser(id_user: string) {
    return this.getClient().query({
      text: `SELECT bookmark.id,
        row_to_json(posts)::jsonb - '{content,search}'::text[] post_info,
        row_to_json(users)::jsonb - '{password_hash,salt}'::text[] user_info 
        from bookmark INNER JOIN posts ON bookmark.id_post = posts.id_post INNER JOIN users ON bookmark.id_user = users.id
        WHERE users.id = $1 AND bookmark.del_flag = ${DEL_FLAG.EXIST}`,
      values: [id_user],
    });
  }
}
