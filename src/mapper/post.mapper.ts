// src/mapper/post.mapper.ts
import { plainToInstance } from "class-transformer";

import PostResponse from "@/dto/post.res.js";
import Post from "@/entity/post.js";

class PostMapper {
  /**
   * Convert Post entity to PostResponse DTO
   */
  static toDTO(post: Post): PostResponse {
    return plainToInstance(PostResponse, post, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Convert array of Post entities to array of PostResponse DTOs
   */
  static toDTOArray(posts: Post[]): PostResponse[] {
    return posts.map((post: Post) => this.toDTO(post));
  }
}

export default PostMapper;
