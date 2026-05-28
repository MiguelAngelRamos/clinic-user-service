// src/users/dto/update-user.dto.ts
import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateUserDto {
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

  // isActive solo puede ser modificado por un ADMIN
  // El guard de ownership lo verifica en el controlador
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
