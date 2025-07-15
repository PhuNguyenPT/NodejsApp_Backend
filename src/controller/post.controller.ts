// src/controller/post.controller.ts
import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from "express";

import PostService from "@/service/post.service.js";
import HttpException from "@/type/exception/http.exception.js";
import Controller from "@/type/interface/controller.interface.js";
import CreatePostDto from "@/type/interface/create.post.js";

class PostController implements Controller {
  public path = "/posts";
  public router = Router();
  private postService = new PostService();

  constructor() {
    this.initialiseRoutes();
  }

  private create: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { body, title } = req.body as CreatePostDto;
      const post = await this.postService.create(title, body);
      res.status(201).json({ post });
    } catch (error) {
      console.error("Error creating post:", error);
      const httpException = new HttpException(400, "Unable to create post");
      next(httpException);
    }
  };

  private initialiseRoutes(): void {
    this.router.post("/", this.create);
  }
}

export default PostController;
