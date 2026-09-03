import { Conversation } from '../models/Conversation.js';
import * as factory from './factoryController.js';

export const getConversations = factory.getAll(Conversation);
export const getConversation = factory.getOne(Conversation);
export const createConversation = factory.createOne(Conversation);
export const updateConversation = factory.updateOne(Conversation);
export const deleteConversation = factory.deleteOne(Conversation);