// src/main.ts
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);

  // Cabeceras HTTP de seguridad — OWASP A05:2021
  app.use(helmet());

  // CORS — solo el origen del frontend
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") ?? [],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  });

  // Prefijo global del microservicio
  app.setGlobalPrefix("users");

  // ValidationPipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Filtro global de excepciones
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger solo en development
  if (process.env.NODE_ENV === "development") {
    const config = new DocumentBuilder()
      .setTitle("clinic-user-service")
      .setDescription(
        "Microservicio de usuarios — gestión del perfil completo.",
      )
      .setVersion("1.0")
      .addApiKey(
        { type: "apiKey", in: "header", name: "x-user-id" },
        "x-user-id",
      )
      .addApiKey(
        { type: "apiKey", in: "header", name: "x-user-role" },
        "x-user-role",
      )
      .build();

    SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
  }

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  logger.log(`clinic-user-service escuchando en :${port}`);
}

void bootstrap();
