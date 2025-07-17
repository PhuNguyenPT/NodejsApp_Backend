// src/controller/post.controller.ts
import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from "express";

import { CreatePostDto } from "@/dto/create.post.js";
import { PostResponse } from "@/dto/post.res.js";
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

  /**
   * Handles the creation of a new post.
   * This method now conforms to the detailed Express RequestHandler signature.
   * @param req The Express request object, typed with route parameters, response body, request body, and query strings.
   * @param res The Express response object, typed with the response body.
   * @param next The Express next function to pass control to the next middleware.
   */
  private create: RequestHandler<
    Record<string, never>, // P (RouteParameters): No route parameters like /:id
    PostResponse, // ResBody: The type of the response body
    CreatePostDto // ReqQuery: The type for parsed query strings
  > = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // req.body is already validated and transformed to CreatePostDto by the middleware
    const createPostDto: CreatePostDto = req.body as CreatePostDto;
    try {
      logger.info("Creating new post", {
        bodyLength: createPostDto.body.length || 0,
        title: createPostDto.title,
      });

      // Create post using the service
      const post: Post = await this.postService.create(
        createPostDto.title,
        createPostDto.body,
      );

      logger.info("Post created successfully", {
        bodyLength: post.body.length || 0,
        createdAt: post.createdAt,
        postId: post.id,
        title: post.title,
      });

      // Map the Post entity to the response DTO
      const postResponse: PostResponse = PostMapper.toDTO(post);

      logger.debug("Post mapped to response DTO", {
        postId: post.id,
        responseFields: Object.keys(postResponse),
      });

      // Send the successful response
      res.status(201).json({ postResponse });

      logger.info("Post creation response sent", {
        postId: post.id,
        statusCode: 201,
      });
    } catch (error: unknown) {
      logger.error("Error creating post", {
        error: error instanceof Error ? error.message : "Unknown error",
        requestBody: req.body ? JSON.stringify(req.body) : "No body",
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Pass error to the error handling middleware
      const httpException = new HttpException(500, "Internal server error");
      next(httpException);
    }
  };

  private initializeRoutes(): void {
    // The 'create' method is already an arrow function, so 'this' is automatically bound.
    // No need for .bind(this)
    this.router.post("/", validationMiddleware(CreatePostDto), this.create);
    logger.debug("PostController routes initialized");
  }
}

export default PostController;
