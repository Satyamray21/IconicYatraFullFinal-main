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

    const { query, page = 1 } = req.query;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required (e.g., ?query=Gangtok).",
      });
    }

    const fetchFromUnsplash = async (searchQuery) => {
      return await axios.get("https://api.unsplash.com/search/photos", {
        params: {
          query: searchQuery,
          per_page: 15,
          page: 1, // Always fetch page 1 to get a pool of results
          orientation: "landscape",
        },
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      });
    };

    // Call Unsplash Search API
    let response = await fetchFromUnsplash(query);

    // Fallback if the highly specific query yields 0 results
    if ((!response.data.results || response.data.results.length === 0) && query.includes(" landmark architecture")) {
      const fallbackQuery = query.replace(" landmark architecture", "").trim();
      response = await fetchFromUnsplash(fallbackQuery);
    }

    if (response.data.results && response.data.results.length > 0) {
      // Use the requested page as an index, modulo the total results
      // This ensures we never hit a 404 due to deep pagination
      const resultIndex = (parseInt(page) - 1) % response.data.results.length;
      const photoUrl = response.data.results[resultIndex].urls.regular;
      return res.status(200).json({
        success: true,
        data: photoUrl,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No photos found for the given destination.",
      });
    }
  } catch (error) {
    console.error("Photo Fetch Error:", error?.response?.data || error.message);
    next(error);
  }
};
