import { Deal } from '../models/Deal.js';
import * as factory from './factoryController.js';

export const getDeals = factory.getAll(Deal);
export const getDeal = factory.getOne(Deal);
export const createDeal = factory.createOne(Deal);
export const updateDeal = factory.updateOne(Deal);
export const deleteDeal = factory.deleteOne(Deal);