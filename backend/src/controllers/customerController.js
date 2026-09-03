import { Customer } from '../models/Customer.js';
import * as factory from './factoryController.js';

export const getCustomers = factory.getAll(Customer);
export const getCustomer = factory.getOne(Customer);
export const createCustomer = factory.createOne(Customer);
export const updateCustomer = factory.updateOne(Customer);
export const deleteCustomer = factory.deleteOne(Customer);