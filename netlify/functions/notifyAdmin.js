const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

      // 🖼️ Optional Logo (logo.png should be in same folder)
      try {
        const logoPath = path.join(__dirname, 'lifepro-logo.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 40, 40, { width: 100 });
        }
      } catch (imgErr) {
        console.warn("⚠️ Logo image error:", imgErr.message);
      }

      // 🎨 Yellow theme layout
      doc.rect(0, 0, 612, 792).fill('#fef9e7'); // background
      doc.lineWidth(2).strokeColor('#f1c40f').rect(30, 30, 540, 750).stroke(); // border
      doc.fillColor('#f1c40f').fontSize(24).font('Helvetica-Bold')
         .text('Visitor Registration', { align: 'center' });
      doc.moveDown(2);

      const rowSpacing = 32;
      let y = doc.y;
      const rows = [
        ['Name', `${firstName} ${lastName}`],
        ['Email', email],
        ['Phone', phone],
        ['Company', companyName],
        ['Designation', designation],
        ['Purpose of Visit', purpose],
        ['Comment', comment],
        ['Date', new Date().toLocaleString()],
      ];

      rows.forEach(([label, value], index) => {
        const labelX = 60;
        const valueX = 200;
        const yPos = y + index * rowSpacing;

        doc.font('Helvetica-Bold').fontSize(12).fillColor('#7d6608').text(`${label}:`, labelX, yPos);
        doc.font('Helvetica').fontSize(12).fillColor('#1b2631').text(value || 'N/A', valueX, yPos);
      });

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
