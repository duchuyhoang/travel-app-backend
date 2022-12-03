import { DEL_FLAG } from "@common/enum";
import { Client, QueryConfig } from "pg";
import { BaseDao } from "./BaseDao";

export class PostTagDao extends BaseDao {
  constructor(client: Client) {
    super(client, "post_tags");
  }
  public insertPostTag(idPost: string, tags: Array<string>) {
    if (tags.length === 0) return true;
    return this.bulkInsert(
      [
        {
          key: "id_post",
          value: new Array(tags.length).fill(idPost),
        },
        {
          key: "id_tag",
          value: tags,
        },
      ],
      {
        onConflictQuery: ` ON CONFLICT (id_tag,id_post) DO UPDATE SET del_flag = ${DEL_FLAG.EXIST}`,
      }
    );
  }
  public async deletePostTagsPost(idPost: string, tags: Array<string>) {
    return await this.getClient().query(
      `UPDATE ${this.tableName} SET del_flag=${DEL_FLAG.DELETED} WHERE id_post=$1`,
      [idPost]
    );
  }
  public async updatePostTagsPost(idPost: string, tags: Array<string>) {
    const deleteRs = await this.deletePostTagsPost(idPost, tags);
    return this.insertPostTag(idPost, tags);
  }
}
