import express from 'express';
import { upload, handleUploadError } from '../middleware/multer.middleware.js';
import {
    createBlog,
    getAllBlogs,
    getBlogByIdentifier,
    updateBlog,
    deleteBlog,
    getBlogsByCategory,
    getRelatedBlogs,
    getBlogStats
} from '../controllers/blog.controller.js';

const router = express.Router();

// Public routes
router.get('/', getAllBlogs);
router.get('/stats', getBlogStats);
router.get('/category/:category', getBlogsByCategory);
router.get('/:identifier/related', getRelatedBlogs);
router.get('/:identifier', getBlogByIdentifier);

// Protected routes (add authentication middleware as needed)
router.post(
    '/',
    upload.single('image'),
    handleUploadError,
    createBlog
);

router.put(
    '/:id',
    upload.single('image'),
    handleUploadError,
    updateBlog
);

router.delete('/:id', deleteBlog);

export default router;