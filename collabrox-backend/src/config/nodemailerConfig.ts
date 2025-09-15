import nodemailer from 'nodemailer'
import { MailOptions } from 'nodemailer/lib/json-transport/index.js';
import { EMAIL_APP_PASS, EMAIL_FROM, EMAIL_HOST, EMAIL_PORT, EMAIL_USER } from '../constants/envVars.js'

// Configure the email transporter for SMTP using environment variables
const transporter = nodemailer.createTransport({
    host: EMAIL_HOST, // SMTP host
    port: Number(EMAIL_PORT), // Ensure this is a number
    secure: false, // Set to `true` for SSL (SMTPs) connections
    auth: {
        user: EMAIL_USER, // SMTP authentication username
        pass: EMAIL_APP_PASS // SMTP authentication password or app-specific password
    }
} as MailOptions);

/**
 * Sends an email to a recipient.
 * 
 * @param to - The recipient's email address.
 * @param subject - The subject of the email.
 * @param html - The HTML content of the email.
 * @returns Returns information about the sent email if successful, or `false` if it fails.
 * 
 * @example
 * sendMail('example@example.com', 'Welcome', '<h1>Welcome to Our Service!</h1>')
 */
async function sendMail(to: string, subject: string, html: string) {
    try {
        // Send an email using the configured transporter
        const info = await transporter.sendMail({
            from: EMAIL_FROM, // Sender's email
            to, // Recipient's email
            subject, // Email subject
            html // Email content as HTML
        });
        return info; // Return the email info object on success
    } catch (error) {
        console.error("Error sending email:", error); // Log error to console
        return false; // Return `false` if sending email fails
    }
}


/**
 * Generates a styled email template with a clickable link for verification.
 * 
 * @param {string} link - The URL link for verification or action.
 * @param {string} linkTitle - The title of the link to display.
 * @param {string} nameOrUsername - The recipient's name or username for personalization.
 * @param {string} [fromBrandName="Our Company Name"] - The name of the sending brand.
 * @returns {string} - The complete email HTML template.
 */
function getVerificationLinkTemplate(
    link: string,
    linkTitle: string,
    nameOrUsername: string,
    fromBrandName: string = 'Our Company Name'
): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${linkTitle}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          h2 {
            color: #333333;
          }
          p {
            font-size: 16px;
            color: #555555;
            line-height: 1.5;
          }
          .link {
            display: inline-block;
            margin-top: 10px;
            padding: 10px 20px;
            background-color: rgb(102, 6, 170);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 4px;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #888888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>${linkTitle}</h2>
          <p>Hello, <strong>${nameOrUsername}</strong>,</p>
          <p>We received a request for this action. Click the button below to proceed:</p>
          <p><a class="link" href="${link}" target="_blank">${linkTitle}</a></p>
          <p><strong>If you did not request this, please ignore this email.</strong></p>
          <div class="footer">
            <p>Thank you,<br>${fromBrandName}</p>
          </div>
        </div>
      </body>
      </html>
    `;
}


/**
 * Generates a styled email template for email confirmation with a clickable link.
 * 
 * @param {string} link - The URL for confirmation or verification.
 * @param {string} linkTitle - The title of the confirmation action.
 * @param {string} nameOrUsername - The recipient's name or username for personalization.
 * @param {string} [reasonToUseLink="You just tried to create an account, please click the link to verify"] - Reason for sending the confirmation link.
 * @param {string} [fromBrandName="Our Company Name"] - The name of the sending brand.
 * @param {string} [ifUserDidNot="<p>If you did not requested for this email confirmation, <b>then please ignore this email</b></p>"] - Note for users who did not request the email.
 * @param {string} [extraHTML=""] - Additional HTML content to append to the email.
 * @returns {string} - The complete email HTML template.
 */
function getEmailConfirmationTemplate(link: string, linkTitle: string, nameOrUsername: string, reasonToUseLink: string = "You just tried to create an account, please click the link to verify", fromBrandName = 'Our Company Name', ifUserDidNot = "<p>If you did not requested for this email confirmation, <b>then please ignore this email</b></p>", extraHTML = '') {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${linkTitle}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        h2 {
          color: #333333;
        }
        p {
          font-size: 16px;
          color: #555555;
          line-height: 1.5;
        }
        .link {
          display: inline-block;
          margin-top: 10px;
          padding: 10px 20px;
          background-color:rgb(102, 6, 170);
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 4px;
          transition: background-color .300;
        }
        .link:hover {
            text-decoration: underline;
            background-color:rgb(77, 4, 129);
        }
        .footer {
          margin-top: 30px;
          font-size: 14px;
          color: #888888;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>${linkTitle}</h2>
        <p>Hello, <strong>${nameOrUsername}</strong>,</p>
        <p>${reasonToUseLink}</p>
        <p><a class="link" href="${link}" target="_blank">${linkTitle}</a></p>
        ${ifUserDidNot}
        ${extraHTML}
        <div class="footer">
          <p>Thank you,<br>${fromBrandName}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export { sendMail, getVerificationLinkTemplate, getEmailConfirmationTemplate }
export default transporter;
