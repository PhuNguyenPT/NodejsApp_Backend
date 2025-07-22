import {
    ArrayMinSize,
    IsArray,
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    Length,
    Matches,
} from "class-validator";

import { UserStatus } from "@/type/enum/user.status";
import { IUser } from "@/type/interface/user";

/**
 * Data Transfer Object for creating a new user
 * @example {
 *   "email": "jane.doe@example.com",
 *   "name": "Jane Doe",
 *   "password": "SecurePass123!",
 *   "phoneNumbers": ["+1 (555) 123-4567", "+84 123 456 789"],
 *   "status": "Happy"
 * }
 */
export class CreateUserDto implements IUser {
    @IsEmail({}, { message: "Must be a valid email address" })
    email!: string;

    @IsOptional()
    @IsString({ message: "Name must be a string" })
    @Length(1, 255, { message: "Name must be between 1 and 255 characters" })
    name?: string;

    @IsString({ message: "Password must be a string" })
    @Length(8, 128, {
        message: "Password must be between 8 and 128 characters",
    })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        {
            message:
                "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)",
        },
    )
    password!: string;

    @ArrayMinSize(1, { message: "At least one phone number is required" })
    @IsArray({ message: "Phone numbers must be an array" })
    @IsOptional()
    @IsString({ each: true, message: "Each phone number must be a string" })
    @Matches(/^\+?[\d\s\-()]+$/, {
        each: true,
        message: "Invalid phone number format",
    })
    phoneNumbers?: string[];

    @IsEnum(UserStatus, {
        message: `Status must be one of: ${Object.values(UserStatus).join(", ")}`,
    })
    @IsOptional()
    status?: UserStatus;
}
