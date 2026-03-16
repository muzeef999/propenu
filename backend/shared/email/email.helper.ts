import { sendEmail } from "./email.service";
import { listingSubmittedTemplate } from "./email.templates";

export const sendListingSubmittedEmail = async (
  email: string,
  name: string,
  property: string,
  location: string,
  link: string
) => {

  const html = listingSubmittedTemplate(name, property, location, link);

  return sendEmail(
    email,
    "Listing Submitted Successfully",
    html
  );
};