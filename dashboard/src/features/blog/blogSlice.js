import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios.js";

// Create a new blog post
export const createBlog = createAsyncThunk(
    "blog/createBlog",
    async (formData, thunkApi) => {
        try {
            const res = await axios.post('/blogs', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return res.data;
        } catch (err) {
            return thunkApi.rejectWithValue(err?.response?.data?.message || err.message);
        }
    }
);

// Get all blog posts with filters
export const getAllBlogs = createAsyncThunk(
    "blog/getAllBlogs",
    async (params = {}, thunkApi) => {
        try {
            const { page = 1, limit = 10, category, search, sort = '-publishedAt' } = params;
            const queryParams = new URLSearchParams({
                page,
                limit,
                ...(category && { category }),
                ...(search && { search }),
                sort
            });
            
            const res = await axios.get(`/blogs?${queryParams}`);
            return res.data;
        } catch (err) {
            return thunkApi.rejectWithValue(err?.response?.data?.message);
        }
    }
);

// Get blog by ID or slug
export const getBlogByIdentifier = createAsyncThunk(
    "blog/getBlogByIdentifier",
    async (identifier, thunkApi) => {
        try {
            const res = await axios.get(`/blogs/${identifier}`);
            return res.data;
        } catch (err) {
            return thunkApi.rejectWithValue(err?.response?.data?.message);
        }
    }
);

// Update blog post
export const updateBlog = createAsyncThunk(
    "blog/updateBlog",
    async ({ id, formData }, thunkApi) => {
        try {
            const res = await axios.put(`/blogs/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return res.data;
        } catch (err) {
            return thunkApi.rejectWithValue(err?.response?.data?.message);
        }
    }
);

// Delete blog post
export const deleteBlog = createAsyncThunk(
    "blog/deleteBlog",
    async (id, thunkApi) => {
        try {
            const res = await axios.delete(`/blogs/${id}`);
            return { id, message: res.data.message };
        } catch (err) {
            return thunkApi.rejectWithValue(err?.response?.data?.message);
        }
    }
);

// Get blogs by category
export const getBlogsByCategory = createAsyncThunk(
    "blog/getBlogsByCategory",
    async ({ category, limit = 10 }, thunkApi) => {
        try {
            const res = await axios.get(`/blogs/category/${category}?limit=${limit}`);
            return res.data;
        } catch (err) {
            return thunkApi.rejectWithValue(err?.response?.data?.message);
        }
    }
);

// Get related blogs
export const getRelatedBlogs = createAsyncThunk(
    "blog/getRelatedBlogs",
    async ({ id, limit = 3 }, thunkApi) => {
        try {
            const res = await axios.get(`/blogs/${id}/related?limit=${limit}`);
            return res.data;
        } catch (err) {
            return thunkApi.rejectWithValue(err?.response?.data?.message);
        }
    }
);

// Get blog statistics
export const getBlogStats = createAsyncThunk(
    "blog/getBlogStats",
    async (_, thunkApi) => {
        try {
            const res = await axios.get('/blogs/stats');
            return res.data;
        } catch (err) {
            return thunkApi.rejectWithValue(err?.response?.data?.message);
        }
    }
);

const initialState = {
    list: [],
    currentBlog: null,
    relatedBlogs: [],
    stats: null,
    form: {
        id: '',
        slug: '',
        category: '',
        subCategory:'',
        title: '',
        date: null,
        readTime: '',
        excerpt: '',
        image: null,
        content: {
            introduction: '',
            topPlaces: [],
            bestTimeToVisit: '',
            travelTips: [],
            cuisine: '',
            conclusion: '',
            travelGuide: {
                bestTime: '',
                travelTips: [],
                whyChoose: '',
                services: [],
                safetyTips: [],
                finalNote: ''
            }
        }
    },
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
    },
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    loading: false,
    filters: {
        category: '',
        search: '',
        sort: '-publishedAt'
    }
};

const blogSlice = createSlice({
    name: "blog",
    initialState,
    reducers: {
        // Set form field value
        setFormField: (state, action) => {
            const { field, value } = action.payload;
            
            // Handle nested fields (e.g., 'content.introduction')
            if (field.includes('.')) {
                const parts = field.split('.');
                if (parts.length === 2) {
                    const [parent, child] = parts;
                    state.form[parent][child] = value;
                } else if (parts.length === 3) {
                    const [parent, child, grandChild] = parts;
                    state.form[parent][child][grandChild] = value;
                }
            } else {
                state.form[field] = value;
            }
        },
        
        // Reset form to initial state
        resetForm: (state) => {
            state.form = initialState.form;
            state.error = null;
            state.status = 'idle';
        },
        
        // Set entire form data
        setFormData: (state, action) => {
            state.form = { ...state.form, ...action.payload };
        },
        
        // Clear current blog
        clearCurrentBlog: (state) => {
            state.currentBlog = null;
        },
        
        // Set filters
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        
        // Reset filters
        resetFilters: (state) => {
            state.filters = initialState.filters;
        },
        
        // Add place to topPlaces array
        addPlace: (state, action) => {
            state.form.content.topPlaces.push(action.payload);
        },
        
        // Remove place from topPlaces array
        removePlace: (state, action) => {
            state.form.content.topPlaces = state.form.content.topPlaces.filter(
                (_, index) => index !== action.payload
            );
        },
        
        // Add travel tip
        addTravelTip: (state, action) => {
            state.form.content.travelTips.push(action.payload);
        },
        
        // Remove travel tip
        removeTravelTip: (state, action) => {
            state.form.content.travelTips = state.form.content.travelTips.filter(
                (_, index) => index !== action.payload
            );
        },
        
        // Add guide travel tip
        addGuideTravelTip: (state, action) => {
            state.form.content.travelGuide.travelTips.push(action.payload);
        },
        
        // Remove guide travel tip
        removeGuideTravelTip: (state, action) => {
            state.form.content.travelGuide.travelTips = state.form.content.travelGuide.travelTips.filter(
                (_, index) => index !== action.payload
            );
        },
        
        // Add service
        addService: (state, action) => {
            state.form.content.travelGuide.services.push(action.payload);
        },
        
        // Remove service
        removeService: (state, action) => {
            state.form.content.travelGuide.services = state.form.content.travelGuide.services.filter(
                (_, index) => index !== action.payload
            );
        },
        
        // Add safety tip
        addSafetyTip: (state, action) => {
            state.form.content.travelGuide.safetyTips.push(action.payload);
        },
        
        // Remove safety tip
        removeSafetyTip: (state, action) => {
            state.form.content.travelGuide.safetyTips = state.form.content.travelGuide.safetyTips.filter(
                (_, index) => index !== action.payload
            );
        },
        
        // Set image preview
        setImagePreview: (state, action) => {
            state.form.image = action.payload;
        },
        
        // Clear image
        clearImage: (state) => {
            state.form.image = null;
        },
        
        // Set blog list
        setBlogList: (state, action) => {
            state.list = action.payload;
        },
        
        // Clear errors
        clearErrors: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Create Blog
            .addCase(createBlog.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(createBlog.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.list.unshift(action.payload.data);
                state.currentBlog = action.payload.data;
                state.error = null;
            })
            .addCase(createBlog.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            
            // Get All Blogs
            .addCase(getAllBlogs.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(getAllBlogs.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.list = action.payload.data;
                state.pagination = action.payload.pagination;
                state.error = null;
            })
            .addCase(getAllBlogs.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            
            // Get Blog by Identifier
            .addCase(getBlogByIdentifier.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getBlogByIdentifier.fulfilled, (state, action) => {
                state.loading = false;
                state.currentBlog = action.payload.data;
                // Populate form with blog data for editing
                if (action.payload.data) {
                    const blog = action.payload.data;
                    state.form = {
                        ...state.form,
                        id: blog.id,
                        slug: blog.slug,
                        category: blog.category,
                        subCategory: blog.subCategory,
                        title: blog.title,
                        date: blog.date,
                        readTime: blog.readTime,
                        excerpt: blog.excerpt,
                        content: blog.content
                    };
                }
                state.error = null;
            })
            .addCase(getBlogByIdentifier.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Update Blog
            .addCase(updateBlog.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(updateBlog.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const updatedBlog = action.payload.data;
                // Update in list
                const index = state.list.findIndex(blog => blog._id === updatedBlog._id);
                if (index !== -1) {
                    state.list[index] = updatedBlog;
                }
                state.currentBlog = updatedBlog;
                state.error = null;
            })
            .addCase(updateBlog.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            
            // Delete Blog
            .addCase(deleteBlog.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(deleteBlog.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.list = state.list.filter(blog => blog._id !== action.payload.id);
                if (state.currentBlog?._id === action.payload.id) {
                    state.currentBlog = null;
                }
                state.error = null;
            })
            .addCase(deleteBlog.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            
            // Get Blogs by Category
            .addCase(getBlogsByCategory.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(getBlogsByCategory.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.list = action.payload.data;
                state.error = null;
            })
            .addCase(getBlogsByCategory.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            
            // Get Related Blogs
            .addCase(getRelatedBlogs.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(getRelatedBlogs.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.relatedBlogs = action.payload.data;
                state.error = null;
            })
            .addCase(getRelatedBlogs.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            
            // Get Blog Stats
            .addCase(getBlogStats.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(getBlogStats.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.stats = action.payload.data;
                state.error = null;
            })
            .addCase(getBlogStats.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    }
});

// Export actions
export const {
    setFormField,
    resetForm,
    setFormData,
    clearCurrentBlog,
    setFilters,
    resetFilters,
    addPlace,
    removePlace,
    addTravelTip,
    removeTravelTip,
    addGuideTravelTip,
    removeGuideTravelTip,
    addService,
    removeService,
    addSafetyTip,
    removeSafetyTip,
    setImagePreview,
    clearImage,
    setBlogList,
    clearErrors
} = blogSlice.actions;

// Selectors
export const selectAllBlogs = (state) => state.blog.list;
export const selectCurrentBlog = (state) => state.blog.currentBlog;
export const selectRelatedBlogs = (state) => state.blog.relatedBlogs;
export const selectBlogStats = (state) => state.blog.stats;
export const selectBlogForm = (state) => state.blog.form;
export const selectBlogStatus = (state) => state.blog.status;
export const selectBlogError = (state) => state.blog.error;
export const selectBlogLoading = (state) => state.blog.loading;
export const selectBlogPagination = (state) => state.blog.pagination;
export const selectBlogFilters = (state) => state.blog.filters;

export default blogSlice.reducer;