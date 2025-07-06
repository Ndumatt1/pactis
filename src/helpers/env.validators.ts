import * as Joi from 'joi';

export const envVarsSchema = Joi.object({
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  REDIS_PORT: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
});
