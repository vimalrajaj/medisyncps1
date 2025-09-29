import Joi from 'joi';

export const searchSchema = Joi.object({
  query: Joi.string().min(1).max(200).required(),
  system: Joi.string().valid('NAMASTE', 'ICD11', 'TM2', 'ALL').default('ALL'),
  limit: Joi.number().integer().min(1).max(100).default(10),
  language: Joi.string().valid('en', 'hi', 'sa').default('en'),
  exact: Joi.boolean().default(false)
});

export const lookupSchema = Joi.object({
  system: Joi.string().required(),
  code: Joi.string().required(),
  version: Joi.string().optional(),
  displayLanguage: Joi.string().valid('en', 'hi', 'sa').default('en')
});

export const translateSchema = Joi.object({
  url: Joi.string().uri().optional(),
  conceptMapVersion: Joi.string().optional(),
  code: Joi.string().required(),
  system: Joi.string().required(),
  version: Joi.string().optional(),
  source: Joi.string().uri().optional(),
  target: Joi.string().uri().optional(),
  targetsystem: Joi.string().optional(),
  reverse: Joi.boolean().default(false)
});

export const expandSchema = Joi.object({
  url: Joi.string().uri().optional(),
  valueSet: Joi.object().optional(),
  valueSetVersion: Joi.string().optional(),
  context: Joi.string().optional(),
  contextDirection: Joi.string().valid('incoming', 'outgoing').default('outgoing'),
  filter: Joi.string().optional(),
  count: Joi.number().integer().min(1).max(1000).default(100),
  includeDesignations: Joi.boolean().default(false),
  designation: Joi.array().items(Joi.string()).optional(),
  includeDefinition: Joi.boolean().default(false),
  activeOnly: Joi.boolean().default(true),
  excludeNested: Joi.boolean().default(false),
  excludeNotForUI: Joi.boolean().default(false),
  excludePostCoordinated: Joi.boolean().default(false)
});

export const bundleSchema = Joi.object({
  resourceType: Joi.string().valid('Bundle').required(),
  id: Joi.string().optional(),
  meta: Joi.object().optional(),
  type: Joi.string().valid('document', 'message', 'transaction', 'transaction-response', 'batch', 'batch-response', 'history', 'searchset', 'collection').required(),
  entry: Joi.array().items(
    Joi.object({
      fullUrl: Joi.string().optional(),
      resource: Joi.object().required(),
      request: Joi.object({
        method: Joi.string().valid('GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH').required(),
        url: Joi.string().required(),
        ifNoneMatch: Joi.string().optional(),
        ifModifiedSince: Joi.string().optional(),
        ifMatch: Joi.string().optional(),
        ifNoneExist: Joi.string().optional()
      }).optional(),
      response: Joi.object().optional()
    })
  ).required()
});

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body.length ? req.body : req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'invalid',
          details: {
            text: 'Validation error'
          },
          diagnostics: JSON.stringify(errors)
        }]
      });
    }

    req.validatedData = value;
    next();
  };
};