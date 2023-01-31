import { DEL_FLAG, ORDER_BY, POST_STATUS } from "@common/enum";
import { Client, QueryConfig } from "pg";
import { BaseDao } from "./BaseDao";

export class PostDao extends BaseDao {
  constructor(client: Client) {
    super(client, "posts");
  }
  public async getAllPosts(orderBy?: ORDER_BY) {
    return this.getClient().query(`SELECT * FROM (
      SELECT
        posts.*,
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
                    post_reactions
                )
				FILTER (
                    WHERE
                        post_reactions.del_flag = 1 AND post_reactions.id_user IS NOT NULL
                ),'[]'
            ) reactionLists,
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
        LEFT JOIN users ON posts.author_id = users.id
    WHERE
        posts.del_flag = ${DEL_FLAG.EXIST} AND posts.status = '${
      POST_STATUS.APPROVED
    }'
    GROUP BY
        posts.id_post,
        users.id
    ) as results 
    ORDER BY ${
      orderBy === ORDER_BY.CREATE_AT
        ? `CASE WHEN results.create_at IS NULL THEN 1 ELSE 0 END`
        : `results.view DESC`
    },
    CAST(results.reactions->>'likes' AS bigint) DESC;`);
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
    COALESCE(
      json_agg(
          post_reactions
      )
FILTER (
          WHERE
              post_reactions.del_flag = 1 AND post_reactions.id_user IS NOT NULL
      ),'[]'
  ) reactionLists,

		  json_build_object('id',users.id,'name',users.name,'email',users.email,'mobile',users.mobile,'info',users.info,'avatar',users.avatar) userInfo,
		  COALESCE(json_agg(json_build_object('id',tag.id_tag,'tag_name',tag.tag_name,'tag_description',tag.tag_description)) 
		  FILTER (WHERE tag.del_flag = 1 AND post_tags.del_flag=1),'[]') tags 
		  FROM posts 
		  LEFT JOIN post_tags ON posts.id_post=post_tags.id_post AND post_tags.del_flag = 1
		  LEFT JOIN tag ON post_tags.id_tag=tag.id_tag AND tag.del_flag=1 
		  LEFT JOIN users ON posts.author_id = users.id 
		  LEFT JOIN post_reactions ON post_reactions.id_post = posts.id_post
		  WHERE posts.id_post = ${id_post} AND posts.del_flag = ${DEL_FLAG.EXIST}
      AND posts.status = '${POST_STATUS.APPROVED}' 
		  GROUP BY posts.id_post,users.id`);
  }
  public async increaseView(id_post: string) {
    return this.getClient().query(
      `UPDATE posts SET view = view + 1 WHERE id_post = ${id_post} AND del_flag=${DEL_FLAG.EXIST} AND status='${POST_STATUS.APPROVED}' RETURNING view`
    );
  }
  public async searchByStringAndTags(
    search: string,
    tags: Array<string>,
    author?: string
  ) {
    const searchTags = tags.filter((tag) => !!tag);
    const queryParameters = search ? search.split(" ") : [""];
    const queryPlaceholderParams = [];
    author && queryPlaceholderParams.push(author);
    let index = 1;
    return this.getClient().query({
      text: `SELECT * FROM (
        SELECT posts.*,
        COALESCE(
          json_agg(
              post_reactions
          )
  FILTER (
              WHERE
                  post_reactions.del_flag = 1 AND post_reactions.id_user IS NOT NULL
          ),'[]'
      ) reactionLists,
			json_build_object('id',users.id,'name',users.name,'email',users.email,'mobile',users.mobile,'info',users.info,'avatar',users.avatar) userInfo,
			COALESCE(json_agg(json_build_object('id',tag.id_tag,'tag_name',tag.tag_name,'tag_description',tag.tag_description)) 
			FILTER (WHERE tag.del_flag = 1 AND post_tags.del_flag=1),'[]') tags 
			FROM posts 
			LEFT JOIN post_tags ON posts.id_post=post_tags.id_post AND post_tags.del_flag = 1
			LEFT JOIN tag ON post_tags.id_tag=tag.id_tag AND tag.del_flag=1 
			LEFT JOIN users ON posts.author_id = users.id 
      LEFT JOIN post_reactions ON post_reactions.id_post = posts.id_post
			WHERE posts.status = '${POST_STATUS.APPROVED}' AND (${queryParameters
        .map((v, _) => `posts.search LIKE $${index++}`)
        .join(" AND ")}) AND posts.del_flag = ${DEL_FLAG.EXIST}
      ${
        searchTags.length > 0
          ? `AND post_tags.id_tag IN (${searchTags.join(",")}) `
          : ""
      }
      ${author ? `AND posts.author_id = $${index++} ` : ""}
			GROUP BY posts.id_post,users.id ) as results
      ORDER BY results.view DESC`,
      values: [
        ...queryParameters.map((v) => `%${v}%`),
        ...queryPlaceholderParams,
      ],
    });
  }
  public async getPostByUser(
    owner: string,
    isAdmin: boolean,
    orderBy?: ORDER_BY
  ) {
    return this.getClient().query(`SELECT * FROM (
      SELECT
        posts.*,
        COALESCE(
          json_agg(
              post_reactions
          )
  FILTER (
              WHERE
                  post_reactions.del_flag = 1 AND post_reactions.id_user IS NOT NULL
          ),'[]'
      ) reactionLists,
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
        LEFT JOIN users ON posts.author_id = users.id
    WHERE
        posts.del_flag = ${DEL_FLAG.EXIST}  ${
      !isAdmin ? `AND posts.author_id=${owner}` : ""
    }
    GROUP BY
        posts.id_post,
        users.id
    ) as results 
    ORDER BY ${
      orderBy === ORDER_BY.CREATE_AT
        ? `CASE WHEN results.create_at IS NULL THEN 1 ELSE 0 END`
        : `results.view DESC`
    },
    CAST(results.reactions->>'likes' AS bigint) DESC;`);
  }
}
