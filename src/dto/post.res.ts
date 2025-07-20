// src/dto/post.res.ts
import { Expose } from "class-transformer";

export class PostResponse {
    @Expose()
    body!: string;

    @Expose()
    id!: string;

    @Expose()
    title!: string;
}
