// src/controller/post.controller.ts
import { NextFunction, Request, Response, Router } from "express";

import { CreatePostDto } from "@/dto/create.post.js";
import PostResponse from "@/dto/post.res.js";
import Post from "@/entity/post.js";
import PostMapper from "@/mapper/post.mapper.js";
import validationMiddleware from "@/middleware/validation.middleware.js";
import PostService from "@/service/post.service.js";
import HttpException from "@/type/exception/http.exception.js";
import Controller from "@/type/interface/controller.interface.js";
import logger from "@/util/logger.js";

class PostController implements Controller {
  public path = "/posts";
  public router = Router();
  private postService = new PostService();

  constructor() {
    this.initializeRoutes();
    logger.info(`PostController initialized with path: ${this.path}`);
  }

  private create(
    req: Request<
      Record<string, never>,
      { postResponse: PostResponse },
      CreatePostDto
    >,
    res: Response<{ postResponse: PostResponse }>,
    next: NextFunction,
  ): Promise<void> {
    return (async () => {
      try {
        logger.info("Creating new post", {
          bodyLength: req.body.body?.length || 0,
          title: req.body.title,
        });

        // req.body is already validated and transformed by middleware
        const createPostDto = req.body;

        // Create post - validation already passed
        const post: Post = await this.postService.create(
          createPostDto.title,
          createPostDto.body,
        );

        logger.info("Post created successfully", {
          bodyLength: post.body?.length || 0,
          createdAt: post.createdAt,
          postId: post.id,
          title: post.title,
        });

        // Map Post entity to PostResponse DTO using mapper
        const postResponse: PostResponse = PostMapper.toDTO(post);

        logger.debug("Post mapped to response DTO", {
          postId: post.id,
          responseFields: Object.keys(postResponse),
        });

        res.status(201).json({ postResponse });

        logger.info("Post creation response sent", {
          postId: post.id,
          statusCode: 201,
        });
      } catch (error: unknown) {
        logger.error("Error creating post", {
          error: error instanceof Error ? error.message : "Unknown error",
          requestBody: req.body,
          stack: error instanceof Error ? error.stack : undefined,
        });

        const httpException = new HttpException(500, "Internal server error");
        next(httpException);
      }
    })();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/",
      validationMiddleware(CreatePostDto),
      this.create.bind(this),
    );
    logger.debug("PostController routes initialized");
  }
}

export default PostController;
