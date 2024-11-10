import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class ErrorHandlingMiddleware implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      this.handleError(exception, host);
    } else {
      console.log(
        "Error in error handling middleware:",
        exception.message,
        exception.stack
      );
      this.handleError(new UnauthorizedException(exception.message), host);
    }
  }

  handleError = (exception: HttpException, host: ArgumentsHost) => {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    let responseBody: any = {
      success: false,
      payload: {
        message: exception.message,
        timestamp: new Date().toISOString(),
      },
    };

    if (exception instanceof BadRequestException) {
      const validationErrors = exception.getResponse();
      if (typeof validationErrors === "object") {
        responseBody.payload = {
          ...responseBody.payload,
          errors: validationErrors["message"] || validationErrors,
        };
      }
    }

    response.status(status).json(responseBody);
  };
}
