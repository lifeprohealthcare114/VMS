const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  try {
    // Parse JSON body
    const { email, firstName, lastName } = JSON.parse(event.body);

    if (!email || !firstName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: email or firstName' }),
      };
    }

    // Create reusable transporter object using Gmail SMTP
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // TLS
      auth: {
        user: process.env.GMAIL_USER,     // Your full Gmail address
        pass: process.env.GMAIL_APP_PASS, // Use Gmail App Password here
      },
    });

    // Compose email message
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; color: #333;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50;">Thank You for Visiting Us!</h2>

            <p>Hi ${firstName} ${lastName || ''},</p>

            <p>Thank you for visiting us today and for taking the time to fill out our visitor form. We're glad to have had the opportunity to connect with you.</p>

            <p>If you have any questions or need further assistance, feel free to reach out to us at any time. We’re here to help.</p>

            <p>We hope to see you again soon!</p>

            <p style="margin-top: 30px;">Best regards,<br />
            <strong>The Lifepro Healthcare Team</strong><br />
            <a href="https://www.lifeprohealthcare.com/" style="color: #3498db;">https://www.lifeprohealthcare.com/</a></p>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Thank You for Visiting Us!',
      html: htmlContent,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Thank you email sent successfully.' }),
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to send email' }),
    };
  }
};
