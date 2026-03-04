import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import config from "../../config";
import { IGenericErrorMessage } from "../../interfaces/error";
import handleZodError from "../../errors/handleZodError";
import handleClientError from "../../errors/handleClientError";
import ApiError from "../../errors/ApiErrors";

const GlobalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode: any = httpStatus.INTERNAL_SERVER_ERROR;
  let message = error.message || "Something went wrong!";
  let errorMessages: IGenericErrorMessage[] = [];

  // handle prisma client validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    let fieldName;
    message = `Invalid input data. Please check the request payload.`;

    const missingArgMatch = error.message.match(/Argument `(.+?)` is missing/);
    if (missingArgMatch) {
      fieldName = missingArgMatch[1];

      errorMessages.push({
        path: fieldName,
        message: `The '${fieldName}' field is required but was not provided. Please include a valid '${fieldName}' object or connect an existing one.`,
      });
    }
    const invalidTypeMatch = error.message.match(/Invalid `(.+?)`: Expected/);
    if (invalidTypeMatch) {
      fieldName = invalidTypeMatch[1];
      errorMessages.push({
        path: fieldName,
        message: `Invalid '${fieldName}' value. Expected a nested object or array, but received a different type. Example: \n'${fieldName}': [{ id: 'some-id' }]`,
      });
    }
    const unknownFieldMatch = error.message.match(/Argument `(.+?)`/);
    if (unknownFieldMatch) {
      fieldName = unknownFieldMatch[1];
      errorMessages.push({
        path: fieldName,
        message: `Unexpected field '${fieldName}' encountered. Ensure that the field name is correct and valid for the input structure.`,
      });
    }
  }

  // Handle Zod Validation Errors
  else if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }

  // Handle Prisma Client Known Request Errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const simplifiedError = handleClientError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }

  // Handle Custom ApiError
  else if (error instanceof ApiError) {
    statusCode = error?.statusCode;
    message = error.message;
    errorMessages = error?.message
      ? [
          {
            path: "",
            message: error?.message,
          },
        ]
      : [];
  }

  // Handle Errors
  else if (error instanceof Error) {
    message = error?.message;
    errorMessages = error?.message
      ? [
          {
            path: "",
            message: error?.message,
          },
        ]
      : [];
  }

  // Prisma Client Initialization Error
  else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message =
      "Failed to initialize Prisma Client. Check your database connection or Prisma configuration.";
    errorMessages = [
      {
        path: "",
        message: "Failed to initialize Prisma Client.",
      },
    ];
  }

  // Prisma Client Rust Panic Error
  else if (error instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message =
      "A critical error occurred in the Prisma engine. Please try again later.";
    errorMessages = [
      {
        path: "",
        message: "Prisma Client Rust Panic Error",
      },
    ];
  }

  // Prisma Client Unknown Request Error
  else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "An unknown error occurred while processing the request.";
    errorMessages = [
      {
        path: "",
        message: "Prisma Client Unknown Request Error",
      },
    ];
  }

  // Generic Error Handling (e.g., JavaScript Errors)
  else if (error instanceof SyntaxError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Syntax error in the request. Please verify your input.";
    errorMessages = [
      {
        path: "",
        message: "Syntax Error",
      },
    ];
  } else if (error instanceof TypeError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Type error in the application. Please verify your input.";
    errorMessages = [
      {
        path: "",
        message: "Type Error",
      },
    ];
  } else if (error instanceof ReferenceError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Reference error in the application. Please verify your input.";
    errorMessages = [
      {
        path: "",
        message: "Reference Error",
      },
    ];
  }
  // Catch any other error type
  else {
    message = "An unexpected error occurred!";
    errorMessages = [
      {
        path: "",
        message: "An unexpected error occurred!",
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    err: error,
    stack: config.env !== "production" ? error?.stack : undefined,
  });
};

export default GlobalErrorHandler;
