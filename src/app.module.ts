// src/app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { appConfig, databaseConfig } from "./config";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    // ConfigModule global — carga .env y los 2 namespaces del user-service
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ".env",
      cache: true,
    }),

    // TypeORM — BD propia del user-service
    // synchronize: false SIEMPRE
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>("database.host"),
        port: configService.get<number>("database.port"),
        username: configService.get<string>("database.username"),
        password: configService.get<string>("database.password"),
        database: configService.get<string>("database.name"),
        entities: [__dirname + "/**/*.entity.{ts,js}"],
        synchronize: false,
        logging: configService.get<string>("app.nodeEnv") === "development",
        ssl: configService.get<boolean>("database.ssl") ?? false,
      }),
    }),

    // Rate limiting global — 60 req/min baseline
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60_000,
        limit: 60,
      },
    ]),

    UsersModule,
  ],
  providers: [
    // ThrottlerGuard global
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // NOTA: NO hay JwtAuthGuard aquí.
    // Este servicio NO valida JWT — Kong lo hace en el borde.
    // La "autenticación" aquí es leer los headers X-User-Id y X-User-Role
    // que Kong inyecta tras validar el token.
  ],
})
export class AppModule {}
