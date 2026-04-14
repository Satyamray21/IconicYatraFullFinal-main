/**
 * Maps QuickQuotation ↔ shapes used by CustomQuotation finalize dialogs (Step 5 / 6 / costing).
 */

const hotelRow = (d, cat) => {
    const h = (d.hotels || []).find(
        (x) => String(x.category).toLowerCase() === cat
    );
    const name =
        h?.hotelName && !/^TBD$/i.test(String(h.hotelName).trim())
            ? String(h.hotelName).trim()
            : "";
    const price = Number(h?.pricePerPerson) || 0;
    return { name, price };
};

export function destinationNightsToStepDestinations(dn) {
    return (dn || []).map((d) => {
        const st = hotelRow(d, "standard");
        const dx = hotelRow(d, "deluxe");
        const su = hotelRow(d, "superior");
        return {
            cityName: d.destination || "City",
            nights: d.nights || 1,
            standardHotels: st.name ? [st.name] : [""],
            deluxeHotels: dx.name ? [dx.name] : [""],
            superiorHotels: su.name ? [su.name] : [""],
            prices: {
                standard: st.price,
                deluxe: dx.price,
                superior: su.price,
            },
        };
    });
}

export function quickToHotelsFormData(quick) {
    const pkg = quick?.packageSnapshot || {};
    const dn = Array.isArray(pkg.destinationNights) ? pkg.destinationNights : [];
    const sl = Array.isArray(pkg.stayLocations) ? pkg.stayLocations : [];

    const qdExisting = pkg.quotationDetails && typeof pkg.quotationDetails === "object"
        ? pkg.quotationDetails
        : {};

    let destinations =
        Array.isArray(qdExisting.destinations) && qdExisting.destinations.length
            ? qdExisting.destinations
            : null;
    if (!destinations) {
        if (dn.length) {
            destinations = destinationNightsToStepDestinations(dn);
        } else if (sl.length) {
            destinations = sl.map((l) => ({
                cityName: l.city || "City",
                nights: l.nights || 1,
                standardHotels: [""],
                deluxeHotels: [""],
                superiorHotels: [""],
                prices: { standard: 0, deluxe: 0, superior: 0 },
            }));
        } else {
            destinations = [
                {
                    cityName: "City",
                    nights: 1,
                    standardHotels: [""],
                    deluxeHotels: [""],
                    superiorHotels: [""],
                    prices: { standard: 0, deluxe: 0, superior: 0 },
                },
            ];
        }
    }

    const pickupDrop = destinations.map((d) => ({
        cityName: d.cityName || "City",
        nights: d.nights || 1,
    }));

    const vehicleDetails =
        pkg.vehicleDetails && typeof pkg.vehicleDetails === "object"
            ? pkg.vehicleDetails
            : {
                  basicsDetails: {
                      vehicleType: quick?.transportation || pkg.transportation || "Sedan",
                      tripType: "Round Trip",
                      noOfDays: 1,
                      perDayCost: 0,
                  },
                  costDetails: {
                      perDayCost: 0,
                      ratePerKm: "",
                      kmPerDay: "",
                      driverAllowance: 0,
                      tollParking: 0,
                      totalCost: 0,
                  },
                  pickupDropDetails: {
                      pickupLocation:
                          quick?.pickupPoint || pkg.arrivalCity || "TBD",
                      dropLocation:
                          quick?.dropPoint || pkg.departureCity || "TBD",
                      pickupDate: pkg.validFrom || quick?.createdAt,
                      dropDate: pkg.validTill || pkg.validFrom || quick?.createdAt,
                      pickupTime: "12:00",
                      dropTime: "12:00",
                  },
              };

    const tourDetails = {
        quotationTitle: pkg.title || pkg.sector || "Tour Package",
        destinationSummary: pkg.sector || "",
        arrivalCity: pkg.arrivalCity || "",
        departureCity: pkg.departureCity || "",
        arrivalDate: pkg.validFrom || quick?.createdAt,
        departureDate: pkg.validTill || pkg.validFrom || quick?.createdAt,
        transport: pkg.transportation || quick?.transportation || "Yes",
        vehicleDetails,
        quotationDetails: {
            adults: Number(quick?.adults) || 0,
            children: Number(quick?.children) || 0,
            kids: Number(quick?.kids) || 0,
            infants: Number(quick?.infants) || 0,
            mealPlan:
                (typeof qdExisting.mealPlan === "string" && qdExisting.mealPlan) ||
                pkg.mealPlan?.planType ||
                "CP",
            destinations,
            rooms: qdExisting.rooms || {
                numberOfRooms: 1,
                roomType: "Deluxe",
                sharingType: "Double sharing",
                mattress: 0,
            },
            mattress: qdExisting.mattress || {
                superiorMattressCost: 0,
                deluxeMattressCost: 0,
            },
            companyMargin: qdExisting.companyMargin || {
                marginPercent: 0,
                marginAmount: 0,
            },
            discount: qdExisting.discount ?? 0,
            taxes: qdExisting.taxes || {
                gstOn: "Full",
                taxPercent: 5,
                applyGST: true,
            },
            packageCalculations: qdExisting.packageCalculations,
            additionalServices: Array.isArray(qdExisting.additionalServices)
                ? qdExisting.additionalServices
                : [],
            signatureDetails: qdExisting.signatureDetails || {
                regardsText: "Best Regards",
                signedBy: "",
            },
        },
    };

    return {
        clientDetails: {
            clientName: quick?.customerName || "",
            phone: quick?.phone || "",
            email: quick?.email || "",
        },
        pickupDrop,
        tourDetails,
    };
}

