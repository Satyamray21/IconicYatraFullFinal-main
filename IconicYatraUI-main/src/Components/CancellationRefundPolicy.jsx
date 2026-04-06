import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  List,
  ListItem,
} from "@mui/material";
import {
  Home as HomeIcon,
  ArrowForwardIos as ArrowIcon,
} from "@mui/icons-material";

const CancellationRefundPolicy = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ py: 6, px: 10, backgroundColor: "#eeececff" }}>
      {/* your content here */}

      {/* Breadcrumbs */}
      <Breadcrumbs
        aria-label="breadcrumb"
        separator={<ArrowIcon fontSize="small" sx={{ color: "error.main" }} />}
        sx={{ mb: 3 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            color: "error.main",
            "&:hover": { textDecoration: "underline" },
          }}
          onClick={() => navigate("/")}
        >
          <HomeIcon sx={{ mr: 0.5, color: "error.main" }} fontSize="inherit" />
          <Typography variant="body2" fontWeight="bold" color="error.main">
            Home
          </Typography>
        </Box>

        <Typography variant="body2" color="text.primary" fontWeight="bold">
          Cancellation & Refund Policy
        </Typography>
      </Breadcrumbs>

      {/* Page Title */}
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        CANCELLATION &{" "}
        <Box component="span" color="error.main">
          REFUND POLICY
        </Box>
      </Typography>

      <Typography variant="body1" paragraph>
        GlobeVisitors.com at its sole discretion maintains authority to change
        the terms and conditions with or without earlier notification.
      </Typography>

      {/* Booking & Payment Policy */}
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Booking & Payment Policy:
      </Typography>
      <Typography variant="body2" paragraph>
        A non-refundable amount of 20% of package cost with GST(5%) (Domestic
        and International separately) starts after the first payment is done.
      </Typography>

      <List dense>
        <ListItem sx={{ display: "list-item", pl: 2 }}>
          1. 20% payment of package cost at the time of Reservation + 100%
          Flight/Train Cost.
        </ListItem>
        <ListItem sx={{ display: "list-item", pl: 2 }}>
          2. 40% payment of total package cost after receiving booking
          confirmation mail from the Company.
        </ListItem>
        <ListItem sx={{ display: "list-item", pl: 2 }}>
          3. Pay the rest amount after receiving the Hotel Booking Confirmation
          mail.
        </ListItem>
      </List>

      <Typography variant="body2" paragraph>
        * Copies of the visa/ID confirmation for International/Domestic visits
        separately.
      </Typography>
      <Typography variant="body2" paragraph>
        * GST(5%) charges apply on all bookings.
      </Typography>

      {/* Cancellation Policy */}
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Scratch-off Policy or Cancellation Policy:
      </Typography>
      <Typography variant="body2" paragraph>
        In case conditions constrain you to drop the visit, the cancellation
        should be submitted to us in written form (hard copy).
      </Typography>
      <Typography variant="body2" paragraph>
        Limited time bundles on Indigo or other LCC will be non-refundable and
        no date change permitted once reserved.
      </Typography>
      <Typography variant="body2" paragraph>
        Any flight where Indigo or other LCC is involved, the ticket sum is
        non-refundable and delays are not permitted.
      </Typography>
      <Typography variant="body2" paragraph>
        In any remaining cases crossing out charges will be according to the
        booking state of the visit and we will be obliged to collect the
        accompanying scratch-off charges per individual. Crossing out or
        deferment charges per individual will be appropriate as follows:
      </Typography>
      <Typography variant="body2" paragraph>
        If one booking made with Globe Visitors = 20% of package cost is
        Non-refundable (Domestic and International separately).
      </Typography>
      <Typography variant="body2" paragraph>
        Between 60-45 days of date of travel = 20% Non-refundable amount
        (Rs.10000) + 20% of the Holiday Cost
      </Typography>
      <Typography variant="body2" paragraph>
        Between 44-30 days of flight = 20% Non-refundable store (Rs.10000) +
        half of the Holiday Cost.
      </Typography>

      <Typography variant="body2" paragraph>
        Between 29-15 days of flight = 20% Non-refundable store (Rs.10000) + 80%
        of the Holiday Cost.
      </Typography>

      <Typography variant="body2" paragraph>
        Preceding 14 days of the take-off = 100% of the Holiday Cost.
      </Typography>

      <Typography variant="body2" paragraph>
        On the off chance that traveler is no show at takeoff time, 100% of
        visit cost will be deducted.
      </Typography>

      <Typography variant="body2" paragraph>
        Crossing out charges for Air Asia Ticket booking will apply according to
        Air Asia Cancellation Rules. It will be extra than the above crossing
        out charges.
      </Typography>

      <Typography variant="body2" paragraph>
        Crossing out charges for Star Cruise booking will apply according to
        Star Cruises Cancellation Rules. It will be extra than the above
        crossing out charges.
      </Typography>

      <Typography variant="body2" paragraph>
        Whenever booking is affirmed during Super Peak period (Holi, Diwali,
        Long Weekends, Christmas and New Year Period between 20th December and
        10th January) Cancellation expense of 80% of Tour Cost will be charged
        for all reserving dropped inside 45 days of movement.
      </Typography>

      <Typography variant="body2" paragraph>
        For International bundle, we can't be considered answerable for any
        "Refusal of Visa/Refusal of On appearance of Visa/Delay in issuance of
        Visa" and appropriate dropping charges will apply as needs be.
      </Typography>

      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Retraction strategy appropriate for booking done as Guarantee Booking:
      </Typography>

      <Typography variant="body2" paragraph>
        This is to illuminate you, preceding affirm your appointments which need
        to ensure booking that our ordinary crossing out arrangement referenced
        promptly here above won't be pertinent for your booking
      </Typography>

      <Typography variant="body2" paragraph>
        Our booking is having travel visit parts which need ensure booking,
        which implies no wiping out will be permitted whenever booking is made
        for you. Accordingly broad wiping out approach referenced above will be
        supplanted by the accompanying crossing out arrangement.
      </Typography>

      <Typography variant="body2" paragraph>
        Assuming dropping is made any time once the booking is affirmed
        independent of number of days before takeoff, 100% of visit cost will be
        deducted Globe Visitors has an option to drop the tickets with no
        earlier notification to the specialist if credit settlement isn't done
        inside the due date. In such a case, all scratch-off charges will be
        charged from the specialist's a/c and the specialist needs to bear all
        accusations along with the real duty forthcoming.
      </Typography>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Installment Policy:
      </Typography>

      <Typography variant="body2" paragraph>
        Full installment is required (acknowledgment of full sum in Co's. bank
        A/C) on affirmation, all things considered in case of choice of hotels
        from guests.
      </Typography>

      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Significant Notice For VISA:
      </Typography>

      <Typography variant="body2" paragraph>
        On Arrival Visa is legitimate just for greatest stay for 14 sequential
        days.
      </Typography>

      <Typography variant="body2" paragraph>
        Globe Visitors can not be considered answerable for any "Refusal of
        Visa/Refusal of Visa On appearance/Delay in issuance of Visa". Relevant
        dropping charges will apply likewise.
      </Typography>

      <Typography variant="body2" paragraph>
        Assuming that Passports are given from any of the underneath referenced
        States/Union Territory we would require all significant records
        something like 15 days preceding flight date. Andaman and Nicobar,
        Andhra Pradesh, Chhattisgarh, Dadar and Nagar Haveli, Daman and Diu,
        Goa, Gujarat, Karnataka, Kerala, Lakshadweep, Madhya Pradesh,
        Maharashtra, Orissa, Pondicherry, Tamil Nadu. If it's not too much
        trouble, check with the Visa Department for extra reports needed, prior
        to taking appointments.
      </Typography>

      <Typography variant="body2" paragraph>
        Unique Note Read, perceived and acknowledged the substance in this
        before booking of movement visit parts.
      </Typography>

      <Typography variant="body2" paragraph>
        Benevolently recognise the receipt of this correspondence as a badge of
        having acknowledged the Cancellation strategy appropriate for booking
        done as Guarantee Booking and this correspondence supplants any past
        communication regarding this matter.
      </Typography>

      <Typography variant="body2" paragraph>
        We trust you will find above all together. In case there is whatever
        further we might help you kindly don't stop for a second to reach us.
        Condition Apply**
      </Typography>

      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Data for Travellers:
      </Typography>

      <Typography variant="body2" paragraph>
        We will send your booking confirmation status inside 3 working days, in
        the event of non accessibility we will discount, however when your
        booking is affirmed crossing out approach will be appropriate. Typically
        Tickets and inn voucher will be conveyed 2 to 3 days before your takeoff
        date, however it very well may be upon the arrival of flight likewise if
        functionally required.
      </Typography>

      <Typography variant="body2" paragraph>
        The previously mentioned depiction is only for instructive reasons. Last
        bundle visit parts will be referenced on the voucher at the hour of
        settling the visit bundle. The movement visit parts referenced here are
        dependent on future developments and minute variety that might happen
        because of variables out of hand of the GLOBE VISITORS.
      </Typography>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Procedure of Bookings confirmation from GLOBE VISITORS:
      </Typography>

      <Typography variant="body2" paragraph>
        1- First Mail as a booking confirmation mail without hotel details after
        payment.
      </Typography>

      <Typography variant="body2" paragraph>
        2- 2nd mail as a hotel confirmation with hotel details after receiving a
        60% package cost with GST(5%).
      </Typography>

      <Typography variant="body2" paragraph>
        3- 3rd final mail with any amendments if occurs during tour package by
        any disturbance/route change/any price hike/hotels change/vehicle change
        etc.
      </Typography>

      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Delivering Policy:
      </Typography>

      <Typography variant="body2" paragraph>
        GLOBE VISITORS has transportation in the middle of Monday to Saturday
        (10:30 am - 6.00 pm) and Sunday is shut.
      </Typography>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Risk:
      </Typography>

      <Typography variant="body2" paragraph>
        GLOBE VISITORS has transportation in the middle of Monday to Saturday
        (10:30 am - 6.00 pm) and Sunday is shut or Closed Day.
      </Typography>

      <Typography variant="body2" paragraph>
        The Company thus explicitly addresses that it is going about as a
        mediator among explorers and substances or people offering the types of
        assistance depicted in the schedules. Subsequently, the Company will not
        be at risk for any inadequacy, nor for any mishap, harm, injury,
        deferral or inconsistency in the administrations given, nor for the
        baggage and different items having a place with the explorers.
      </Typography>

      <Typography variant="body2" paragraph>
        The Company bends over backward to update all data as often as possible
        on the site{" "}
        <Link
          href="https://www.globevisitors.com"
          target="_blank"
          rel="noopener noreferrer"
          color="primary"
          underline="hover"
        >
          https://www.globevisitors.com
        </Link>{" "}
        refreshed; notwithstanding, neither the Company nor{" "}
        <Link
          href="https://www.globevisitors.com"
          target="_blank"
          rel="noopener noreferrer"
          color="primary"
          underline="hover"
        >
          https://www.globevisitors.com
        </Link>{" "}
        will be obligated for harms coming about because of any mistakes and
        exclusions in the data gave on the site.
      </Typography>

      <Typography variant="body2" paragraph>
        The Company thus number aims any risk coming about because of any
        deferral, progressed takeoff or undoing set up via aircrafts or
        different transporters, and all possible expenses emerging there from
        will be borne by explorers.
      </Typography>

      <Typography variant="body2" paragraph>
        Assuming visits don't have the necessary least number of voyagers or
        then again if because of any advocated reason the Company is compelled
        to drop any outing, enlisted explorers will just be qualified for a
        discount of sums paid, explicitly forgoing the option to declare some
        other case.
      </Typography>

      <Typography variant="body2" paragraph>
        The Company expects no obligation for inn reviewing standards or lodging
        consistency checking. Visit bundles and schedules shipped off voyagers
        show inn grades as formally appointed by neighbourhood travel industry
        specialists.
      </Typography>

      <Typography variant="body2" paragraph>
        The Company doesn't ensure the treatment of stuff and individual things,
        and explorers accept total and full liability accordingly. Explorers are
        hence encouraged to acquire suitable travel protection inclusion against
        this danger.
      </Typography>

      <Typography variant="body2" paragraph>
        The Company accepts no accountability by reason of awful climate
        conditions, exhibits, mobs, war or war tales, or any Act of God or power
        majeure occasions outside the control of either party that may
        unfavourably influence the visit.
      </Typography>
      <Typography variant="body2" paragraph>
        The utilisation of air or land transportation by voyagers infers an
        immediate connection between transporter/s and explorers. Voyagers are
        encouraged to get flight dropping protection.
      </Typography>

      <Typography variant="body2" paragraph>
        In case of abrogations influencing administrations shrunk by the office,
        the discount of such administrations will be dependent upon the details
        of the arrangement under which administrations are delivered by the
        significant organisations. On the occasion there are discounts, offices
        will be qualified to deduct up to ten (10) percent for themselves.
      </Typography>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        General Provisions:
      </Typography>

      <Typography variant="body2" paragraph>
        You might make a trip to specific objections which imply more serious
        dangers than others, totally at your danger as to cost and results.
      </Typography>

      <Typography variant="body2" paragraph>
        GLOBE VISITORS demands you to counsel your neighborhood specialists and
        assess travel disallowances, cautioning, declarations, and warnings
        given by them prior to booking travel to specific global objections.
      </Typography>

      <Typography variant="body2" paragraph>
        By making available for purchase travel to specific worldwide
        objections, GLOBE VISITORS doesn't address or warrant that movement to
        such a point is fitting or without hazard. GLOBE VISITORS doesn't
        acknowledge risk for harms, misfortunes, or defers that might result
        from ill-advised archives for passage, leave, length of stay, or from
        movement to such objections.
      </Typography>

      <Typography variant="body2" paragraph>
        GLOBE VISITORS Trip holds its elite solidly in its sole numberration, as
        far as possible or number the Site or any material posted this, in any
        regard. GLOBE VISITORS will have no commitment to think about the
        requirements of any User in association therewith.
      </Typography>

      <Typography variant="body2" paragraph>
        GLOBE VISITORS Trip maintains its authority to deny in its sole
        numberration any client admittance to this Site or any part about
        without notice.
      </Typography>

      <Typography variant="body2" paragraph>
        No waiver by GLOBE VISITORS of any arrangement of these Terms and
        Conditions will be restricted besides as gone ahead recorded as a hard
        copy and endorsed by its appropriately approved agent.
      </Typography>

      <Typography variant="body2" paragraph>
        On the off chance that any debate emerges among you and GLOBE VISITORS
        during your utilization of the Site or from that point, regarding and
        emerging from your utilization or endeavor to utilize this Site, the
        question will be alluded to assertion. The spot of mediation will be
        Delhi. The mediation procedures will be in the English language.
      </Typography>
      <Typography variant="body2" paragraph>
        The said discretion procedures will be represented and interpreted as
        per the Arbitration and Conciliation Act, 1996 and adjustments thereof
        as in power at the pertinent time.
      </Typography>
      <Typography variant="body2" paragraph>
        These agreements are administered by and will be understood as per the
        laws of the Republic of India and any debate will solely be dependent
        upon the purview of the fitting Courts arranged at Noida Uttar Pradesh,
        India.
      </Typography>
    </Box>
  );
};

export default CancellationRefundPolicy;
