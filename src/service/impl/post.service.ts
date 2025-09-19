// src/service/post.service.ts
import { Repository } from "typeorm";

import { postgresDataSource } from "@/config/data-source.config.js";
import PostEntity from "@/entity/post.entity.js";
import logger from "@/util/logger.js";

class PostService {
    private repository: Repository<PostEntity>;

    constructor() {
        this.repository = postgresDataSource.getRepository(PostEntity);
    }

    /**
     * Create a new post
     */
    public async create(title: string, body: string): Promise<PostEntity> {
        try {
            const post: PostEntity = new PostEntity({
                body,
                title,
            });
            const savedPost: PostEntity = await this.repository.save(post);
            logger.info("Post saved to database", {
                bodyLength: savedPost.body.length,
                postId: savedPost.id,
                title: savedPost.title,
            });
            return savedPost;
        } catch (error: unknown) {
            console.error("Error creating post:", error);
            throw new Error("Unable to create post");
        }
    }
}

export default PostService;
