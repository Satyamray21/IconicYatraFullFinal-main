import Blog from '../models/Blog.model.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinarys.js';

// Helper function to generate slug
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
};

// @desc    Create a new blog post
// @route   POST /api/blogs
// @access  Public (add authentication as needed)
const createBlog = async (req, res) => {
    try {
        // Parse blog data from form-data
        let blogData;
        try {
            blogData = JSON.parse(req.body.blogData);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid blog data format'
            });
        }

        // Check if blog with same title already exists
        const existingBlog = await Blog.findOne({ title: blogData.title });
        if (existingBlog) {
            return res.status(400).json({
                success: false,
                message: 'A blog with this title already exists'
            });
        }

        // Generate slug if not provided
        if (!blogData.slug) {
            blogData.slug = generateSlug(blogData.title);
        }

        // Check if slug already exists
        const existingSlug = await Blog.findOne({ slug: blogData.slug });
        if (existingSlug) {
            return res.status(400).json({
                success: false,
                message: 'A blog with this slug already exists'
            });
        }

        // Upload image to Cloudinary
        let imageData = null;
        if (req.file) {
            imageData = await uploadOnCloudinary(req.file.path);
            if (!imageData) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to upload image'
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Featured image is required'
            });
        }

        // Format date
        let formattedDate = blogData.date;
        if (blogData.date && typeof blogData.date === 'string') {
            const date = new Date(blogData.date);
            formattedDate = date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }).replace(/ /g, ' ');
        }

        // Create blog post
        const blog = new Blog({
            ...blogData,
            date: formattedDate,
            image: {
                url: imageData.url,
                publicId: imageData.publicId
            }
        });

        await blog.save();

        res.status(201).json({
            success: true,
            data: blog,
            message: 'Blog post created successfully'
        });

    } catch (error) {
        console.error('Create blog error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while creating blog post'
        });
    }
};

// @desc    Get all blog posts
// @route   GET /api/blogs
// @access  Public
const getAllBlogs = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            category, 
            subCategory,
            search, 
            sort = '-publishedAt',
            status = 'published'
        } = req.query;
        
        const query = { status };
        
        if (category) {
            query.category = category;
        }

        if (subCategory) {
            query.subCategory = subCategory;
        }

        // ✅ FIXED SEARCH
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { subCategory: { $regex: search, $options: 'i' } }
            ];
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const blogs = await Blog.find(query)
            .select('-__v')
            .sort(sort)
            .limit(limitNum)
            .skip(skip);

        const total = await Blog.countDocuments(query);

        res.status(200).json({
            success: true,
            data: blogs,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < Math.ceil(total / limitNum),
                hasPrevPage: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Get all blogs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching blogs'
        });
    }
};


// @desc    Get single blog post by ID or slug
// @route   GET /api/blogs/:identifier
// @access  Public
const getBlogByIdentifier = async (req, res) => {
    try {
        const { identifier } = req.params;
        
        // Check if identifier is MongoDB ID or slug
        const query = identifier.match(/^[0-9a-fA-F]{24}$/) 
            ? { _id: identifier } 
            : { slug: identifier, status: 'published' };

        const blog = await Blog.findOne(query);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found'
            });
        }
       
        // Increment view count
        blog.views += 1;
        await blog.save();

        res.status(200).json({
            success: true,
            data: blog
        });
    } catch (error) {
        console.error('Get blog error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching blog'
        });
    }
};

// @desc    Update blog post
// @route   PUT /api/blogs/:id
// @access  Public (add authentication as needed)
const updateBlog = async (req, res) => {
    try {
        const { id } = req.params;

        // Find existing blog
        const existingBlog = await Blog.findById(id);
        if (!existingBlog) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found'
            });
        }

        // Parse blog data
        let blogData;
        try {
            blogData = req.body.blogData ? JSON.parse(req.body.blogData) : req.body;
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid blog data format'
            });
        }

        // Handle image update
        if (req.file) {
            // Delete old image from Cloudinary
            if (existingBlog.image?.publicId) {
                await deleteFromCloudinary(existingBlog.image.publicId);
            }
            
            // Upload new image
            const imageData = await uploadOnCloudinary(req.file.path);
            if (imageData) {
                blogData.image = {
                    url: imageData.url,
                    publicId: imageData.publicId
                };
            }
        }

        // Check if title changed and update slug
        if (blogData.title && blogData.title !== existingBlog.title) {
            const newSlug = generateSlug(blogData.title);
            
            // Check if new slug already exists (excluding current blog)
            const slugExists = await Blog.findOne({ 
                slug: newSlug, 
                _id: { $ne: id } 
            });
            
            if (slugExists) {
                return res.status(400).json({
                    success: false,
                    message: 'A blog with this title already exists'
                });
            }
            
            blogData.slug = newSlug;
            blogData.id = newSlug;
        }

        // Format date if provided
        if (blogData.date && typeof blogData.date === 'string') {
            const date = new Date(blogData.date);
            blogData.date = date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }).replace(/ /g, ' ');
        }

        // Update blog
        const updatedBlog = await Blog.findByIdAndUpdate(
            id,
            { ...blogData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedBlog,
            message: 'Blog post updated successfully'
        });

    } catch (error) {
        console.error('Update blog error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while updating blog'
        });
    }
};

// @desc    Delete blog post
// @route   DELETE /api/blogs/:id
// @access  Public (add authentication as needed)
const deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;

        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found'
            });
        }

        // Delete image from Cloudinary
        if (blog.image?.publicId) {
            await deleteFromCloudinary(blog.image.publicId);
        }

        await Blog.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Blog post deleted successfully'
        });
    } catch (error) {
        console.error('Delete blog error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting blog'
        });
    }
};

// @desc    Get blogs by category
// @route   GET /api/blogs/category/:category
// @access  Public
const getBlogsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { limit = 10 } = req.query;

        const blogs = await Blog.find({ category, status: 'published' })
            .select('-__v')
            .sort('-publishedAt')
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            data: blogs,
            count: blogs.length
        });
    } catch (error) {
        console.error('Get blogs by category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching blogs'
        });
    }
};

// @desc    Get related blogs
// @route   GET /api/blogs/:id/related
// @access  Public
const getRelatedBlogs = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 3 } = req.query;

        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found'
            });
        }

        // Find blogs with same category, excluding current blog
        const relatedBlogs = await Blog.find({
            category: blog.category,
            status: 'published',
            _id: { $ne: id }
        })
            .select('-__v')
            .sort('-publishedAt')
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            data: relatedBlogs
        });
    } catch (error) {
        console.error('Get related blogs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching related blogs'
        });
    }
};

// @desc    Get blog stats
// @route   GET /api/blogs/stats
// @access  Public
const getBlogStats = async (req, res) => {
    try {
        const totalBlogs = await Blog.countDocuments({ status: 'published' });
        const totalViews = await Blog.aggregate([
            { $match: { status: 'published' } },
            { $group: { _id: null, total: { $sum: '$views' } } }
        ]);
        
        const categories = await Blog.aggregate([
            { $match: { status: 'published' } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalBlogs,
                totalViews: totalViews[0]?.total || 0,
                categories
            }
        });
    } catch (error) {
        console.error('Get blog stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching stats'
        });
    }
};

export {
    createBlog,
    getAllBlogs,
    getBlogByIdentifier,
    updateBlog,
    deleteBlog,
    getBlogsByCategory,
    getRelatedBlogs,
    getBlogStats
};