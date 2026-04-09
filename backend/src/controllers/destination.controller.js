import DestinationMaster from "../models/DestinationMaster.js";
import Package from "../models/package.model.js";

// ✅ ADD DESTINATION
export const addDestination = async (req, res) => {
  try {
    const { tourType, sector, country, description } = req.body;

    const data = await DestinationMaster.create({
      tourType,
      sector: tourType === "Domestic" ? sector : "",
      country: tourType === "International" ? country : "",
      description
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

    // 1. All destinations
    const allDestinations = await DestinationMaster.find({ tourType });

    // 2. Used in packages
    const packages = await Package.find({ tourType });

    let usedList = [];

    if (tourType === "Domestic") {
      usedList = packages.map(p => p.sector?.toLowerCase().trim());
    } else {
      usedList = packages.map(p => p.destinationCountry?.toLowerCase().trim());
    }

    // 3. Available (NOT used)
    const available = allDestinations.filter(d => {
      if (tourType === "Domestic") {
        return !usedList.includes(d.sector?.toLowerCase().trim());
      } else {
        return !usedList.includes(d.country?.toLowerCase().trim());
      }
    });

    // 4. Used list (for UI if needed)
    const used = allDestinations.filter(d => {
      if (tourType === "Domestic") {
        return usedList.includes(d.sector?.toLowerCase().trim());
      } else {
        return usedList.includes(d.country?.toLowerCase().trim());
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
