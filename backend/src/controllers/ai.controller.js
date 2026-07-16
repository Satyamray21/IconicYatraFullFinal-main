import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateItinerary = async (req, res, next) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_key_here") {
      return res.status(500).json({ success: false, message: "GEMINI_API_KEY is missing or invalid in environment variables." });
    }

    const { arrivalCity, departureCity, destinationCountry, sector, days, tourType, stayLocations } = req.body;
    
    const parsedDays = Number(days);
    if (!parsedDays || parsedDays <= 0) {
      return res.status(400).json({ success: false, message: "Number of days is required and must be greater than 0." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Build a precise location string
    let locationParts = [];
    if (sector) locationParts.push(sector);
    if (destinationCountry) locationParts.push(destinationCountry);
    const location = locationParts.length > 0 ? locationParts.join(", ") : "the destination";
    
    let stayInfo = "";
    if (stayLocations && Array.isArray(stayLocations) && stayLocations.length > 0) {
      stayInfo = `\n\nSTRICT ITINERARY STRUCTURE REQUIRED:
      - Day 1: Arrival at ${arrivalCity || 'the starting city'} and transfer to ${stayLocations[0].city}.
      - The tour has ${parsedDays} total days and ${parsedDays - 1} nights.
      - The overnight stays are strictly: ${stayLocations.map(sl => `${sl.nights} nights in ${sl.city}`).join(", ")}.
      - You must map out exactly what happens each day to match this overnight schedule. If transferring between cities, mention it on the correct day.
      - Day ${parsedDays}: Check out from the last location and departure from ${departureCity || arrivalCity || 'the departure city'}.`;
    }

    const prompt = `
      You are an expert travel agent. Generate a detailed, day-by-day travel itinerary for a ${tourType || 'Domestic'} tour exploring ${location} for exactly ${parsedDays} days.${stayInfo}
      
      Respond ONLY with a valid JSON array of objects. Each object should represent a day in the itinerary and must have exactly these keys:
      - "title": A short, catchy title for the day (e.g., "Arrival in Paris & City Tour").
      - "notes": A detailed description of the day's activities (around 3-4 sentences).
      - "aboutCity": A brief description (1-2 sentences) about the city or region being visited on this day.
      - "sightseeing": An array of strings, where each string is a notable attraction or sightseeing spot visited on this day.
      
      Do not include any markdown formatting, backticks, or extra text outside the JSON array. Output pure JSON only.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown formatting (```json ... ```)
    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.substring(7);
    }
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.substring(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.substring(0, jsonText.length - 3);
    }
    jsonText = jsonText.trim();
    
    let parsedDaysArray = JSON.parse(jsonText);

    // If parsing successful, ensure we match exactly the requested number of days
    if (parsedDaysArray.length < parsedDays) {
       for (let i = parsedDaysArray.length; i < parsedDays; i++) {
         parsedDaysArray.push({ title: `Day ${i + 1}`, notes: "", aboutCity: "", sightseeing: [] });
       }
    } else if (parsedDaysArray.length > parsedDays) {
       parsedDaysArray = parsedDaysArray.slice(0, parsedDays);
    }

    res.status(200).json({ success: true, data: parsedDaysArray });
  } catch (error) {
    console.error("AI Generation Error:", error);
    next(error);
  }
};
