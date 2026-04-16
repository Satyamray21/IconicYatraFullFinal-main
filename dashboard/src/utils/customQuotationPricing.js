/**
 * Custom quotation package pricing — same rules as customquotationStep6.jsx
 * (nights × per-night rates × rooms + mattress + vehicle → margin → discount → GST).
 */

const num = (v) => {
    const n = parseFloat(String(v ?? "").replace(/,/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
};

/**
 * @param {object} opts
 * @param {Array<{ nights?: number, prices?: { standard?: number, deluxe?: number, superior?: number } }>} opts.destinations
 * @param {number} opts.numberOfRooms
 * @param {number} opts.mattressCount — extra mattresses (Step 6: noOfMattress)
 * @param {number} opts.standardPackageMattressCostPerNight — Step 6 field `superiorMattressCost` (used on standard package)
 * @param {number} opts.deluxePackageMattressCostPerNight — Step 6 `deluxeMattressCost`
 * @param {number} [opts.superiorPackageMattressCostPerNight] — defaults to deluxe mattress cost
 * @param {number} opts.vehicleCost
 * @param {number} opts.marginPercent
 * @param {number} opts.marginAmount
 * @param {number} opts.discount
 * @param {number} opts.taxPercent — GST %
 * @param {"Full"|"Margin"|"None"} opts.gstOn
 */
export function computeCustomQuotationPackages(opts) {
    const {
        destinations = [],
        numberOfRooms = 1,
        mattressCount = 0,
        standardPackageMattressCostPerNight = 0,
        deluxePackageMattressCostPerNight = 0,
        superiorPackageMattressCostPerNight,
        vehicleCost = 0,
        marginPercent = 0,
        marginAmount = 0,
        discount = 0,
        taxPercent = 0,
        gstOn = "Full",
    } = opts;

    let totalNights = 0;
    let totalStandard = 0;
    let totalDeluxe = 0;
    let totalSuperior = 0;

    destinations.forEach((d) => {
        const nights = num(d.nights);
        const p = d.prices || {};
        totalNights += nights;
        totalStandard += nights * num(p.standard);
        totalDeluxe += nights * num(p.deluxe);
        totalSuperior += nights * num(p.superior);
    });

    const m = num(mattressCount);
    const rooms = Math.max(1, num(numberOfRooms));
    const v = num(vehicleCost);
    const mp = num(marginPercent);
    const ma = num(marginAmount);
    const disc = num(discount);
    const gstPct = num(taxPercent);

    const stdMattNight = num(standardPackageMattressCostPerNight);
    const dlxMattNight = num(deluxePackageMattressCostPerNight);
    const supMattNight =
        superiorPackageMattressCostPerNight !== undefined &&
        superiorPackageMattressCostPerNight !== null
            ? num(superiorPackageMattressCostPerNight)
            : dlxMattNight;

    const superiorMattressTotal = m * stdMattNight * totalNights;
    const deluxeMattressTotal = m * dlxMattNight * totalNights;
    const superiorTierMattressTotal = m * supMattNight * totalNights;

    const baseStandard =
        totalStandard * rooms + superiorMattressTotal + v;
    const baseDeluxe = totalDeluxe * rooms + deluxeMattressTotal + v;
    const baseSuperior =
        totalSuperior * rooms + superiorTierMattressTotal + v;

    function tier(base) {
        const afterMargin = base + (mp / 100) * base + ma;
        const afterDiscount = Math.max(0, afterMargin - disc);

        let gstAmount = 0;
        if (gstOn === "None" || gstPct <= 0) {
            gstAmount = 0;
        } else if (gstOn === "Margin") {
            const onMargin = Math.max(0, afterMargin - base);
            gstAmount = (gstPct / 100) * onMargin;
        } else {
            gstAmount = (gstPct / 100) * afterDiscount;
        }

        const finalTotal = afterDiscount + gstAmount;

        return {
            baseCost: base,
            afterMargin,
            afterDiscount,
            gstPercentage: gstPct,
            gstAmount,
            finalTotal,
        };
    }

    return {
        totalNights,
        standard: tier(baseStandard),
        deluxe: tier(baseDeluxe),
        superior: tier(baseSuperior),
    };
}
