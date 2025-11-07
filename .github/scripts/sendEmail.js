const fs = require('fs');
const path = require('path');
const sgMail = require('@sendgrid/mail');

// Set API key from GitHub secret
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Define file path
const reportPath = path.resolve('reports', 'mocha-report.html');

// Check if report exists
if (!fs.existsSync(reportPath)) {
  console.error('No report file found to attach.');
  process.exit(1);
}

const email = {
  to: process.env.TO_EMAIL, // Your email
  from: {
    email: process.env.FROM_EMAIL,
    name: 'SQA CI Bot'
  },
  subject: 'Test Run Failed: Mocha Report Attached',
  text: 'One or more tests have failed. See the attached Mocha test report for details.',
  attachments: [
    {
      content: fs.readFileSync(reportPath).toString('base64'),
      filename: 'mocha-report.html',
      type: 'text/html',
      disposition: 'attachment'
    }
  ]
};

// Send the email
sgMail
  .send(email)
  .then(() => console.log('Failure email sent successfully.'))
  .catch(err => {
    console.error('Failed to send email:', err);
    process.exit(1);
  });
