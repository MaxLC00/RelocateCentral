import ContactForm from "../components/ContactForm.jsx";

export default function Contact() {
  return (
    <div>
      <div className="page-header">
        <h1>Contact the Building Team</h1>
        <p>
          Send a question or concern to the property team. We'll follow up
          using the contact details you provide.
        </p>
      </div>
      <ContactForm />
    </div>
  );
}
