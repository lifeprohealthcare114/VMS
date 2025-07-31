const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  try {
    // Parse incoming JSON
    const { email, firstName, lastName } = JSON.parse(event.body);

    if (!email || !firstName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: email or firstName' }),
      };
    }

    const fullName = `${firstName} ${lastName || ''}`.trim();

    // === Read logo image and convert to Base64 ===
    const logoPath = path.resolve(__dirname, 'logo.png'); // Place logo.png inside netlify/functions/
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString('base64');
    const logoDataURI = `data:image/png;base64,${logoBase64}`;

    // === Create transporter ===
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });

    // === Compose HTML email ===
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; color: #333;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoDataURI}" alt="Company Logo" style="max-width: 150px;" />
          </div>

          <h2 style="color: #2c3e50;">Thank You for Visiting Us!</h2>

          <p>Hi ${fullName},</p>

          <p>Thank you for visiting us today and for taking the time to fill out our visitor form. We're glad to have had the opportunity to connect with you.</p>

          <p>If you have any questions or need further assistance, feel free to reach out to us at any time. We’re here to help.</p>

          <p>We hope to see you again soon!</p>

          <p style="margin-top: 30px;">Best regards,<br />
          <strong>The Lifepro Healthcare Team</strong><br />
          <a href="https://www.lifeprohealthcare.com/" style="color: #3498db;">https://www.lifeprohealthcare.com/</a></p>
        </div>
      </div>
    `;

    // === Send email ===
    await transporter.sendMail({
      from: `Lifepro Healthcare <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Thank You for Visiting Us!',
      html: htmlContent,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Thank-you email sent successfully.' }),
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to send email' }),
    };
  }
};
