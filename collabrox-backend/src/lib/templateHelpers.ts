import { getEmailConfirmationTemplate, sendMail } from "config/nodemailerConfig.js"
import { isValidEmailAddress } from "./customValidators.js"
import { generateToken } from "./tokenHelpers.js"


/**
 * @description
 * Utility function to create a standardized response template.
 *
 * @param isSuccess - Indicates whether the operation was successful.
 * @param message - A custom message to include in the response. If null, a default message ("Successful" or "Failed") is used.
 * @param Optional data to include in the response.
 *
 * @returns A standardized response object with 'status', 'message', and 'data' properties.
 */
export default function sendTemplate(isSuccess: boolean, message: string | null = null, data: any[] | Object | null = null) {
    return {
        status: isSuccess ? "OK" : "Failed",
        message: message ? message : isSuccess ? "Successful" : "Internal server error",
        data
    }
}

/**
 * @param email - The recipient's email address.
 * @param subject - The subject of the email.
 * @param userId - The ID of the user for whom the email is being sent.
 * @param link - The URL link for verification or action.
 * @param linkTitle - The title of the link to display.
 * @param nameOrUsername - The recipient's name or username for personalization.
 * @param reasonToUseLink - The reason for using the link (e.g., "Verify your email").
 * @param fromBrandName - The name of the sending brand.
 * @param expiresIn - The expiration time for the link in minutes (default is 10 minutes).
 * @param ifUserDidNotRequested - Message to display if the user did not request the action (default is "If you did not requested for this, please ignore this email").
 * @param extraHTML - Additional HTML content to include in the email (default is an empty string).
 * @param onSuccessfullySent - Callback function to execute after the email is successfully sent (default is an empty function).
 * @returns A promise that resolves to an object indicating whether the email was sent successfully.
 */
async function sendEmailConfirmation({
    email,
    subject,
    userId,
    link,
    linkTitle,
    nameOrUsername,
    reasonToUseLink,
    fromBrandName,
    expiresIn = '15M',
    ifUserDidNotRequested = "If you did not requested for this, please ignore this email",
    extraHTML = "",
    onSuccessfullySent = async () => { },
}: {
    email: string;
    subject: string;
    userId: string;
    link: string;
    linkTitle: string;
    nameOrUsername: string;
    reasonToUseLink: string;
    fromBrandName: string;
    expiresIn?: string;
    ifUserDidNotRequested?: string;
    extraHTML?: string;
    onSuccessfullySent?: () => Promise<void>;
}) {
    try {
        // Validating the email address format before proceeding
        if (email && isValidEmailAddress(email)) {
            // Generating a JWT token for secure link verification
            const token = generateToken({ userId, purpose: 'email-verification' }, expiresIn)
            console.log({ token, userId })
            // Generating the finalized link as linkWithToken, by replacing or appending the token
            const linkWithToken = link.includes('@REPLACE_TOKEN')
                ? link.replace('@REPLACE_TOKEN', token) // Replace placeholder if present
                : link + token; // Append the token otherwise

            // Sending the email using the provided template and details
            const info = await sendMail(
                email,
                subject,
                getEmailConfirmationTemplate(
                    linkWithToken,
                    linkTitle,
                    nameOrUsername,
                    reasonToUseLink,
                    fromBrandName,
                    ifUserDidNotRequested,
                    extraHTML
                )
            );

            // Check if the email was successfully sent
            if (info && info.accepted.length > 0) {
                // Update the user's email link expiration time in the database
                await onSuccessfullySent()

                console.log(`> - Sent Email :`, info, { token, userId })
                return { isSuccess: true };
            } else {
                // Return a failure response if email sending failed
                console.log(`X - Sent Email Failed :`, info)
                return { isSuccess: false };
            }

        }
        console.log(`X - Sent Email Failed : Invalid Email`)
        return { isSuccess: false };
    } catch (error) {
        console.error(error);

        // Return a failure response due to an unexpected error
        return { isSuccess: false };
    }
};




export {
    sendEmailConfirmation,
}