import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http-error";

export const validateDto = <T extends object>(dtoClass: new () => T) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const dto = plainToInstance(dtoClass, req.body ?? {});
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true
    });

    if (errors.length > 0) {
      next(
        new HttpError(
          400,
          errors
            .flatMap((error) => Object.values(error.constraints ?? {}))
            .join(", ")
        )
      );
      return;
    }

    req.body = dto;
    next();
  };
};
