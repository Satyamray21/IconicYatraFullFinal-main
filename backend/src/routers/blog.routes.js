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
import { verifyToken } from '../middleware/user.middleware.js';
import { requirePermission } from '../middleware/staffPermission.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllBlogs);
router.get('/stats', getBlogStats);
router.get('/category/:category', getBlogsByCategory);
router.get('/:identifier/related', getRelatedBlogs);
router.get('/:identifier', getBlogByIdentifier);

router.post(
    '/',
    verifyToken,
    requirePermission('canCreateBlog'),
    upload.single('image'),
    handleUploadError,
    createBlog
);

router.put(
    '/:id',
    verifyToken,
    requirePermission('canEditBlog'),
    upload.single('image'),
    handleUploadError,
    updateBlog
);

router.delete('/:id', verifyToken, requirePermission('canDeleteBlog'), deleteBlog);

export default router;