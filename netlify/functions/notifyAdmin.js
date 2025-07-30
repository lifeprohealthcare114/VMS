const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const stream = require('stream');

exports.handler = async (event) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      designation,
      companyName,
      purpose,
      comment
    } = JSON.parse(event.body);

    if (!email || !firstName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: email or firstName' }),
      };
    }

    // Generate PDF
    const doc = new PDFDocument({ margin: 40 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${firstName}-${lastName || ''}-${dateStr}.pdf`.replace(/\s+/g, '');

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: process.env.NOTIFY_EMAIL,
        subject: `New Visitor: ${firstName} ${lastName || ''}`,
        text: `Visitor ${firstName} ${lastName || ''} (${email}) has registered. See attached PDF for full details.`,
        attachments: [
          {
            filename,
            content: pdfData,
            contentType: 'application/pdf',
          },
        ],
      };

      await transporter.sendMail(mailOptions);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Admin notified with PDF.' }),
      };
    });

    // 🖼️ Add Logo
    const logoPath = path.join(__dirname, 'lifepro-logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 40, { width: 100 });
    }

    doc.fontSize(18).text('Visitor Registration Summary', 0, 50, {
      align: 'center',
    });

    doc.moveDown(2);

    // 📋 Table-style layout
    const addRow = (label, value) => {
      doc
        .font('Helvetica-Bold')
        .text(`${label}:`, { continued: true })
        .font('Helvetica')
        .text(` ${value || 'N/A'}`);
    };

    addRow('Name', `${firstName} ${lastName || ''}`);
    addRow('Email', email);
    addRow('Phone', phone);
    addRow('Company', companyName);
    addRow('Designation', designation);
    addRow('Purpose of Visit', purpose);
    addRow('Comment', comment);
    addRow('Date & Time', new Date().toLocaleString());

    doc.end();
  } catch (error) {
    console.error('Error generating or sending PDF:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'PDF creation failed' }),
    };
  }
};
