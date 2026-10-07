import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from './errorHandler';

export const validate = (schema: AnyZodObject) => 
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationError('Validation failed', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }))));
      }
      return next(error);
    }
  };

export const validateBody = (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationError('Validation failed', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }))));
      }
      return next(error);
    }
  };

export const validateQuery = (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationError('Validation failed', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }))));
      }
      return next(error);
    }
  };

export const validateParams = (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationError('Validation failed', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }))));
      }
      return next(error);
    }
  };