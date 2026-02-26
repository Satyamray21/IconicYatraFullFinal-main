import React, { useState, useRef, useEffect } from "react";
import {
    Paper, Typography, Box, IconButton, Button,
    ImageList, ImageListItem, ImageListItemBar,
    Chip, Stack, Dialog, DialogContent
} from "@mui/material";
import {
    AddPhotoAlternate,
    Delete,
    CheckCircle,
    Cancel,
    Visibility
} from "@mui/icons-material";

import { useDispatch, useSelector } from "react-redux";
import {
    uploadGallery,
    fetchGallery,
    deleteGalleryImage
} from "../../../../features/gallery/gallerySlice";

import { toast } from "react-toastify";

const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;   // 5MB per file

const GalleryUpload = () => {

    const dispatch = useDispatch();
    const { images, loading } = useSelector((state) => state.gallery);

    const fileInputRef = useRef(null);

    const [selectedImages, setSelectedImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [uploading, setUploading] = useState(false);

    const [openPreview, setOpenPreview] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");

    const [openViewAll, setOpenViewAll] = useState(false);

    // ================================
    // Fetch existing images
    // ================================
    useEffect(() => {
        dispatch(fetchGallery());
    }, [dispatch]);

    // ================================
    // Image Selection
    // ================================
    const handleImageSelect = (event) => {

        const files = Array.from(event.target.files);

        let totalSize = selectedImages.reduce((acc, file) => acc + file.size, 0);
        const validFiles = [];

        for (let file of files) {

            if (!file.type.startsWith("image/")) {
                toast.error(`${file.name} is not an image file`);
                continue;
            }

            if (file.size > MAX_FILE_SIZE) {
                toast.error(`${file.name} exceeds 5MB limit`);
                continue;
            }

            if (totalSize + file.size > MAX_TOTAL_SIZE) {
                toast.error("Total upload limit is 50MB");
                break;
            }

            totalSize += file.size;
            validFiles.push(file);
        }

        if (validFiles.length > 0) {

            const newPreviews = validFiles.map(file => ({
                file,
                preview: URL.createObjectURL(file),
                id: Math.random().toString(36).substr(2, 9)
            }));

            setSelectedImages(prev => [...prev, ...validFiles]);
            setPreviewImages(prev => [...prev, ...newPreviews]);
        }
    };

    // ================================
    // Remove Selected Preview
    // ================================
    const handleRemoveImage = (imageId) => {

        setPreviewImages(prev => {
            const removed = prev.find(img => img.id === imageId);
            if (removed) URL.revokeObjectURL(removed.preview);
            return prev.filter(img => img.id !== imageId);
        });

        setSelectedImages((prev, index) =>
            prev.filter((_, i) => i !== index)
        );
    };

    const handleClearAll = () => {
        previewImages.forEach(img => URL.revokeObjectURL(img.preview));
        setSelectedImages([]);
        setPreviewImages([]);
    };

    // ================================
    // Upload
    // ================================
    const handleUpload = async () => {

        if (selectedImages.length === 0) {
            toast.error("Please select at least one image");
            return;
        }

        setUploading(true);

        try {

            const fd = new FormData();
            selectedImages.forEach(img => fd.append("gallery", img));

            await dispatch(uploadGallery(fd)).unwrap();

            toast.success("Images uploaded successfully");

            handleClearAll();

        } catch (err) {
            toast.error(err || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    // ================================
    // Delete Existing Image
    // ================================
    const handleDeleteExisting = async (id) => {

        if (!window.confirm("Delete this image?")) return;

        try {
            await dispatch(deleteGalleryImage(id)).unwrap();
            toast.success("Image deleted successfully");
        } catch (err) {
            toast.error(err || "Delete failed");
        }
    };

    const handleViewImage = (url) => {
        setPreviewUrl(url);
        setOpenPreview(true);
    };

    const handleBrowseClick = () => {
        fileInputRef.current.click();
    };

    return (
        <Paper sx={{ p: 3 }}>

            <Typography variant="h4" gutterBottom>
                Gallery Upload
            </Typography>

            {/* Upload Box */}
            <Box
                sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    bgcolor: '#fafafa',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#f5f5f5' }
                }}
                onClick={handleBrowseClick}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                />

                <AddPhotoAlternate sx={{ fontSize: 48, color: 'text.secondary' }} />
                <Typography variant="h6">
                    Click to select images
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Max 5MB per image, 50MB total
                </Typography>
            </Box>

            {/* Selected Preview */}
            {selectedImages.length > 0 && (
                <Box sx={{ mt: 2 }}>

                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Chip
                            label={`${selectedImages.length} image(s) selected`}
                            color="primary"
                            variant="outlined"
                        />
                        <Button
                            size="small"
                            color="error"
                            startIcon={<Delete />}
                            onClick={handleClearAll}
                        >
                            Clear All
                        </Button>
                    </Stack>

                    <ImageList cols={3} gap={8}>
                        {previewImages.map((image) => (
                            <ImageListItem key={image.id}>
                                <img
                                    src={image.preview}
                                    alt="Preview"
                                    style={{
                                        height: 150,
                                        objectFit: "cover",
                                        borderRadius: 4
                                    }}
                                />
                                <ImageListItemBar
                                    position="top"
                                    actionIcon={
                                        <IconButton
                                            sx={{ color: "white" }}
                                            onClick={() => handleRemoveImage(image.id)}
                                        >
                                            <Cancel />
                                        </IconButton>
                                    }
                                    sx={{ bgcolor: "transparent" }}
                                />
                            </ImageListItem>
                        ))}
                    </ImageList>

                    <Box sx={{ mt: 2, textAlign: "right" }}>
                        <Button
                            variant="contained"
                            startIcon={<CheckCircle />}
                            onClick={handleUpload}
                            disabled={uploading}
                        >
                            {uploading ? "Uploading..." : "Upload Images"}
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Existing Uploaded Images */}
            <Box sx={{ mt: 4 }}>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h5">
                        Uploaded Images
                    </Typography>

                    {images.length > 0 && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setOpenViewAll(true)}
                        >
                            View All
                        </Button>
                    )}
                </Box>

                {loading && <Typography>Loading...</Typography>}

                {!loading && images.length === 0 && (
                    <Typography color="text.secondary">
                        No images uploaded yet
                    </Typography>
                )}

                <ImageList cols={3} gap={8}>
                    {images.slice(0, 6).map((image) => (
                        <ImageListItem key={image._id}>
                            <img
                                src={image.url}
                                alt="Gallery"
                                style={{
                                    height: 180,
                                    objectFit: "cover",
                                    borderRadius: 4,
                                    cursor: "pointer"
                                }}
                                onClick={() => handleViewImage(image.url)}
                            />
                            <ImageListItemBar
                                position="top"
                                actionIcon={
                                    <>
                                        <IconButton
                                            sx={{ color: "white" }}
                                            onClick={() => handleViewImage(image.url)}
                                        >
                                            <Visibility />
                                        </IconButton>

                                        <IconButton
                                            sx={{ color: "white" }}
                                            onClick={() => handleDeleteExisting(image._id)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </>
                                }
                                sx={{ bgcolor: "rgba(0,0,0,0.5)" }}
                            />
                        </ImageListItem>
                    ))}
                </ImageList>
            </Box>

            {/* Single Image Preview */}
            <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md">
                <DialogContent>
                    <img
                        src={previewUrl}
                        alt="Preview"
                        style={{ width: "100%", borderRadius: 8 }}
                    />
                </DialogContent>
            </Dialog>

            {/* View All Modal */}
            <Dialog
                open={openViewAll}
                onClose={() => setOpenViewAll(false)}
                fullWidth
                maxWidth="lg"
            >
                <DialogContent>
                    <ImageList cols={4} gap={12}>
                        {images.map((image) => (
                            <ImageListItem key={image._id}>
                                <img
                                    src={image.url}
                                    alt="Gallery"
                                    style={{
                                        height: 200,
                                        objectFit: "cover",
                                        borderRadius: 6
                                    }}
                                />
                                <ImageListItemBar
                                    position="top"
                                    actionIcon={
                                        <IconButton
                                            sx={{ color: "white" }}
                                            onClick={() => handleDeleteExisting(image._id)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    }
                                    sx={{ bgcolor: "rgba(0,0,0,0.5)" }}
                                />
                            </ImageListItem>
                        ))}
                    </ImageList>
                </DialogContent>
            </Dialog>

        </Paper>
    );
};

export default GalleryUpload;
