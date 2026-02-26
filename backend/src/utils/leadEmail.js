import path from "path";
import nodemailer from "nodemailer";

export const sendLeadThankYou = async (leadData) => {
  try {
    const {
      fullName,
      email,
      tourDestination,
      arrivalDate,
      arrivalCity,
      arrivalLocation,
      departureDate,
      departureCity,
      departureLocation,
      members,
      accommodation,
      leadId
    } = leadData;

    if (!email) return;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.gmail,
        pass: process.env.app_pass,
      },
    });

    const logoPath = path.join(process.cwd(), "public", "logo.png");

    const mailOptions = {
      from: `"Iconic Yatra Team" <${process.env.gmail}>`,
      to: email,
      subject: "🎉 Thank You for Connecting with Iconic Yatra for your Travel Needs!",
      html: `
        <div style="font-family: Arial, sans-serif; background-color:#f4f4f4;">
          <table align="center" width="600" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            <tr style="background:linear-gradient(90deg, #e3f2fd, #bbdefb);">
              <td style="text-align:center; padding:25px;">
                <img src="cid:logo" alt="Iconic Yatra" width="110" style="display:block; margin:0 auto;" />
                <h1 style="color:#0d47a1; margin:12px 0 0; font-size:26px; font-weight:700;">Iconic Yatra</h1>
                <p style="color:#1976d2; margin:5px 0 0; font-size:14px;">Your Trusted Travel Partner</p>
              </td>
            </tr>
            <tr>
              <td style="padding:30px; color:#333333; font-size:16px; line-height:1.6;">
                <h2 style="color:#0d6efd;">Hi ${fullName || "Traveller"}, 👋</h2>
               <p style="background:#e3f2fd; padding:12px; border-radius:6px; font-size:15px; color:#0d47a1;">
  ✅ Your Lead ID <strong>${leadData.leadId}</strong> has been successfully created by our team.  
  <br/>Please review your details below and let us know if any changes are required.
</p>

                <h3 style="color:#0d47a1;">📋 Your Travel Details:</h3>
                <ul style="line-height:1.8; color:#444;">
                  <li><strong>Destination:</strong> ${tourDestination || "Not Provided"}</li>
                  <li><strong>Pickup:</strong> ${arrivalCity || "-"} (${arrivalLocation || "-"}) on ${arrivalDate || "-"}</li>
                  <li><strong>Departure:</strong> ${departureCity || "-"} (${departureLocation || "-"}) on ${departureDate || "-"}</li>
                  <li><strong>Members:</strong> ${members?.adults || 0} Adults, ${members?.children || 0} Children, ${members?.kidsWithoutMattress || 0} Kids (No Mattress), ${members?.infants || 0} Infants</li>
                  <li><strong>Rooms:</strong> ${accommodation?.noOfRooms || 0}, Extra Mattress: ${accommodation?.noOfMattress || 0}</li>
                  <li><strong>Duration:</strong> ${accommodation?.noOfNights || 0} Nights</li>
                </ul>

                <div style="text-align:center; margin:30px 0;">
                  <a href="https://iconicyatra.com" target="_blank" 
                     style="background:#0d6efd; color:#ffffff; text-decoration:none; padding:12px 25px; border-radius:30px; font-weight:bold; font-size:16px;">
                    Explore Packages 🚀
                  </a>
                </div>

                <p>If you have any immediate questions, feel free to reply to this email or call us anytime. We're here to help you!</p>
                <p style="margin-top:20px;">With warm regards,<br/>
                  <strong>Team Iconic Yatra</strong></p>
              </td>
            </tr>
            <tr style="background:#f1f1f1;">
              <td align="center" style="padding:20px; font-size:14px; color:#555;">
                <p>📍 123 Travel Street, Delhi, India</p>
                <p>📞 +91-9876543210 | ✉️ support@iconicyatra.com</p>
                <p style="margin-top:10px;">
                  <a href="https://facebook.com" style="margin:0 8px; text-decoration:none; color:#0d6efd;">Facebook</a> |
                  <a href="https://instagram.com" style="margin:0 8px; text-decoration:none; color:#0d6efd;">Instagram</a> |
                  <a href="https://twitter.com" style="margin:0 8px; text-decoration:none; color:#0d6efd;">Twitter</a>
                </p>
              </td>
            </tr>
          </table>
        </div>
      `,
      attachments: [
        {
          filename: "logo.png",
          path: logoPath,
          cid: "logo",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Thank you email sent to:", email);

  } catch (error) {
    console.error("❌ Error sending thank-you email:", error.message);
  }
};
