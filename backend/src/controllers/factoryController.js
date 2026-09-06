import { asyncHandler } from '../utils/asyncHandler.js';
import { tenantQuery } from '../middleware/tenantMiddleware.js';

const hasOwnershipField = (Model) => !!Model.schema.paths.user;

const getUserId = (user) => user?._id || user?.id;

const isAdmin = (user) => user?.role === 'admin';

export const getAll = (Model) =>
  asyncHandler(async (req, res) => {
    const query = { ...tenantQuery(req.user) };
    if (hasOwnershipField(Model) && !isAdmin(req.user)) {
      query.user = getUserId(req.user);
    }
    const docs = await Model.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: docs.length, data: docs });
  });

export const getOne = (Model) =>
  asyncHandler(async (req, res) => {
    const query = { _id: req.params.id, ...tenantQuery(req.user) };
    if (hasOwnershipField(Model) && !isAdmin(req.user)) {
      query.user = getUserId(req.user);
    }
    const doc = await Model.findOne(query);
    if (!doc) {
      res.status(404);
      throw new Error('Resource not found');
    }
    res.status(200).json({ success: true, data: doc });
  });

export const createOne = (Model) =>
  asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (hasOwnershipField(Model) && req.user && !data.user) {
      data.user = getUserId(req.user);
    }
    if (req.user?.role !== 'admin' && req.user?.tenantId) data.tenantId = req.user.tenantId;
    if (req.user?.role !== 'admin') delete data.tenantId;
    const doc = await Model.create(data);
    res.status(201).json({ success: true, data: doc });
  });

export const updateOne = (Model) =>
  asyncHandler(async (req, res) => {
    const query = { _id: req.params.id, ...tenantQuery(req.user) };
    if (hasOwnershipField(Model) && !isAdmin(req.user)) {
      query.user = getUserId(req.user);
    }
    const updateData = { ...req.body };
    if (hasOwnershipField(Model)) {
      delete updateData.user;
    }
    const doc = await Model.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      res.status(404);
      throw new Error('Resource not found');
    }
    res.status(200).json({ success: true, data: doc });
  });

export const deleteOne = (Model) =>
  asyncHandler(async (req, res) => {
    const query = { _id: req.params.id, ...tenantQuery(req.user) };
    if (hasOwnershipField(Model) && !isAdmin(req.user)) {
      query.user = getUserId(req.user);
    }
    const doc = await Model.findOneAndDelete(query);
    if (!doc) {
      res.status(404);
      throw new Error('Resource not found');
    }
    res.status(200).json({ success: true, data: {} });
  });
