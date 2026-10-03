"use client";

import { useState, FormEvent } from "react";

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  headcount: string;
  interest: string;
  trigger: string;
  heardFrom: string;
  message: string;
}

const emptyForm: FormData = {
  name: "",
  email: "",
  phone: "",
  company: "",
  role: "",
  headcount: "",
  interest: "",
  trigger: "",
  heardFrom: "",
  message: "",
};

const fieldClass =
  "w-full rounded-md border border-[#e4ddd2] bg-paper px-3 py-2 text-ink shadow-sm focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine";

export default function ContactForm({ interest }: { interest?: string | null }) {
  const [formData, setFormData] = useState<FormData>({
    ...emptyForm,
    interest: interest || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: "success",
          message: "Received. You will get a reply within one business day.",
        });
        setFormData({ ...emptyForm, interest: interest || "" });
      } else {
        setSubmitStatus({
          type: "error",
          message: data.error || "Something went wrong. Please try again.",
        });
      }
    } catch {
      setSubmitStatus({
        type: "error",
        message: "Failed to send message. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" id="name">
          <input id="name" name="name" required value={formData.name} onChange={handleChange} className={fieldClass} />
        </Field>
        <Field label="Email" id="email">
          <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className={fieldClass} />
        </Field>
        <Field label="Phone" id="phone">
          <input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange} className={fieldClass} />
        </Field>
        <Field label="Company" id="company">
          <input id="company" name="company" required value={formData.company} onChange={handleChange} className={fieldClass} />
        </Field>
        <Field label="Your role" id="role">
          <input id="role" name="role" required value={formData.role} onChange={handleChange} className={fieldClass} placeholder="Owner, CEO, COO, CFO" />
        </Field>
        <Field label="Rough headcount" id="headcount">
          <select id="headcount" name="headcount" required value={formData.headcount} onChange={handleChange} className={fieldClass}>
            <option value="">Select</option>
            <option value="Under 15">Under 15</option>
            <option value="15 to 24">15 to 24</option>
            <option value="25 to 200">25 to 200</option>
            <option value="Over 200">Over 200</option>
          </select>
        </Field>
        <Field label="What you want" id="interest">
          <select id="interest" name="interest" required value={formData.interest} onChange={handleChange} className={fieldClass}>
            <option value="">Select</option>
            <option value="Discovery call">A 30-minute discovery call</option>
            <option value="Assessment">An assessment</option>
            <option value="Separate service">A separate service</option>
            <option value="Plan">A monthly plan</option>
            <option value="Partner introduction">I am introducing someone</option>
            <option value="Something else">Something else</option>
          </select>
        </Field>
        <Field label="What prompted this" id="trigger">
          <select id="trigger" name="trigger" required value={formData.trigger} onChange={handleChange} className={fieldClass}>
            <option value="">Select</option>
            <option value="Cyber insurance or questionnaire">Cyber insurance or a security questionnaire</option>
            <option value="Compliance">A compliance demand</option>
            <option value="Stalled project">A stalled project</option>
            <option value="IT provider or manager">IT provider or an IT manager leaving</option>
            <option value="Growth or acquisition">Growth, a new location, or an acquisition</option>
            <option value="AI">Pressure to do something with AI</option>
            <option value="Referral partner">I advise this company</option>
            <option value="Not sure">Not sure yet</option>
          </select>
        </Field>
      </div>
      <Field label="How you heard about Talon Software" id="heardFrom">
        <select id="heardFrom" name="heardFrom" required value={formData.heardFrom} onChange={handleChange} className={fieldClass}>
          <option value="">Select</option>
          <option value="Referral">Someone referred me</option>
          <option value="Accountant, CFO, attorney, broker, or banker">Accountant, CFO, attorney, broker, or banker</option>
          <option value="Local event">A local event or talk</option>
          <option value="Search">Search</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Other">Other</option>
        </select>
      </Field>
      <Field label="What is going on" id="message">
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          value={formData.message}
          onChange={handleChange}
          className={fieldClass}
        />
      </Field>
      {submitStatus.type && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            submitStatus.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {submitStatus.message}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-ink disabled:opacity-60"
      >
        {isSubmitting ? "Sending..." : "Request a call"}
      </button>
    </form>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink/80">
        {label}
      </label>
      {children}
    </div>
  );
}
