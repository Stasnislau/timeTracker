import { NestFactory } from "@nestjs/core";
import { AppModule } from "./appModule";
import { ErrorHandlingMiddleware } from "./middlewares/errorHandlingMiddleware";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new ErrorHandlingMiddleware());
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    methods: "*",
    allowedHeaders: "*",
  });
  const port = process.env.PORT;
  await app.listen(port);

}
bootstrap();
