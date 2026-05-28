// src/common/decorators/gateway-user.decorator.ts
//
// DISEÑO DE MICROSERVICIO — cómo funciona la autenticación aquí:
//
// Este servicio NO valida JWT directamente.
// Kong valida el token en el borde y, si es válido, inyecta los
// claims del usuario como headers HTTP hacia los microservicios:
//
//   X-User-Id:    uuid del usuario autenticado
//   X-User-Role:  admin | doctor | patient
//   X-User-Email: email del usuario
//
// Este decorador extrae esos headers de req y los expone en el
// método del controlador como parámetro tipado.
// Si los headers no están presentes, Kong rechazó la petición
// antes de llegar aquí — nunca llega un request sin autenticar.
//
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

export interface GatewayUser {
  id: string;
  role: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): GatewayUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return {
      id: request.headers["x-user-id"] as string,
      role: request.headers["x-user-role"] as string,
      email: request.headers["x-user-email"] as string,
    };
  },
);
