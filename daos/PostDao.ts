import { DEL_FLAG } from "@common/enum";
import { Client, QueryConfig } from "pg";
import { BaseDao } from "./BaseDao";

export class PostDao extends BaseDao {
  constructor(client: Client) {
    super(client, "posts");
  }
  public async getAllPosts() {
    return this.getClient().query(`SELECT
    posts.*,
    -- ,reactionsUser.reaction_type,reactionsUser.id_user,
    json_build_object(
        'id',
        users.id,
        'name',
        users.name,
        'email',
        users.email,
        'mobile',
        users.mobile,
        'info',
        users.info,
        'avatar',
        users.avatar
    ) userInfo,
    COALESCE(
        json_agg(
            json_build_object(
                'id',
                tag.id_tag,
                'tag_name',
                tag.tag_name,
                'tag_description',
                tag.tag_description
            )
        ) FILTER (
            WHERE
                tag.del_flag = 1
                AND post_tags.del_flag = 1
        ),
        '[]'
    ) tags,
    json_build_object(
        'likes',
        COUNT(post_reactions.reaction_type) FILTER (
            WHERE
                post_reactions.reaction_type = 'LIKE'
                AND post_reactions.id_user IS NOT NULL
        ),
        'angries',
        COUNT(post_reactions.reaction_type) FILTER (
            WHERE
                post_reactions.reaction_type = 'ANGRY'
                AND post_reactions.id_user IS NOT NULL
        ),
        'sads',
        COUNT(post_reactions.reaction_type) FILTER (
            WHERE
                post_reactions.reaction_type = 'SAD'
                AND post_reactions.id_user IS NOT NULL
        ),
        'wows', COUNT(post_reactions.reaction_type) FILTER (
            WHERE
                post_reactions.reaction_type = 'WOW'
                AND post_reactions.id_user IS NOT NULL
        ),
        'laughs', COUNT(post_reactions.reaction_type) FILTER (
            WHERE
                post_reactions.reaction_type = 'LAUGH'
                AND post_reactions.id_user IS NOT NULL
        ),
        'hearts', COUNT(post_reactions.reaction_type) FILTER (
            WHERE
                post_reactions.reaction_type = 'HEART'
                AND post_reactions.id_user IS NOT NULL
        )
    ) reactions
FROM
    posts
    LEFT JOIN post_tags ON posts.id_post = post_tags.id_post
    AND post_tags.del_flag = 1
    LEFT JOIN tag ON post_tags.id_tag = tag.id_tag
    AND tag.del_flag = 1
    LEFT JOIN post_reactions ON post_reactions.id_post = posts.id_post
    INNER JOIN users ON posts.author_id = users.id
WHERE
    posts.del_flag = ${DEL_FLAG.EXIST}
GROUP BY
    posts.id_post,
    users.id;`);
  }
  public async getById(id_post: string) {
    return this.getClient().query(`SELECT posts.*,
	json_build_object(
			'likes',
			COUNT(post_reactions.reaction_type) FILTER (
				WHERE
					post_reactions.reaction_type = 'LIKE'
					AND post_reactions.id_user IS NOT NULL
			),
			'angries',
			COUNT(post_reactions.reaction_type) FILTER (
				WHERE
					post_reactions.reaction_type = 'ANGRY'
					AND post_reactions.id_user IS NOT NULL
			),
			'sads',
			COUNT(post_reactions.reaction_type) FILTER (
				WHERE
					post_reactions.reaction_type = 'SAD'
					AND post_reactions.id_user IS NOT NULL
			),
			'wows', COUNT(post_reactions.reaction_type) FILTER (
				WHERE
					post_reactions.reaction_type = 'WOW'
					AND post_reactions.id_user IS NOT NULL
			),
			'laughs', COUNT(post_reactions.reaction_type) FILTER (
				WHERE
					post_reactions.reaction_type = 'LAUGH'
					AND post_reactions.id_user IS NOT NULL
			),
			'hearts', COUNT(post_reactions.reaction_type) FILTER (
				WHERE
					post_reactions.reaction_type = 'HEART'
					AND post_reactions.id_user IS NOT NULL
			)
		) reactions,
		  json_build_object('id',users.id,'name',users.name,'email',users.email,'mobile',users.mobile,'info',users.info,'avatar',users.avatar) userInfo,
		  COALESCE(json_agg(json_build_object('id',tag.id_tag,'tag_name',tag.tag_name,'tag_description',tag.tag_description)) 
		  FILTER (WHERE tag.del_flag = 1 AND post_tags.del_flag=1),'[]') tags 
		  FROM posts 
		  LEFT JOIN post_tags ON posts.id_post=post_tags.id_post AND post_tags.del_flag = 1
		  LEFT JOIN tag ON post_tags.id_tag=tag.id_tag AND tag.del_flag=1 
		  INNER JOIN users ON posts.author_id = users.id 
		  LEFT JOIN post_reactions ON post_reactions.id_post = posts.id_post
		  WHERE posts.id_post = ${id_post} AND posts.del_flag = ${DEL_FLAG.EXIST}
		  GROUP BY posts.id_post,users.id`);
  }
  public async increaseView(id_post: string) {
    return this.getClient().query(
      `UPDATE posts SET view = view + 1 WHERE id_post = ${id_post} AND del_flag=${DEL_FLAG.EXIST} RETURNING view`
    );
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
