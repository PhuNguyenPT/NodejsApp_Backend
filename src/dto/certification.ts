import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CertificationDTO {
  @IsOptional()
  @IsString({ message: "Credential ID must be a string" })
  @MaxLength(100, { message: "Credential ID cannot exceed 100 characters" })
  credentialId?: string;

  @IsOptional()
  expirationDate?: Date;

  @IsNotEmpty({ message: "Issue date is required" })
  issueDate!: Date;

  @IsNotEmpty({ message: "Issuing organization is required" })
  @IsString({ message: "Issuing organization must be a string" })
  @MaxLength(200, {
    message: "Issuing organization cannot exceed 200 characters",
  })
  @MinLength(1, {
    message: "Issuing organization must be at least 1 character long",
  })
  issuingOrganization!: string;

  @IsNumber({}, { message: "Level must be a number" })
  @IsOptional()
  @Max(10000, { message: "Level cannot exceed 10000" })
  @Min(0, { message: "Level cannot be negative" })
  level?: number;

  @IsOptional()
  @IsString({ message: "Level description must be a string" })
  @MaxLength(100, { message: "Level description cannot exceed 100 characters" })
  levelDescription?: string;

  @IsNotEmpty({ message: "Certification name is required" })
  @IsString({ message: "Certification name must be a string" })
  @MaxLength(200, {
    message: "Certification name cannot exceed 200 characters",
  })
  @MinLength(1, {
    message: "Certification name must be at least 1 character long",
  })
  name!: string;
}
