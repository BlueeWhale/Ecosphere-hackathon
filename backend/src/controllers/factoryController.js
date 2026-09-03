import { asyncHandler } from '../utils/asyncHandler.js';

export const getAll = (Model) =>
  asyncHandler(async (req, res) => {
    const docs = await Model.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: docs.length, data: docs });
  });

export const getOne = (Model) =>
  asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) {
      res.status(404);
      throw new Error('Resource not found');
    }
    res.status(200).json({ success: true, data: doc });
  });

export const createOne = (Model) =>
  asyncHandler(async (req, res) => {
    const doc = await Model.create(req.body);
    res.status(201).json({ success: true, data: doc });
  });

export const updateOne = (Model) =>
  asyncHandler(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
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
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      res.status(404);
      throw new Error('Resource not found');
    }
    res.status(200).json({ success: true, data: {} });
  });