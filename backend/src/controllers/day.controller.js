import Day from "../models/day.model.js";

// Create Day
export const createDay = async (req, res) => {
    try {
        const newDay = new Day(req.body);
        const savedDay = await newDay.save();
        res.status(201).json(savedDay);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Days
export const getAllDays = async (req, res) => {
    try {
        const days = await Day.find();
        res.status(200).json(days);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Single Day
export const getDayById = async (req, res) => {
    try {
        const day = await Day.findById(req.params.id);
        if (!day) return res.status(404).json({ message: "Day not found" });
        res.status(200).json(day);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Day
export const updateDay = async (req, res) => {
    try {
        const updatedDay = await Day.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!updatedDay) return res.status(404).json({ message: "Day not found" });
        res.status(200).json(updatedDay);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete Day
export const deleteDay = async (req, res) => {
    try {
        const deletedDay = await Day.findByIdAndDelete(req.params.id);
        if (!deletedDay) return res.status(404).json({ message: "Day not found" });
        res.status(200).json({ message: "Day deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
