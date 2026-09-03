import { Product } from '../models/Product.js';
import * as factory from './factoryController.js';

export const getProducts = factory.getAll(Product);
export const getProduct = factory.getOne(Product);
export const createProduct = factory.createOne(Product);
export const updateProduct = factory.updateOne(Product);
export const deleteProduct = factory.deleteOne(Product);