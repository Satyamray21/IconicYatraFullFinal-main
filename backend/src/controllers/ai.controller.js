import { GoogleGenAI } from "@google/genai";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getModelCandidates = () => [
  ...new Set(
    [
      process.env.GEMINI_MODEL,
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
    ].filter(Boolean)
  ),
];

const isRetryableStatus = (status) =>
  status === 429 || status === 503 || status === 404 || status === 400;

const extractText = (response) => {
  if (!response) return "";
  if (typeof response.text === "string") return response.text;
  if (typeof response.text === "function") return response.text();
  if (typeof response.output_text === "string") return response.output_text;
  return "";
};

const generateItineraryText = async (client, prompt) => {
  let lastError;

  for (const model of getModelCandidates()) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
        });
        const text = extractText(response);
        if (text?.trim()) return text;
      } catch (error) {
        lastError = error;
        const status = Number(error?.status);
        if (!isRetryableStatus(status) || attempt === 3) break;
        await sleep(700 * attempt);
      }
    }
  }

  try {
    const interaction = await client.interactions.create(
      {
        agent: "antigravity-preview-05-2026",
        input: prompt,
        agent_config: {
          type: "antigravity",
          model: "gemini-3.6-flash",
        },
      },
      { timeout: 180000 }
    );
    const text = extractText(interaction);
    if (text?.trim()) return text;
  } catch (error) {
    lastError = error;
  }

  throw lastError || new Error("Antigravity/Gemini returned an empty response.");
};

const parseItineraryJson = (text) => {
  let jsonText = String(text || "").trim();
  if (jsonText.startsWith("```json")) jsonText = jsonText.substring(7);
  if (jsonText.startsWith("```")) jsonText = jsonText.substring(3);
  if (jsonText.endsWith("```")) jsonText = jsonText.substring(0, jsonText.length - 3);
  jsonText = jsonText.trim();

  try {
    return JSON.parse(jsonText);
  } catch {
    const match = jsonText.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("AI did not return valid itinerary JSON.");
    return JSON.parse(match[0]);
  }
};

export const generateItinerary = async (req, res, next) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_key_here") {
      return res.status(500).json({
        success: false,
        message: "GEMINI_API_KEY is missing or invalid in environment variables.",
      });
    }

    const {
      arrivalCity,
      departureCity,
      destinationCountry,
      sector,
      days,
      tourType,
      stayLocations,
    } = req.body;

    const parsedDays = Number(days);
    if (!parsedDays || parsedDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "Number of days is required and must be greater than 0.",
      });
    }

    const client = new GoogleGenAI({ apiKey });

    const locationParts = [];
    if (sector) locationParts.push(sector);
    if (destinationCountry) locationParts.push(destinationCountry);
    const location =
      locationParts.length > 0 ? locationParts.join(", ") : "the destination";

    let stayInfo = "";
    if (stayLocations && Array.isArray(stayLocations) && stayLocations.length > 0) {
      stayInfo = `\n\nSTRICT ITINERARY STRUCTURE REQUIRED:
      - Day 1: Arrival at ${arrivalCity || "the starting city"} and transfer to ${stayLocations[0].city}.
      - The tour has ${parsedDays} total days and ${parsedDays - 1} nights.
      - The overnight stays are strictly: ${stayLocations.map((sl) => `${sl.nights} nights in ${sl.city}`).join(", ")}.
      - You must map out exactly what happens each day to match this overnight schedule. If transferring between cities, mention it on the correct day.
      - Day ${parsedDays}: Check out from the last location and departure from ${departureCity || arrivalCity || "the departure city"}.`;
    }

    const prompt = `
      You are an expert travel agent. Generate a detailed, day-by-day travel itinerary for a ${tourType || "Domestic"} tour exploring ${location} for exactly ${parsedDays} days.${stayInfo}
      
      Respond ONLY with a valid JSON array of objects. Each object should represent a day in the itinerary and must have exactly these keys:
      - "title": A short, catchy title for the day (e.g., "Arrival in Paris & City Tour").
      - "notes": A detailed description of the day's activities (around 3-4 sentences).
      - "aboutCity": A brief description (1-2 sentences) about the city or region being visited on this day.
      - "sightseeing": An array of strings, where each string is a notable attraction or sightseeing spot visited on this day.
      
      Do not include any markdown formatting, backticks, or extra text outside the JSON array. Output pure JSON only.
    `;

    const text = await generateItineraryText(client, prompt);
    let parsedDaysArray = parseItineraryJson(text);

    if (!Array.isArray(parsedDaysArray)) {
      throw new Error("AI did not return an itinerary array.");
    }

    if (parsedDaysArray.length < parsedDays) {
      for (let i = parsedDaysArray.length; i < parsedDays; i++) {
        parsedDaysArray.push({
          title: `Day ${i + 1}`,
          notes: "",
          aboutCity: "",
          sightseeing: [],
        });
      }
    } else if (parsedDaysArray.length > parsedDays) {
      parsedDaysArray = parsedDaysArray.slice(0, parsedDays);
    }

    res.status(200).json({ success: true, data: parsedDaysArray });
  } catch (error) {
    console.error("AI Generation Error:", error);
    const status = Number(error?.status);
    if (status === 503 || status === 429) {
      return res.status(503).json({
        success: false,
        message:
          "Google AI is busy right now. Please try Generate Itinerary again in a minute.",
      });
    }
    if (status === 401 || status === 403) {
      return res.status(403).json({
        success: false,
        message:
          "This Gemini API key cannot use Antigravity/Gemini 3 models. Create a key at https://aistudio.google.com/apikey and replace GEMINI_API_KEY.",
      });
    }
    next(error);
  }
};
