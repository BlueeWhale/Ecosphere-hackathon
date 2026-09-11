import { Product } from '../models/Product.js';
import * as factory from './factoryController.js';

// The product catalog is global reference data, not tenant-owned customer data.
export const getProducts = async (req, res, next) => {
	try {
		const products = await Product.find({ status: 'active' }).sort({ createdAt: -1 });
		res.status(200).json({ success: true, count: products.length, data: products });
	} catch (error) {
		next(error);
	}
};
export const getProduct = factory.getOne(Product);
export const createProduct = factory.createOne(Product);
export const updateProduct = factory.updateOne(Product);
export const deleteProduct = factory.deleteOne(Product);