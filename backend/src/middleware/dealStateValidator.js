import {
  STAGE_LIST,
  BUYING_INTENT_LIST,
  OBJECTION_TYPE_LIST,
  OBJECTION_STATUS_LIST,
} from '../constants/dealConstants.js';

export const validateDealStateUpdate = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: 'Request body must be a valid JSON object',
    });
  }

  // 1. Validate numberOfUsers
  const numUsers = body.requirements?.numberOfUsers ?? body.numberOfUsers;
  if (numUsers !== undefined && numUsers !== null) {
    const parsed = Number(numUsers);
    if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 1) {
      return res.status(400).json({
        success: false,
        message: 'numberOfUsers must be a positive integer (minimum 1)',
      });
    }
  }

  // 2. Validate buyingIntent
  const intent = body.buyingIntent || body.intent;
  if (intent !== undefined && intent !== null) {
    const cleanIntent = String(intent).toUpperCase();
    if (!BUYING_INTENT_LIST.includes(cleanIntent)) {
      return res.status(400).json({
        success: false,
        message: `Invalid buyingIntent '${intent}'. Valid values: ${BUYING_INTENT_LIST.join(', ')}`,
      });
    }
  }

  // 3. Validate stage
  const stage = body.currentStage || body.decisionStage || body.dealStage || body.stage;
  if (stage !== undefined && stage !== null) {
    const cleanStage = String(stage).toUpperCase();
    if (!STAGE_LIST.includes(cleanStage)) {
      return res.status(400).json({
        success: false,
        message: `Invalid deal stage '${stage}'. Valid values: ${STAGE_LIST.join(', ')}`,
      });
    }
  }

  // 4. Validate objections
  if (body.objections !== undefined && body.objections !== null) {
    if (!Array.isArray(body.objections)) {
      return res.status(400).json({
        success: false,
        message: 'objections must be an array of objection objects',
      });
    }
    for (let i = 0; i < body.objections.length; i++) {
      const obj = body.objections[i];
      if (!obj || typeof obj !== 'object' || !obj.text || !String(obj.text).trim()) {
        return res.status(400).json({
          success: false,
          message: `Objection at index ${i} must have a non-empty 'text' field`,
        });
      }
      if (obj.type && !OBJECTION_TYPE_LIST.includes(String(obj.type).toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Objection at index ${i} has invalid type '${obj.type}'. Valid types: ${OBJECTION_TYPE_LIST.join(', ')}`,
        });
      }
      if (obj.status && !OBJECTION_STATUS_LIST.includes(String(obj.status).toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Objection at index ${i} has invalid status '${obj.status}'. Valid statuses: ${OBJECTION_STATUS_LIST.join(', ')}`,
        });
      }
    }
  }

  // 5. Validate competitors
  if (body.competitors !== undefined && body.competitors !== null) {
    if (!Array.isArray(body.competitors)) {
      return res.status(400).json({
        success: false,
        message: 'competitors must be an array of strings',
      });
    }
  }

  // 6. Validate dealScore if explicitly supplied
  if (body.dealScore !== undefined && body.dealScore !== null) {
    const score = Number(body.dealScore);
    if (isNaN(score) || score < 0 || score > 100) {
      return res.status(400).json({
        success: false,
        message: 'dealScore must be a number between 0 and 100',
      });
    }
  }

  next();
};
