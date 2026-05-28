// src/users/dto/create-user.dto.ts
//
// DTO para crear un usuario desde el interior del sistema.
// Este endpoint es llamado por otros servicios o por un admin —
// NO es un endpoint de registro público (eso es auth-service).
//
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import { UserRole } from "../entities/user.entity";

export class CreateUserDto {
  // El ID viene del auth-service — el user-service no lo genera
  @IsUUID("4")
  id!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
