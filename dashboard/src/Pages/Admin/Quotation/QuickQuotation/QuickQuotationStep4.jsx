import React from "react";
import {
    Box,
    Grid,
    TextField,
    Button,
    Typography,
    IconButton,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { Formik, Form, FieldArray } from "formik";

const StepPoliciesOthers = ({ onNext, onBack }) => {

    const defaultInclusions = [
        "Accommodation in well appointed rooms",
        "Daily breakfast at hotel",
        "All transfers & sightseeing by private vehicle",
        "All applicable taxes"
    ];

    const defaultExclusions = [
        "Expenses of personal nature such as Room Heater, Tips, Laundry, Telephone & Table Drinks Etc.",
        "Goods & Service Tax (5%GST) are extra on the given package cost & Train/Flight Cost.",
        "Garden/Places Entrance Fee. Guide Services. All Activities at your own cost.",
        "All Entry Tickets Directly payable by Guest on the Spot.",
        "Children above 5 year are extra payable as per hotel policy.",
        "Air Fare/Rail Tickets/Bus Tickets If Not Given.",
        "Any Amendments during the trip/route/tour package may vary your package cost and is payable by guest before ending the trip."
    ];

    const defaultCancellationPolicy = `CANCELLATION POLICY:-
@ If once booking is made with Iconic Yatra = 18% of the package cost is Non-refundable (in case of Cancellation after Booking made)
@ Between 60-45 days of the date of travel = 18% Non-refundable package cost + 22% Amount of the Holiday package Cost.
@ Between 44-30 days of flight = 18% Non-refundable package cost + 42% Amount of Holiday Package Cost.
@ Between 29-15 days of flight = 18% Non-refundable amount of Package Cost + 62% Amount of the Holiday Package Cost.
@ Preceding 14 days of the take-off =100% of the Holiday Cost. On the off chance that the traveler is no show at takeoff time, 100% of the visit cost will be deducted.

NOTE:- Applicable To The Aforesaid Cancellation Table In case of third-party products, No Individual Hotel/Taxi Cancellation charges would be applicable.`;

    const defaultPaymentPolicy = `PAYMENT POLICY:
1.  20% payment of package cost at the time of Reservation + 100% Flight/Train Cost.
2.  50% Payment of Package Cost for random Hotel confirmation.
3. 30% payment of total package cost, After receiving Hotel Booking confirmation mail from the Company.`;

    const defaultNotes = `TERMS & CONDITIONS: 
Kindly visit website for more details of Terms & Conditions at - https://www.iconicyatra.com/cancellation-refund-policy.html 

NOTE: All cards are accepted here. Now you can pay through Credit/Debit Cards(3.5% extra) for more details and contact your Tour Expert.

I hope the above is in order and clear, if any errors please freely contact us. If you need any further information/assistance, we look forward to hearing from you soon.`;

    return (
        <Formik
            initialValues={{
                inclusions: defaultInclusions,
                exclusions: defaultExclusions,
                cancellationPolicy: defaultCancellationPolicy,
                paymentPolicy: defaultPaymentPolicy,
                notes: defaultNotes,
            }}
            onSubmit={(values, { setSubmitting }) => {
                console.log("Policies Data:", values);

                // Filter out empty strings from arrays before submitting
                const filteredValues = {
                    ...values,
                    inclusions: values.inclusions.filter(item => item && item.trim() !== ""),
                    exclusions: values.exclusions.filter(item => item && item.trim() !== ""),
                };

                console.log("Filtered Policies Data:", filteredValues);
                onNext({ policies: filteredValues });
                setSubmitting(false);
            }}
        >
            {({ values, handleChange, isSubmitting }) => (
                <Form>
                    <Typography variant="h6" mb={2} fontWeight={600}>
                        Policies & Other Details
                    </Typography>

                    <Grid container spacing={2}>
                        {/* Inclusions */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle1" fontWeight={500}>
                                Inclusions
                            </Typography>
                            <FieldArray
                                name="inclusions"
                                render={(arrayHelpers) => (
                                    <Box>
                                        {values.inclusions.map((inclusion, index) => (
                                            <Box
                                                key={index}
                                                display="flex"
                                                alignItems="center"
                                                gap={1}
                                                mb={1}
                                            >
                                                <TextField
                                                    fullWidth
                                                    label={`Inclusion ${index + 1}`}
                                                    name={`inclusions[${index}]`}
                                                    value={inclusion}
                                                    onChange={handleChange}
                                                    multiline
                                                    rows={2}
                                                />
                                                <IconButton
                                                    color="error"
                                                    onClick={() => arrayHelpers.remove(index)}
                                                    disabled={values.inclusions.length === 1}
                                                >
                                                    <Delete />
                                                </IconButton>
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => arrayHelpers.insert(index + 1, "")}
                                                >
                                                    <Add />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            />
                        </Grid>

                        {/* Exclusions */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle1" fontWeight={500}>
                                Exclusions
                            </Typography>
                            <FieldArray
                                name="exclusions"
                                render={(arrayHelpers) => (
                                    <Box>
                                        {values.exclusions.map((exclusion, index) => (
                                            <Box
                                                key={index}
                                                display="flex"
                                                alignItems="center"
                                                gap={1}
                                                mb={1}
                                            >
                                                <TextField
                                                    fullWidth
                                                    label={`Exclusion ${index + 1}`}
                                                    name={`exclusions[${index}]`}
                                                    value={exclusion}
                                                    onChange={handleChange}
                                                    multiline
                                                    rows={2}
                                                />
                                                <IconButton
                                                    color="error"
                                                    onClick={() => arrayHelpers.remove(index)}
                                                    disabled={values.exclusions.length === 1}
                                                >
                                                    <Delete />
                                                </IconButton>
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => arrayHelpers.insert(index + 1, "")}
                                                >
                                                    <Add />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            />
                        </Grid>

                        {/* Cancellation Policy */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                multiline
                                minRows={8}
                                label="Cancellation Policy"
                                name="cancellationPolicy"
                                value={values.cancellationPolicy}
                                onChange={handleChange}
                                placeholder="Describe your cancellation terms here..."
                            />
                        </Grid>

                        {/* Payment Policy */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                multiline
                                minRows={10}
                                label="Payment Policy"
                                name="paymentPolicy"
                                value={values.paymentPolicy}
                                onChange={handleChange}
                                placeholder="Describe your payment terms here..."
                            />
                        </Grid>

                        {/* Notes / Additional Message */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                multiline
                                minRows={4}
                                label="Additional Notes / Message"
                                name="notes"
                                value={values.notes}
                                onChange={handleChange}
                                placeholder="Enter any important message or notes for the customer..."
                            />
                        </Grid>
                    </Grid>

                    {/* Buttons */}
                    <Box mt={4} display="flex" justifyContent="space-between">
                        <Button variant="outlined" onClick={onBack}>
                            Back
                        </Button>
                        <Button variant="contained" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Processing..." : "Next"}
                        </Button>
                    </Box>
                </Form>
            )}
        </Formik>
    );
};

export default StepPoliciesOthers;