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

/**
 * Data Transfer Object for creating a new user
 * @example {
 *   "email": "jane.doe@example.com",
 *   "name": "Jane Doe",
 *   "phoneNumbers": ["+1 (555) 123-4567", "+84 123 456 789"],
 *   "status": "Happy"
 * }
 */
export class UpdateUserDTO {
  @IsEmail({}, { message: "Must be a valid email address" })
  @IsOptional()
  email?: string;

  @IsOptional()
  @IsString({ message: "Name must be a string" })
  @Length(1, 255, { message: "Name must be between 1 and 255 characters" })
  name?: string;

  @ArrayMinSize(1, { message: "At least one phone number is required" })
  @IsArray({ message: "Phone numbers must be an array" })
  @IsOptional()
  @IsString({ each: true, message: "Each phone number must be a string" })
  @Matches(/^\+?[\d\s\-()]+$/, {
    each: true,
    message: "Invalid phone number format",
  })
  phoneNumbers?: string[];

  @IsIn(["Happy", "Sad"], { message: "Status must be either 'Happy' or 'Sad'" })
  @IsOptional()
  status?: "Happy" | "Sad";
}
