// src/main.ts
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
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

  // Transporte AMQP — consume eventos de RabbitMQ (user.registered)
  // URL completa inyectada por K8s para evitar colisión con la variable
  // RABBITMQ_PORT que el service-discovery legacy autoinyecta como tcp://IP:5672.
  const rmqUrl = process.env.RABBITMQ_URL;
  if (!rmqUrl) {
    throw new Error("RABBITMQ_URL no está definida");
  }
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: "user.registered",
      queueOptions: { durable: true },
      noAck: false,
      prefetchCount: 1,
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  logger.log(`clinic-user-service escuchando en :${port}`);
}

void bootstrap();
