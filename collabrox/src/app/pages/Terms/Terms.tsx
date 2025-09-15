import ComponentWrapper from "../../common/ComponentWrapper";
import Typography from "../../common/Typography";

const Terms = () => {
  return (
    <ComponentWrapper className="container px-2 sm:px-8 md:px-10 lg:px-20 xl:px-32 py-5" tabIndex={-1}>
      <Typography id="termsHeadling" variant="subheading" className="mb-6 lg:mb-5 text-center">Terms & Conditions</Typography>

      <article aria-atomic="true">
        <section aria-labelledby="privacy-policy">
          <Typography id="privacy-policy" variant="title" tag="p">Privacy Policy</Typography>
          <Typography variant="subtitle">
            This Privacy Policy explains how we collect, use, and disclose information about you when you use our website (collectively, the "Service").
          </Typography>
        </section>
        <div aria-hidden="true" className="my-8" />

        <section aria-labelledby="info-collect">
          <Typography id="info-collect" variant="title" tag="p">Information We Collect</Typography>
          <Typography variant="subtitle">
            We collect information you provide directly to us, such as when you create or modify your account, create a person, participate in community discussions, or contact customer support. This information may include your name, email address, profile picture, and any other information you choose to provide.
          </Typography>
          <Typography variant="subtitle">
            We also collect information automatically when you use the Service, such as your <abbr title="Internet Protocol">IP</abbr> address, device information, and usage information.
          </Typography>
        </section>
        <div aria-hidden="true" className="my-8" />

        <section aria-labelledby="how-we-use">
          <Typography id="how-we-use" variant="title" tag="p">How We Use Your Information</Typography>
          <Typography variant="subtitle">
            We use the information we collect to provide, maintain, and improve the Service, to communicate with you, to monitor and analyze trends and usage, and to personalize your experience.
          </Typography>
        </section>
        <div aria-hidden="true" className="my-8" />

        <section aria-labelledby="security">
          <Typography id="security" variant="title" tag="p">Security</Typography>
          <Typography variant="subtitle">
            We take reasonable measures to help protect your information from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.
          </Typography>
        </section>
        <div aria-hidden="true" className="my-8" />

        <section aria-labelledby="sharing-info">
          <Typography id="sharing-info" variant="title" tag="p">Sharing of Your Information</Typography>
          <Typography variant="subtitle">
            We may share your information with third-party service providers who need access to your information to carry out work on our behalf, such as hosting providers, analytics providers, and customer service providers. Your very personal information, such as passwords and other security details, will remain private. Currently, we only share your email with a service to send you important updates.
          </Typography>
        </section>
        <div aria-hidden="true" className="my-8" />

        <section aria-labelledby="changes-policy">
          <Typography id="changes-policy" variant="title" tag="p">Changes to This Privacy Policy</Typography>
          <Typography variant="subtitle">
            We may update this Privacy Policy from time to time. If we make any material changes, we will notify you by posting the new Privacy Policy on this page.
          </Typography>
        </section>
        <div aria-hidden="true" className="my-8" />

        <section aria-labelledby="contact">
          <Typography id="contact" variant="title" tag="p">Contact Us</Typography>
          <Typography variant="subtitle">
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:contact.codewithmafuz@gmail.com" aria-label="Email us at contact.codewithmafuz@gmail.com" className="hover:text-primary-base">contact.codewithmafuz@gmail.com</a>
          </Typography>
        </section>
        <div aria-hidden="true" className="my-8" />
      </article>

      {/* Hidden element to stop screen reader */}
      <div aria-hidden="true" tabIndex={-1} />
    </ComponentWrapper>
  );
};

export default Terms;
