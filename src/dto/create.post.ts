// src/dto/create.post.ts
import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreatePostDto {
  // Changed from default export to named export
  @IsNotEmpty({ message: "Body is required" })
  @IsString({ message: "Body must be a string" })
  @MaxLength(5000, { message: "Body cannot exceed 5000 characters" })
  @MinLength(1, { message: "Body must be at least 1 character long" })
  body!: string;

  @IsNotEmpty({ message: "Title is required" })
  @IsString({ message: "Title must be a string" })
  @MaxLength(200, { message: "Title cannot exceed 200 characters" })
  @MinLength(1, { message: "Title must be at least 1 character long" })
  title!: string;
}