export function quickToCostingQuotation(quick) {
    return quickToHotelsFormData(quick);
}

export function finalizeHotelsFormDataToQuickUpdate(quick, finalData) {
    const prev = quick?.packageSnapshot || {};
    const prevQd0 =
        prev.quotationDetails && typeof prev.quotationDetails === "object"
            ? prev.quotationDetails
            : {};
    const qd = finalData?.tourDetails?.quotationDetails || {};
    const cities = finalData?.pickupDrop || [];
    const destinationNights = (qd.destinations || []).map((dest, i) => ({
        destination:
            dest.cityName ||
            cities[i]?.cityName ||
            `Destination ${i + 1}`,
        nights: dest.nights != null ? dest.nights : cities[i]?.nights || 1,
        hotels: [
            {
                category: "standard",
                hotelName: dest.standardHotels?.[0] || "TBD",
                pricePerPerson: Number(dest.prices?.standard) || 0,
            },
            {
                category: "deluxe",
                hotelName: dest.deluxeHotels?.[0] || "TBD",
                pricePerPerson: Number(dest.prices?.deluxe) || 0,
            },
            {
                category: "superior",
                hotelName: dest.superiorHotels?.[0] || "TBD",
                pricePerPerson: Number(dest.prices?.superior) || 0,
            },
        ],
    }));

    const stdFinal = Number(qd.packageCalculations?.standard?.finalTotal);
    const totalCost = Number.isFinite(stdFinal)
        ? stdFinal
        : Number(quick?.totalCost) || 0;
    const svcRows = Array.isArray(qd.additionalServices)
        ? qd.additionalServices
        : prevQd0.additionalServices;

    return {
        adults: Number(qd.adults) || 0,
        children: Number(qd.children) || 0,
        kids: Number(qd.kids) || 0,
        infants: Number(qd.infants) || 0,
        totalCost,
        packageSnapshot: {
            ...prev,
            mealPlan: {
                ...(typeof prev.mealPlan === "object" && prev.mealPlan
                    ? prev.mealPlan
                    : {}),
                planType: qd.mealPlan || prev.mealPlan?.planType || "CP",
            },
            destinationNights,
            quotationDetails: {
                ...qd,
                additionalServices: Array.isArray(svcRows) ? svcRows : [],
            },
        },
    };
}

export function vehicleStepPayloadToQuickUpdate(quick, vehiclePayload) {
    const prev = quick?.packageSnapshot || {};
    const basics = vehiclePayload?.basicsDetails || {};
    const pickupDrop = vehiclePayload?.pickupDropDetails || {};
    return {
        transportation: String(basics.vehicleType || quick?.transportation || ""),
        pickupPoint: String(pickupDrop.pickupLocation || quick?.pickupPoint || ""),
        dropPoint: String(pickupDrop.dropLocation || quick?.dropPoint || ""),
        packageSnapshot: {
            ...prev,
            vehicleDetails: vehiclePayload,
        },
    };
}

export function costingBodyToQuickUpdate(quick, body) {
    const prev = quick?.packageSnapshot || {};
    const prevQd =
        prev.quotationDetails && typeof prev.quotationDetails === "object"
            ? prev.quotationDetails
            : {};
    const stdFinal = Number(body?.packageCalculations?.standard?.finalTotal);
    const totalCost = Number.isFinite(stdFinal)
        ? stdFinal
        : Number(quick?.totalCost) || 0;

    return {
        totalCost,
        packageSnapshot: {
            ...prev,
            quotationDetails: {
                ...prevQd,
                companyMargin: body.companyMargin,
                discount: body.discount,
                taxes: body.taxes,
                packageCalculations: body.packageCalculations,
                additionalServices: Array.isArray(prevQd.additionalServices)
                    ? prevQd.additionalServices
                    : [],
            },
        },
    };
}
