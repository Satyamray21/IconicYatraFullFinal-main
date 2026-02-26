import { LeadOptions } from "../models/leadOptions.model.js";

// DELETE Lead Option
export const deleteLeadOption = async (req, res) => {
    try {
        const { id } = req.params;

        const leadOption = await LeadOptions.findById(id);
        if (!leadOption) {
            return res.status(404).json({ message: "Lead Option not found" });
        }

        await leadOption.deleteOne();

        res.status(200).json({ message: "Lead Option deleted successfully" });
    } catch (error) {
        console.error("Error deleting Lead Option:", error);
        res.status(500).json({ message: "Server Error" });
    }
};