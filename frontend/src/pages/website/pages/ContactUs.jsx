import React, { useState } from "react";
import { useInputAnimation } from "../../../hooks/useInputAnimation";
import {
  BsPersonBoundingBox,
  MdEmail,
  FaPhoneFlip,
  PiSubtitlesBold,
  FaInbox,
} from "@icons"
import SelectInput from "../../../components/dashboard/components/SelectInput";
import {
  Header,
  AuthInput,
  AuthButton,
  Footer,
} from "@components";
import { useTranslation } from "react-i18next";
import { WorldMap } from "@/components/ui/map";
const faqData = [
  {
    question: "What is CraftLink?",
    answer:
      "CraftLink is a digital platform that connects skilled artisans with customers looking for trusted services such as carpentry, plumbing, electrical work, and more.",
  },
  {
    question: "How can I register as a craftsman?",
    answer:
      "You can create an account and choose 'Join as a Professional'. After completing your profile and verification process, you can start receiving job requests.",
  },
  {
    question: "Is CraftLink available in all cities?",
    answer:
      "Currently CraftLink is expanding across Egypt, starting with major cities and gradually covering more areas.",
  },
  {
    question: "How do customers find professionals?",
    answer:
      "Customers can search by service category, location, rating, and availability to find the best professional for their needs.",
  },
  {
    question: "How does the rating system work?",
    answer:
      "After completing a job, customers can rate and review the professional based on their experience.",
  },
  {
    question: "Is CraftLink free to use?",
    answer:
      "Creating an account and browsing services is free. Some premium features for professionals may require a subscription.",
  },
  {
    question: "How do I report a problem?",
    answer:
      "You can contact our support team through the contact form or email support@craftlink.com.",
  },
  {
    question: "How long does support take to respond?",
    answer:
      "Our support team usually responds within 24 hours during working days.",
  },
  {
    question: "Can I cancel a service request?",
    answer:
      "Yes, you can cancel a request before the professional confirms the booking.",
  },
  {
    question: "Where is CraftLink located?",
    answer: "Our main office is located in Mansoura, Dakahlia, Egypt.",
  },
];
export default function ContactUs() {
  const [activeIndex, setActiveIndex] = useState(null);
  const { i18n, t } = useTranslation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const { handleFocus, handleBlur } = useInputAnimation();
  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const leftFaq = faqData.slice(0, Math.ceil(faqData.length / 2));
  const rightFaq = faqData.slice(Math.ceil(faqData.length / 2));
  return (
    <>
      <div className="full-width">
        <Header />
      </div>
      <div className="contact-page">
        {/* HERO */}

        <section className="hero">
          <div className="hero-content">
            <h2>{t("Contact Us")}</h2>
          </div>
        </section>

        {/* CONTACT METHODS */}

        <section className="contact-methods">
          <div class="card">
            <div class="circle"></div>
            <div class="circle"></div>
            <div class="card-inner">
              <h3>{t("Customer Support")}</h3>
              <p>{t("Need help using the platform?")}</p>
              <span>support@craftlink.com</span>
            </div>
          </div>
          <div class="card">
            <div class="circle"></div>
            <div class="circle"></div>
            <div class="card-inner">
              <h3>{t("Technical Support")}</h3>
              <p>{t("Facing a technical issue?")}</p>
              <span>tech@craftlink.com</span>
            </div>
          </div>
          <div class="card">
            <div class="circle"></div>
            <div class="circle"></div>
            <div class="card-inner">
              <h3>{t("Business Partnerships")}</h3>
              <p>{t("Interested in collaboration?")}</p>
              <span>partners@craftlink.com</span>
            </div>
          </div>
          <div class="card">
            <div class="circle"></div>
            <div class="circle"></div>
            <div class="card-inner">
              <h3>{t("Media & Press")}</h3>
              <p>{t("Press or media inquiries.")}</p>
              <span>press@craftlink.com</span>
            </div>
          </div>
        </section>

        {/* CONTACT SECTION */}

        <section className="contact-section">
          {/* FORM */}

          <div className="contact-form">

            <form>
              <div className="form-row">
                <AuthInput
                  type="text"
                  label={t("First Name")}
                  Icon={BsPersonBoundingBox}
                  handleFocus={handleFocus}
                  handleBlur={handleBlur}
                  value={firstName}
                  onChange={setFirstName}
                />

                <AuthInput
                  type="text"
                  label={t("Last Name")}
                  Icon={BsPersonBoundingBox}
                  handleFocus={handleFocus}
                  handleBlur={handleBlur}
                  value={lastName}
                  onChange={setLastName}
                />
              </div>

              <div className="form-row">
                <AuthInput
                  type="email"
                  label={t("Email")}
                  Icon={MdEmail}
                  handleFocus={handleFocus}
                  handleBlur={handleBlur}
                  value={email}
                  onChange={setEmail}
                />
                <AuthInput
                  type="text"
                  label={t("Phone Number")}
                  Icon={FaPhoneFlip}
                  handleFocus={handleFocus}
                  handleBlur={handleBlur}
                  value={phone}
                  onChange={setPhone}
                />
              </div>


              <SelectInput
                label={t("Select Department")}
                options={[
                  t("Customer Support"),
                  t("Technical Issue"),
                  t("Business Partnership"),
                  t("General Inquiry")
                ]}
                value={department}
                onChange={setDepartment}
              />
              <AuthInput
                type="text"
                label={t("Subject")}
                Icon={PiSubtitlesBold}
                handleFocus={handleFocus}
                handleBlur={handleBlur}
                value={subject}
                onChange={setSubject}
              />
              <AuthInput
                textarea
                type="text"
                label={t("Write your message")}
                Icon={FaInbox}
                handleFocus={handleFocus}
                handleBlur={handleBlur}
                value={message}
                onChange={setMessage}
              />

              <AuthButton type="submit">
                {t("Send Message")}
              </AuthButton>
            </form>
          </div>

          {/* COMPANY INFO */}

          <div className="company-info">
            <h2>{t("Our Office")}</h2>

            <p>
              {t("CraftLink is a digital platform designed to empower artisans and help customers easily find trusted services. We aim to build a reliable ecosystem where skills meet opportunity.")}
            </p>

            <div className="info-item">
              <strong>{t("Address")}</strong>
              <p>{t("Mansoura, Dakahlia, Egypt")}</p>
            </div>

            <div className="info-item">
              <strong>{t("Phone")}</strong>
              <p>+20 101 763 5512</p>
            </div>

            <div className="info-item">
              <strong>{t("Email")}</strong>
              <p>contact@craftlink.com</p>
            </div>

            <div className="info-item">
              <strong>{t("Working Hours")}</strong>
              <p>{t("Sunday – Thursday")} / 9AM – 6PM</p>
            </div>
          </div>
        </section>

        {/* FAQ */}

        <section className="faq-section">
          <h2>{t("FAQ")}</h2>

          <div className="faq-container">

            <div className="faq-column">
              {leftFaq.map((faq, index) => (
                <div
                  key={index}
                  className={`faq-item ${activeIndex === index ? "active" : ""}`}
                >
                  <div
                    className="faq-question"
                    onClick={() => toggleFAQ(index)}
                  >
                    {t(faq.question)}
                    <span>{activeIndex === index ? "-" : "+"}</span>
                  </div>

                  <div className="faq-answer">
                    <p>{t(faq.answer)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="faq-column">
              {rightFaq.map((faq, index) => (
                <div
                  key={index + leftFaq.length}
                  className={`faq-item ${activeIndex === index + leftFaq.length ? "active" : ""}`}
                >
                  <div
                    className="faq-question"
                    onClick={() => toggleFAQ(index + leftFaq.length)}
                  >
                    {t(faq.question)}
                    <span>{activeIndex === index + leftFaq.length ? "-" : "+"}</span>
                  </div>

                  <div className="faq-answer">
                    <p>{t(faq.answer)}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* MAP */}

        <section className="map">
          <WorldMap
            dots={[
              {
                start: { lat: 64.2008, lng: -149.4937, label: "Fairbanks" },
                end: { lat: 34.0522, lng: -118.2437, label: "Los Angeles" },
              },
              {
                start: { lat: 64.2008, lng: -149.4937, label: "Fairbanks" },
                end: { lat: -15.7975, lng: -47.8919, label: "Brasília" },
              },
              {
                start: { lat: -15.7975, lng: -47.8919, label: "Brasília" },
                end: { lat: 38.7223, lng: -9.1393, label: "Lisbon" },
              },
              {
                start: { lat: 51.5074, lng: -0.1278, label: "London" },
                end: { lat: 28.6139, lng: 77.209, label: "New Delhi" },
              },
              {
                start: { lat: 28.6139, lng: 77.209, label: "New Delhi" },
                end: { lat: 43.1332, lng: 131.9113, label: "Vladivostok" },
              },
              {
                start: { lat: 28.6139, lng: 77.209, label: "New Delhi" },
                end: { lat: -1.2921, lng: 36.8219, label: "Nairobi" },
              },
            ]}
          />
        </section>

        {/* CTA */}

        <section className="cta">
          <h2>{t("Let’s Start a Conversation")}</h2>

          <p>
            {t("Whether you're a customer, artisan, or potential partner, we would love to hear from you.")}
          </p>

          <button class="button">
            <span>{t("Contact Support")}</span>
          </button>
        </section>
      </div>
      <Footer />
    </>
  );
}
