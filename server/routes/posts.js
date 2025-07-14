const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + ext);
  },
});

// Multer file filter for images
function fileFilter(req, file, cb) {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
}

const upload = multer({ storage, fileFilter });

// GET /api/posts - Get all posts (with pagination, search, filter)
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { q, category } = req.query;
    const filter = {};
    if (q) {
      filter.title = { $regex: q, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }
    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .populate('category')
      .populate('author', '-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json({
      total,
      page,
      pageSize: posts.length,
      totalPages: Math.ceil(total / limit),
      posts,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:id - Get a specific post
router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('category').populate('author', '-password');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

// POST /api/posts - Create a new post
router.post(
  '/',
  auth,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('author').notEmpty().withMessage('Author is required'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const post = new Post(req.body);
      await post.save();
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/posts/upload - Upload a featured image
router.post('/upload', auth, upload.single('featuredImage'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or invalid file type' });
  }
  const filePath = `/uploads/${req.file.filename}`;
  res.status(201).json({ filePath });
});

// PUT /api/posts/:id - Update an existing post
router.put(
  '/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid post ID'),
    body('title').optional().notEmpty(),
    body('content').optional().notEmpty(),
    body('category').optional().notEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!post) return res.status(404).json({ error: 'Post not found' });
      res.json(post);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/posts/:id - Delete a post
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:id/comments - Get comments for a post
router.get('/:id/comments', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post.comments);
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:id/comments - Add a comment (anonymous allowed)
router.post(
  '/:id/comments',
  [body('content').notEmpty().withMessage('Content is required')],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      const comment = {
        content: req.body.content,
        createdAt: new Date(),
      };
      post.comments.push(comment);
      await post.save();
      res.status(201).json(comment);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router; 