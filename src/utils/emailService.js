/**
 * Email Service using Custom API
 * Sends emails via https://mailing.hgcradio.org/send-email
 */

const EMAIL_API_URL = 'https://mailing.hgcradio.org/send-email';

/**
 * Send email using custom API
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - Email message (plain text)
 * @returns {Promise<boolean>} - Success status
 */
async function sendEmail(email, subject, message) {
  try {
    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        subject,
        message
      })
    });

    if (!response.ok) {
      throw new Error(`Email API returned status ${response.status}`);
    }

    console.log(`Email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send approval email to DJ user
 * @param {string} userEmail - DJ's email address
 * @param {string} userName - DJ's full name
 * @returns {Promise<boolean>} - Success status
 */
export async function sendApprovalEmail(userEmail, userName) {
  const subject = 'Congratulations! Your DJ Application Has Been Approved';
  
  const message = `Dear ${userName},

We are thrilled to inform you that your DJ application has been APPROVED!

Welcome to our team! You can now access all DJ features and start your journey with us.

Next Steps:
- Log in to your dashboard
- Explore the DJ features and tools
- Start uploading your content
- Schedule your shows

If you have any questions or need assistance, please don't hesitate to reach out to our support team.

We're excited to have you on board!

Best regards,
The Audio Stream Team

---
This is an automated message. Please do not reply to this email.`;

  return await sendEmail(userEmail, subject, message);
}

/**
 * Send disapproval email to DJ user with reason
 * @param {string} userEmail - DJ's email address
 * @param {string} userName - DJ's full name
 * @param {string} reason - Reason for disapproval
 * @returns {Promise<boolean>} - Success status
 */
export async function sendDisapprovalEmail(userEmail, userName, reason) {
  const subject = 'Update on Your DJ Application';
  
  const message = `Dear ${userName},

Thank you for your interest in joining our DJ team. After careful review of your application, we regret to inform you that we are unable to approve it at this time.

REASON FOR REJECTION:
${reason}

We encourage you to address the concerns mentioned above and reapply in the future. We appreciate your understanding and interest in our platform.

If you have any questions about this decision or would like more information, please feel free to contact our support team.

Thank you for your time and consideration.

Best regards,
The Audio Stream Team

---
This is an automated message. Please do not reply to this email.`;

  return await sendEmail(userEmail, subject, message);
}

