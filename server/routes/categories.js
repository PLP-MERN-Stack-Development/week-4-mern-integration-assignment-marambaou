const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/categories - Get all categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// POST /api/categories - Create a new category
router.post(
  '/',
  auth,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').optional().isString(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name, description } = req.body;
      const category = new Category({ name, description, slug: '' });
      await category.save();
      res.status(201).json(category);
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key error
        return res.status(400).json({ errors: [{ msg: 'Category name or slug must be unique' }] });
      }
      next(err);
    }
  }
);

module.exports = router; 