// src/service/post.service.ts
import { Repository } from "typeorm";

import { AppDataSource } from "@/config/data.source.js";
import Post from "@/entity/post.js";

class PostService {
  private repository: Repository<Post>;

  constructor() {
    this.repository = AppDataSource.getRepository(Post);
  }

  /**
   * Create a new post
   */
  public async create(title: string, body: string): Promise<Post> {
    try {
      const post: Post = new Post({
        body,
        title,
      });
      const savedPost = await this.repository.save(post);
      return savedPost;
    } catch (error: unknown) {
      console.error("Error creating post:", error);
      throw new Error("Unable to create post");
    }
  }
}

export default PostService;
