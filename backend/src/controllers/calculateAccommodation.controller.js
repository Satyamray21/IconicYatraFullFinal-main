import { calculateAccommodation } from "../utils/calculateAccommondation.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const calculateAccommodationController = asyncHandler(async (req, res) => {
    try {
        // ✅ Get members & accommodation directly
        const { members = {}, accommodation = {} } = req.body;

        // ✅ Convert numeric fields safely
        const parsedMembers = {
            adults: Number(members.adults) || 0,
            children: Number(members.children) || 0,
            kidsWithoutMattress: Number(members.kidsWithoutMattress) || 0,
            infants: Number(members.infants) || 0,
        };

        const parsedAccommodation = {
            sharingType: accommodation.sharingType,
            noOfRooms: Number(accommodation.noOfRooms) || 0,
        };

        // ✅ Call calculation
        const result = calculateAccommodation(parsedMembers, parsedAccommodation);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error calculating accommodation",
            error: error.message,
        });
    }
});

