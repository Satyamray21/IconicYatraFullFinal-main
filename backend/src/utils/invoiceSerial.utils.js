import mongoose from "mongoose";
import InvoiceSequence from "../models/invoiceSequence.model.js";
import Company from "../models/company.model.js";

/** Indian FY (April–March) e.g. "2024-25" — uses UTC to match stored invoiceDate (ISO midnight). */
export function getFinancialYearFromDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const financialYearStart = m >= 3 ? y : y - 1;
    const financialYearEnd = financialYearStart + 1;
    return `${financialYearStart}-${String(financialYearEnd).slice(-2)}`;
}

/** Calendar month from invoiceDate UTC, e.g. "2026-01" (avoids server timezone shifting the month). */
export function getCalendarMonthKey(date) {
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}

/** Calendar year from invoiceDate UTC, e.g. "2026". */
export function getCalendarYearKey(date) {
    const d = date instanceof Date ? date : new Date(date);
    return String(d.getUTCFullYear());
}

export function getMonthBoundsForKey(yearMonth) {
    const [y, m] = yearMonth.split("-").map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    return { start, end };
}

export function monthNameUtcLong(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
}

function companyShortName(company) {
    return company?.companyName
        ? company.companyName
              .split(" ")
              .map((w) => w[0].toUpperCase())
              .join("")
              .substring(0, 2)
        : "CO";
}

/** Max serial used by invoices in this company + financial year */
export async function getMaxInvoiceSerialForFinancialYear(companyId, fyKey) {
    const [startYear] = String(fyKey).split("-").map(Number);
    const start = new Date(Date.UTC(startYear, 3, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(startYear + 1, 2, 31, 23, 59, 59, 999));
    const peers = await mongoose
        .model("Invoice")
        .find({
            companyId,
            invoiceDate: { $gte: start, $lte: end },
        })
        .select("advancedReceiptNo invoiceSerialNo")
        .lean();
    let maxSerial = 0;
    for (const p of peers) {
        const direct = Number(p.invoiceSerialNo);
        if (Number.isFinite(direct) && direct > 0) {
            maxSerial = Math.max(maxSerial, direct);
            continue;
        }
        const m = (p.advancedReceiptNo || "").match(/(\d{3})$/);
        if (m) {
            maxSerial = Math.max(maxSerial, parseInt(m[1], 10));
        }
    }
    return maxSerial;
}

/**
 * Next serial for this company + invoiceDate's financial year (monotonic within FY).
 * Business rule: every new financial year starts from 001.
 */
export async function allocateNextInvoiceSerial(companyId, refDate) {
    const fyKey = getFinancialYearFromDate(refDate);
    const maxFromInvoices = await getMaxInvoiceSerialForFinancialYear(companyId, fyKey);
    const cid = new mongoose.Types.ObjectId(companyId);
    const baselineSeed = 0;

    const pipeline = [
        {
            $set: {
                companyId: cid,
                yearMonth: fyKey,
                lastSerial: {
                    $add: [
                        {
                            $max: [
                                { $ifNull: ["$lastSerial", 0] },
                                maxFromInvoices,
                                baselineSeed,
                            ],
                        },
                        1,
                    ],
                },
            },
        },
    ];

    const doc = await InvoiceSequence.findOneAndUpdate(
        { companyId: cid, yearMonth: fyKey },
        pipeline,
        { new: true, upsert: true }
    );

    return doc.lastSerial;
}

/**
 * Renumber advancedReceiptNo (001..00n) for all invoices in a company + calendar month (UTC).
 * Sorted by invoiceDate then createdAt. Does not change invoiceNo (e.g. legacy ICYR_#### stays).
 */
export async function renumberInvoicesAfterDeleteForMonth(companyId, yearMonth) {
    const { start, end } = getMonthBoundsForKey(yearMonth);
    const cid = new mongoose.Types.ObjectId(companyId);

    const company = await Company.findById(cid);
    if (!company) {
        return;
    }
    const shortName = companyShortName(company);

    const invoices = await mongoose
        .model("Invoice")
        .find({
            companyId: cid,
            invoiceDate: { $gte: start, $lte: end },
        })
        .sort({ invoiceDate: 1, createdAt: 1 })
        .select("_id invoiceDate")
        .lean();

    const Invoice = mongoose.model("Invoice");

    for (let i = 0; i < invoices.length; i++) {
        const inv = invoices[i];
        const refDate = new Date(inv.invoiceDate);
        const fyString = getFinancialYearFromDate(refDate);
        const monthName = monthNameUtcLong(refDate);
        const serial = String(i + 1).padStart(3, "0");
        const advancedReceiptNo = `AR-${shortName}-${monthName}-${serial}`;

        await Invoice.updateOne(
            { _id: inv._id },
            {
                $set: {
                    advancedReceiptNo,
                    financialYear: fyString,
                },
            }
        );
    }

    const newLast = invoices.length;
    await InvoiceSequence.updateOne(
        { companyId: cid, yearMonth },
        {
            $set: { lastSerial: newLast },
            $setOnInsert: { companyId: cid, yearMonth },
        },
        { upsert: true }
    );
}

/**
 * Backfill persistent invoiceSerialNo for existing invoices.
 * Rule: for each company + financial year, serial starts from 001
 * and increments by invoiceDate asc, createdAt asc.
 */
export async function backfillInvoiceSerialsForExisting({
    companyId = null,
    year = null,
} = {}) {
    const Invoice = mongoose.model("Invoice");
    const query = {};
    if (companyId) {
        query.companyId = new mongoose.Types.ObjectId(companyId);
    }
    if (year !== null && year !== undefined && Number.isFinite(Number(year))) {
        const y = Number(year);
        query.invoiceDate = {
            $gte: new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0)),
            $lte: new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999)),
        };
    }

    const rows = await Invoice.find(query)
        .select("_id companyId invoiceDate createdAt invoiceSerialNo")
        .sort({ companyId: 1, invoiceDate: 1, createdAt: 1 })
        .lean();

    const groups = new Map();
    for (const row of rows) {
        const fy = getFinancialYearFromDate(row.invoiceDate);
        const key = `${String(row.companyId)}::${fy}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
    }

    let updatedCount = 0;
    const summary = [];
    for (const [key, list] of groups.entries()) {
        const [cid, fy] = key.split("::");
        let serial = 0;
        for (const inv of list) {
            serial += 1;
            await Invoice.updateOne(
                { _id: inv._id },
                { $set: { invoiceSerialNo: serial } }
            );
            updatedCount += 1;
        }
        summary.push({
            companyId: cid,
            financialYear: fy,
            startSerial: 1,
            endSerial: serial,
            invoices: list.length,
        });
    }

    return { updatedCount, summary };
}
