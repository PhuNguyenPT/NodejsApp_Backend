// src/mapper/post.mapper.ts
import { plainToInstance } from "class-transformer";

import { PostResponse } from "@/dto/post-res.js";
import Post from "@/entity/post.entity.js";

const PostMapper = {
    /**
     * Convert Post entity to PostResponse DTO
     */
    toDTO(post: Post): PostResponse {
        return plainToInstance(PostResponse, post, {
            excludeExtraneousValues: true,
        });
    },

    /**
     * Convert array of Post entities to array of PostResponse DTOs
     */
    toDTOArray(posts: Post[]): PostResponse[] {
        return posts.map((post: Post) => PostMapper.toDTO(post));
    },
};

export default PostMapper;
