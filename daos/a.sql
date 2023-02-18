SELECT
    *
FROM
    (
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
                    json_build_object('id_user',post_reactions.id_user,
                    'reaction_type',post_reactions.reaction_type,
                    )
                )
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
                'wows',
                COUNT(post_reactions.reaction_type) FILTER (
                    WHERE
                        post_reactions.reaction_type = 'WOW'
                        AND post_reactions.id_user IS NOT NULL
                ),
                'laughs',
                COUNT(post_reactions.reaction_type) FILTER (
                    WHERE
                        post_reactions.reaction_type = 'LAUGH'
                        AND post_reactions.id_user IS NOT NULL
                ),
                'hearts',
                COUNT(post_reactions.reaction_type) FILTER (
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
            LEFT JOIN post_reactions ON post_reactions.id_post = posts.id_post AND post_reactions.del_flag=1
            LEFT JOIN users ON posts.author_id = users.id
        WHERE
            posts.del_flag = 1
        GROUP BY
            posts.id_post,
            users.id
    ) as results
ORDER BY
    results.view DESC,
    CAST(results.reactions ->> 'likes' AS bigint) DESC;