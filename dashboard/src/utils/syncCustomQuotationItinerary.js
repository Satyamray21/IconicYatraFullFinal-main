/**
 * Persist day-wise itinerary (step 4). Uses JSON when no new image files;
 * FormData + placeholder blobs when any day has a new File (aligned with multer indices).
 */
export async function saveCustomQuotationItinerary(dispatch, updateQuotationStep, quotationId, days) {
    const itineraryRows = days.map((d) => {
        let imageUrl = null;
        if (d.image?.file instanceof File) {
            imageUrl = null;
        } else if (typeof d.image === "string") {
            imageUrl = d.image;
        } else if (
            d.image?.preview &&
            typeof d.image.preview === "string" &&
            !d.image.preview.startsWith("blob:")
        ) {
            imageUrl = d.image.preview;
        }
        return {
            dayTitle: d.title || "Day",
            dayNote: d.description || "",
            ...(d.dayDate ? { dayDate: String(d.dayDate).trim() } : {}),
            ...(imageUrl ? { image: imageUrl } : {}),
        };
    });

    const hasNewFiles = days.some((d) => d.image?.file instanceof File);

    if (hasNewFiles) {
        const fd = new FormData();
        fd.append(
            "stepData",
            JSON.stringify({
                itinerary: itineraryRows.map((row, i) =>
                    days[i].image?.file instanceof File
                        ? { ...row, image: row.image ?? undefined }
                        : row
                ),
            })
        );
        days.forEach((d) => {
            if (d.image?.file instanceof File) {
                fd.append("itineraryImages", d.image.file);
            } else {
                fd.append(
                    "itineraryImages",
                    new Blob([], { type: "image/png" }),
                    "itinerary-noop.png"
                );
            }
        });
        return dispatch(
            updateQuotationStep({ quotationId, stepNumber: 4, stepData: fd })
        ).unwrap();
    }

    return dispatch(
        updateQuotationStep({
            quotationId,
            stepNumber: 4,
            stepData: { itinerary: itineraryRows },
        })
    ).unwrap();
}
