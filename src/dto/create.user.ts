// src/dto/create.user.ts
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
} from "class-validator";

export class CreateUserDto {
  @IsEmail({}, { message: "Must be a valid email address" })
  email!: string;

  @IsString({ message: "Name must be a string" })
  @Length(1, 255, { message: "Name must be between 1 and 255 characters" })
  name!: string;

  @ArrayMinSize(1, { message: "At least one phone number is required" })
  @IsArray({ message: "Phone numbers must be an array" })
  @IsString({ each: true, message: "Each phone number must be a string" })
  @Matches(/^\+?[\d\s\-()]+$/, {
    each: true,
    message: "Invalid phone number format",
  })
  phoneNumbers!: string[];

  @IsIn(["Happy", "Sad"], { message: "Status must be either 'Happy' or 'Sad'" })
  @IsOptional()
  status?: "Happy" | "Sad";
}
