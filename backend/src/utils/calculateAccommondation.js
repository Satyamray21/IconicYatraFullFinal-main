
export const calculateAccommodation = (members, accommodation) => {
    const { adults, children, kidsWithoutMattress, infants } = members || {};
    const { sharingType, noOfRooms = 0 } = accommodation || {};
    const totalMembers =
        (adults || 0) +
        (children || 0) +
        (kidsWithoutMattress || 0) +
        (infants || 0);

    let capacityPerRoom = 1; // Default single sharing

    switch (sharingType?.toLowerCase()) {
        case "double sharing":
            capacityPerRoom = 2;
            break;
        case "triple sharing":
            capacityPerRoom = 3;
            break;
        case "family room":
            capacityPerRoom = 4;
            break;
        default:
            capacityPerRoom = 1;


    }

    // ✅ Maximum capacity based on given rooms
    const maxCapacity = noOfRooms * capacityPerRoom;

    // ✅ Automatically calculate required rooms if missing
    let requiredRooms = Math.ceil(totalMembers / capacityPerRoom);

    // ✅ Calculate extra mattress
    let extraMattress = 0;
    if (totalMembers > maxCapacity) {
        // If given rooms are insufficient → mattresses required
        extraMattress = totalMembers - maxCapacity;
        requiredRooms = noOfRooms || requiredRooms;
    }

    return {
        totalMembers,
        capacityPerRoom,
        requiredRooms,
        extraMattress,
        autoCalculatedRooms: noOfRooms === 0 ? requiredRooms : noOfRooms,
        isCapacitySufficient: totalMembers <= maxCapacity,
        message:
            totalMembers <= maxCapacity
                ? "Accommodation is sufficient."
                : `Not enough rooms. You need ${requiredRooms} rooms and ${extraMattress} extra mattress.`,
    };
};