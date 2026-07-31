import { LeadOptions } from "../models/leadOptions.model.js";
import { deleteCache } from "../utils/cache.js";

// DELETE Lead Option
export const deleteLeadOption = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyId;

        const leadOption = await LeadOptions.findOne({ _id: id, companyId });
        if (!leadOption) {
            return res.status(404).json({ message: "Lead Option not found" });
        }

        await leadOption.deleteOne();
        await deleteCache(`leads:options:${companyId}`);

        res.status(200).json({ message: "Lead Option deleted successfully" });
    } catch (error) {
        console.error("Error deleting Lead Option:", error);
        res.status(500).json({ message: "Server Error" });
    }
};