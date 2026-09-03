import { KnowledgeDocument } from '../models/KnowledgeDocument.js';
import * as factory from './factoryController.js';

export const getKnowledgeDocs = factory.getAll(KnowledgeDocument);
export const getKnowledgeDoc = factory.getOne(KnowledgeDocument);
export const createKnowledgeDoc = factory.createOne(KnowledgeDocument);
export const updateKnowledgeDoc = factory.updateOne(KnowledgeDocument);
export const deleteKnowledgeDoc = factory.deleteOne(KnowledgeDocument);