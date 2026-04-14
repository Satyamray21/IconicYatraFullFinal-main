import DestinationMaster from "../models/DestinationMaster.js";
import Package from "../models/package.model.js";

// ✅ ADD DESTINATION
export const addDestination = async (req, res) => {
  try {
    const { tourType, sector, country, description, tourTypeDescription } = req.body;

    const data = await DestinationMaster.create({
      tourType,
      sector: tourType === "Domestic" ? sector : "",
      country: tourType === "International" ? country : "",
      description,
      tourTypeDescription: tourTypeDescription || ""
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ GET ALL DESTINATIONS
export const getDestinations = async (req, res) => {
  try {
    const { tourType, sector, country } = req.query;

    const filter = {};
    if (tourType) filter.tourType = tourType;
    if (tourType === "Domestic" && sector) {
      filter.sector = new RegExp(`^${sector.trim()}$`, "i");
    }
    if (tourType === "International" && country) {
      filter.country = new RegExp(`^${country.trim()}$`, "i");
    }

    const data = await DestinationMaster.find(filter);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ 🔥 MAIN API (IMPORTANT)
export const getAvailableDestinations = async (req, res) => {
  try {
    const { tourType } = req.query;
    if (!["Domestic", "International"].includes(tourType)) {
      return res.status(400).json({ message: "tourType is required" });
    }

    // 1) Package values currently in use
    const packages = await Package.find({ tourType });
    const packageValuesRaw =
      tourType === "Domestic"
        ? packages.map((p) => p.sector)
        : packages.map((p) => p.destinationCountry);
    const packageValues = Array.from(
      new Set(
        packageValuesRaw
          .map((v) => String(v || "").trim())
          .filter(Boolean),
      ),
    );

    // 2) Ensure every used package value exists in DestinationMaster (auto-sync)
    const allDestinationsBefore = await DestinationMaster.find({ tourType });
    const existingKeys = new Set(
      allDestinationsBefore.map((d) =>
        String(
          tourType === "Domestic" ? d.sector : d.country,
        )
          .toLowerCase()
          .trim(),
      ),
    );

    const rowsToCreate = packageValues.filter(
      (name) => !existingKeys.has(name.toLowerCase()),
    );
    if (rowsToCreate.length) {
      await DestinationMaster.insertMany(
        rowsToCreate.map((name) =>
          tourType === "Domestic"
            ? {
                tourType: "Domestic",
                sector: name,
                country: "",
                description: "",
                tourTypeDescription: "",
              }
            : {
                tourType: "International",
                sector: "",
                country: name,
                description: "",
                tourTypeDescription: "",
              },
        ),
        { ordered: false },
      ).catch(() => {
        // Ignore duplicate races; final read below is source of truth.
      });
    }

    // 3) Re-read after sync
    const allDestinations = await DestinationMaster.find({ tourType });
    const usedList = new Set(
      packageValues.map((v) => v.toLowerCase().trim()),
    );

    // 4) Available (NOT used in packages)
    const available = allDestinations.filter(d => {
      if (tourType === "Domestic") {
        return !usedList.has(d.sector?.toLowerCase().trim());
      } else {
        return !usedList.has(d.country?.toLowerCase().trim());
      }
    });

    // 5) Used list
    const used = allDestinations.filter(d => {
      if (tourType === "Domestic") {
        return usedList.has(d.sector?.toLowerCase().trim());
      } else {
        return usedList.has(d.country?.toLowerCase().trim());
      }
    });

    res.json({
      available,
      used
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const syncDestinationsFromPackages = async (req, res) => {
  try {
    // 1. Get all packages
    const packages = await Package.find();

    let created = 0;

    for (const pkg of packages) {
      if (pkg.tourType === "Domestic" && pkg.sector) {
        const exists = await DestinationMaster.findOne({
          tourType: "Domestic",
          sector: pkg.sector
        });

        if (!exists) {
          await DestinationMaster.create({
            tourType: "Domestic",
            sector: pkg.sector,
            description: "" // empty for now
          });
          created++;
        }
      }

      if (pkg.tourType === "International" && pkg.destinationCountry) {
        const exists = await DestinationMaster.findOne({
          tourType: "International",
          country: pkg.destinationCountry
        });

        if (!exists) {
          await DestinationMaster.create({
            tourType: "International",
            country: pkg.destinationCountry,
            description: ""
          });
          created++;
        }
      }
    }

    res.json({
      message: "Sync completed",
      added: created
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateDescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const updated = await DestinationMaster.findByIdAndUpdate(
      id,
      { description },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(updated);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const upsertTourTypeDescription = async (req, res) => {
  try {
    const { tourType, tourTypeDescription } = req.body;

    if (!["Domestic", "International"].includes(tourType)) {
      return res.status(400).json({ message: "Invalid tourType" });
    }

    const filter =
      tourType === "Domestic"
        ? { tourType, sector: { $in: ["", null] } }
        : { tourType, country: { $in: ["", null] } };

    const update =
      tourType === "Domestic"
        ? { tourType, sector: "", country: "", tourTypeDescription: tourTypeDescription || "" }
        : { tourType, sector: "", country: "", tourTypeDescription: tourTypeDescription || "" };

    const updated = await DestinationMaster.findOneAndUpdate(
      filter,
      update,
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
