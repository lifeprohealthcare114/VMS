const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const stream = require('stream');

exports.handler = async (event) => {
  return new Promise((resolve, reject) => {
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

      const buffers = [];
      const doc = new PDFDocument();

      doc.on('data', buffers.push.bind(buffers));

      doc.on('end', async () => {
        const pdfData = Buffer.concat(buffers);
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `${firstName}-${lastName || ''}-${dateStr}.pdf`.replace(/\s+/g, '');

        try {
          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_APP_PASS,
            },
          });

          await transporter.sendMail({
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
          });

          return resolve({
            statusCode: 200,
            body: JSON.stringify({ success: true }),
          });

        } catch (err) {
          console.error("Email error:", err);
          return resolve({
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to send email" }),
          });
        }
      });

      // 🖼️ Optional Logo
      try {
        const logoPath = path.join(__dirname, 'logo.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 40, 40, { width: 100 });
        }
      } catch (imgErr) {
        console.warn("⚠️ Logo image error:", imgErr.message);
      }

      doc.fontSize(18).text('Visitor Registration', { align: 'center' });
      doc.moveDown(2);

      const addRow = (label, value) => {
        doc.font('Helvetica-Bold').text(`${label}:`, { continued: true })
           .font('Helvetica').text(` ${value || 'N/A'}`);
      };

      addRow('Name', `${firstName} ${lastName}`);
      addRow('Email', email);
      addRow('Phone', phone);
      addRow('Company', companyName);
      addRow('Designation', designation);
      addRow('Purpose of Visit', purpose);
      addRow('Comment', comment);
      addRow('Date', new Date().toLocaleString());

      doc.end();

    } catch (err) {
      console.error("General function error:", err);
      return resolve({
        statusCode: 500,
        body: JSON.stringify({ error: err.message || "Function failed" }),
      });
    }
  });
};
