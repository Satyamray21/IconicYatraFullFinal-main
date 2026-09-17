import axios from "axios";

export const fetchPhoto = async (req, res, next) => {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      return res.status(500).json({
        success: false,
        message: "UNSPLASH_ACCESS_KEY is missing in environment variables.",
      });
    }

    const { query, page = 1, per_page = 20, all = "false" } = req.query;
    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required (e.g., ?query=Gangtok).",
      });
    }

    const cleanQuery = query.trim();
    const isPickerMode = all === "true" || all === true;
    const requestedPage = Math.max(1, parseInt(page) || 1);
    const requestedPerPage = Math.min(30, Math.max(5, parseInt(per_page) || 20));

    const fetchFromUnsplash = async (searchQuery, targetPage = 1) => {
      return await axios.get("https://api.unsplash.com/search/photos", {
        params: {
          query: searchQuery,
          per_page: requestedPerPage,
          page: targetPage,
          orientation: "landscape",
        },
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      });
    };

    // In picker mode, pass the actual page to Unsplash for genuine pagination
    const unsplashPage = isPickerMode ? requestedPage : 1;
    let response = await fetchFromUnsplash(cleanQuery, unsplashPage);

    // Fallback 1: If query includes " landmark architecture" and had no results, strip it
    if ((!response.data.results || response.data.results.length === 0) && cleanQuery.includes(" landmark architecture")) {
      const fallbackQuery = cleanQuery.replace(" landmark architecture", "").trim();
      response = await fetchFromUnsplash(fallbackQuery, unsplashPage);
    }

    // Fallback 2: If still 0 results and query has multiple words (e.g. specific temple or point + city), try first 2 words
    if ((!response.data.results || response.data.results.length === 0) && cleanQuery.split(" ").length > 2) {
      const fallbackQuery = cleanQuery.split(" ").slice(0, 2).join(" ");
      response = await fetchFromUnsplash(fallbackQuery, unsplashPage);
    }

    if (response.data.results && response.data.results.length > 0) {
      const photos = response.data.results.map((item) => ({
        id: item.id,
        url: item.urls?.regular || item.urls?.full,
        small: item.urls?.small || item.urls?.regular,
        thumb: item.urls?.thumb || item.urls?.small,
        alt: item.alt_description || item.description || cleanQuery,
        photographer: item.user?.name || "Unsplash Contributor",
      }));

      // For single-url auto-fetch backwards compatibility:
      // If NOT in picker mode, use the page as an offset index so consecutive days get distinct images
      const resultIndex = isPickerMode ? 0 : (requestedPage - 1) % photos.length;
      const photoUrl = photos[resultIndex]?.url || photos[0]?.url;

      return res.status(200).json({
        success: true,
        data: photoUrl,
        photos,
        total: response.data.total || photos.length,
        totalPages: response.data.total_pages || 1,
        page: unsplashPage,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: `No photos found for "${cleanQuery}". Try another sightseeing spot or city name.`,
      });
    }
  } catch (error) {
    console.error("Photo Fetch Error:", error?.response?.data || error.message);
    next(error);
  }
};
