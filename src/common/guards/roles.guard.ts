// src/common/guards/roles.guard.ts
//
// Guard que verifica el rol del usuario autenticado.
// El rol no viene del JWT — lo inyecta Kong en el header X-User-Role
// después de validar el token en el borde.
//
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";

export const ROLES_KEY = "roles";

// Decorador para marcar qué roles pueden acceder a un endpoint
import { SetMetadata } from "@nestjs/common";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener los roles requeridos del decorador @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay @Roles() en el handler, cualquier usuario autenticado puede acceder
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();
    // El rol viene del header inyectado por Kong
    const userRole = request.headers["x-user-role"] as string;

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere rol: ${requiredRoles.join(" | ")}`,
      );
    }

    return true;
  }
}
