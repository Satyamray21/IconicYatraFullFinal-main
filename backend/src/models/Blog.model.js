import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    desc: {
        type: String,
        required: true
    }
});

const travelGuideSchema = new mongoose.Schema({
    bestTime: {
        type: String,
        required: true
    },
    travelTips: [{
        type: String,
        required: true
    }],
    whyChoose: {
        type: String,
        required: true
    },
    services: [{
        type: String,
        required: true
    }],
    safetyTips: [{
        type: String,
        required: true
    }],
    finalNote: {
        type: String,
        required: true
    }
});

const contentSchema = new mongoose.Schema({
    introduction: {
        type: String,
        required: true,
        minlength: 50
    },
    topPlaces: [placeSchema],
    bestTimeToVisit: {
        type: String,
        required: false
    },
    travelTips: [{
        type: String,
        required: false
    }],
    cuisine: {
        type: String,
        required: true
    },
    conclusion: {
        type: String,
        required: true
    },
    travelGuide: travelGuideSchema
});

const blogSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        sparse: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Domestic', 'International']
    },

    // ✅ SUB CATEGORY (NEW)
    subCategory: {
        type: String,
        
        enum: [
            'Hill Stations',
            'Beach Destinations',
            'Cultural Tours',
            'Adventure Travel',
            'Honeymoon Packages',
            'Family Tours',
            'Luxury Travel',
            'Wildlife Safari',
            'Religious Tours'
        ]
    },
    title: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    date: {
        type: String,
        required: true
    },
    readTime: {
        type: String,
        required: true
    },
    excerpt: {
        type: String,
        required: true,
        minlength: 20
    },
    image: {
        url: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        }
    },
    content: contentSchema,
    publishedAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published'
    },
    views: {
        type: Number,
        default: 0
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for search functionality
blogSchema.index({ title: 'text', 'content.introduction': 'text' });
blogSchema.index({ slug: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ status: 1, publishedAt: -1 });

// Generate slug and id before saving
blogSchema.pre('save', function(next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
        
        this.id = this.slug;
    }
    this.updatedAt = Date.now();
    next();
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;