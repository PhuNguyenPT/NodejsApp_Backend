// src/dto/post.res.ts
import { Expose } from "class-transformer";

class PostResponse {
  @Expose()
  body!: string;

  @Expose()
  id!: string;

  @Expose()
  title!: string;
}

export default PostResponse;
