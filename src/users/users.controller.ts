// src/users/users.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { RolesGuard, Roles } from "../common/guards/roles.guard";
import {
  CurrentUser,
  GatewayUser,
} from "../common/decorators/gateway-user.decorator";

// Prefijo del controlador — Kong enruta /users/* hacia este servicio
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users — solo ADMIN
  // Lista todos los usuarios del sistema
  @UseGuards(RolesGuard)
  @Roles("admin")
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // GET /users/health — health check público para K8s probes
  // No requiere autenticación — Kong lo permite pasar sin token
  @Get("health")
  health() {
    return { status: "ok", service: "clinic-user-service" };
  }

  // GET /users/:id — cualquier usuario autenticado
  // El servicio verifica internamente si es su propio perfil o ADMIN
  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  // GET /users/:id/exists — endpoint interno para otros microservicios
  // patient-service y doctor-service lo llaman vía HTTP REST
  // para verificar que el userId existe antes de crear perfiles
  @Get(":id/exists")
  exists(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.exists(id);
  }

  // POST /users — llamado internamente
  // Cuando auth-service publica user.registered, este endpoint
  // crea el registro en la BD del user-service
  // También lo puede llamar un ADMIN directamente
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // PATCH /users/:id — actualizar perfil
  // Ownership verificado en el servicio — solo el propio usuario o ADMIN
  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: GatewayUser,
  ) {
    return this.usersService.update(id, dto, currentUser.id, currentUser.role);
  }

  // DELETE /users/:id — soft delete (isActive = false) — solo ADMIN
  // Publica evento user.deactivated para que auth-service revoque tokens
  @UseGuards(RolesGuard)
  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  deactivate(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.deactivate(id);
  }
}
