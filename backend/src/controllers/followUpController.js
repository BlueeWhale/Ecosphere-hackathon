import { FollowUp } from '../models/FollowUp.js';
import * as factory from './factoryController.js';

export const getFollowUps = factory.getAll(FollowUp);
export const getFollowUp = factory.getOne(FollowUp);
export const createFollowUp = factory.createOne(FollowUp);
export const updateFollowUp = factory.updateOne(FollowUp);
export const deleteFollowUp = factory.deleteOne(FollowUp);