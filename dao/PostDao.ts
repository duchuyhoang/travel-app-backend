import { DEL_FLAG } from "@common/enum";
import { Client, QueryConfig } from "pg";
import { BaseDao } from "./BaseDao";

export class PostDao extends BaseDao {
  constructor(client: Client) {
    super(client, "posts");
  }
  public async getAllPosts() {
    return this.getClient().query(`SELECT posts.*,
	  json_build_object('id',users.id,'name',users.name,'email',users.email,'mobile',users.mobile,'info',users.info,'avatar',users.avatar) userInfo,
	  COALESCE(json_agg(json_build_object('id',tag.id_tag,'tag_name',tag.tag_name,'tag_description',tag.tag_description)) 
	  FILTER (WHERE tag.del_flag = 1 AND post_tags.del_flag=1),'[]') tags 
	  FROM posts 
	  LEFT JOIN post_tags ON posts.id_post=post_tags.id_post AND post_tags.del_flag = 1
	  LEFT JOIN tag ON post_tags.id_tag=tag.id_tag AND tag.del_flag=1 
	  INNER JOIN users ON posts.author_id = users.id 
	  WHERE posts.del_flag = ${DEL_FLAG.EXIST}
	  GROUP BY posts.id_post,users.id`);
  }
  public async getById(id_post: string) {
    return this.getClient().query(`SELECT posts.*,
	  json_build_object('id',users.id,'name',users.name,'email',users.email,'mobile',users.mobile,'info',users.info,'avatar',users.avatar) userInfo,
	  COALESCE(json_agg(json_build_object('id',tag.id_tag,'tag_name',tag.tag_name,'tag_description',tag.tag_description)) 
	  FILTER (WHERE tag.del_flag = 1 AND post_tags.del_flag=1),'[]') tags 
	  FROM posts 
	  LEFT JOIN post_tags ON posts.id_post=post_tags.id_post AND post_tags.del_flag = 1
	  LEFT JOIN tag ON post_tags.id_tag=tag.id_tag AND tag.del_flag=1 
	  INNER JOIN users ON posts.author_id = users.id 
	  WHERE posts.id_post = ${id_post} AND posts.del_flag = ${DEL_FLAG.EXIST}
	  GROUP BY posts.id_post,users.id `);
  }

  public async searchByString(search: string) {
    const queryParameters = search.split(" ");
    return this.getClient().query({
      text: `SELECT posts.*,
			json_build_object('id',users.id,'name',users.name,'email',users.email,'mobile',users.mobile,'info',users.info,'avatar',users.avatar) userInfo,
			COALESCE(json_agg(json_build_object('id',tag.id_tag,'tag_name',tag.tag_name,'tag_description',tag.tag_description)) 
			FILTER (WHERE tag.del_flag = 1 AND post_tags.del_flag=1),'[]') tags 
			FROM posts 
			LEFT JOIN post_tags ON posts.id_post=post_tags.id_post AND post_tags.del_flag = 1
			LEFT JOIN tag ON post_tags.id_tag=tag.id_tag AND tag.del_flag=1 
			INNER JOIN users ON posts.author_id = users.id 
			WHERE (${queryParameters
        .map((v, index) => `posts.search LIKE $${index + 1}`)
        .join(" AND ")}) AND posts.del_flag = ${DEL_FLAG.EXIST}
			GROUP BY posts.id_post,users.id`,
      values: queryParameters.map((v) => `%${v}%`),
    });
  }
}
