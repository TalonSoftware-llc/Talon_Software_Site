import { NextRequest, NextResponse } from "next/server";

import sgMail from "@sendgrid/mail";

const PUBLIC_CONTACT_EMAIL = "contact@talonsoftware.dev";

// Only log warning in development, not in production
if (!process.env.SENDGRID_API_KEY && process.env.NODE_ENV !== "production") {
  console.warn("SENDGRID_API_KEY is not set");
}

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function POST(request: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    company?: string;
    role?: string;
    headcount?: string;
    interest?: string;
    trigger?: string;
    heardFrom?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const {
      name,
      email,
      phone,
      message,
      company,
      role,
      headcount,
      interest,
      trigger,
      heardFrom,
    } = body;

    if (
      !name ||
      !email ||
      !phone ||
      !message ||
      !company ||
      !role ||
      !headcount ||
      !interest ||
      !trigger ||
      !heardFrom
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate phone format (basic validation - allows various formats)
    const phoneRegex = /^[\d\s\(\)\-\+\.]+$/;
    if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Recipient shown in the mailto fallback. Same address the route already used.
    const toEmail = process.env.CONTACT_EMAIL || PUBLIC_CONTACT_EMAIL;

    // Check if SendGrid is configured. Do not report success when nothing was sent.
    if (!process.env.SENDGRID_API_KEY) {
      // Don't log in production to avoid exposing configuration state
      if (process.env.NODE_ENV !== "production") {
        console.error("SENDGRID_API_KEY is not configured");
      }
      return mailNotSent(toEmail);
    }

    // Prepare email
    const escape = (value: string) =>
      String(value).replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const details = [
      ["Name", name],
      ["Email", email],
      ["Phone", phone],
      ["Company", company],
      ["Role", role],
      ["Headcount", headcount],
      ["Interest", interest],
      ["Trigger", trigger],
      ["Heard from", heardFrom],
    ] as const;

    const text = [
      ...details.map(([label, value]) => `${label}: ${value}`),
      "",
      "Message:",
      message,
    ].join("\n");

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Discovery request</h2>
          ${details
            .map(
              ([label, value]) =>
                `<p><strong>${label}:</strong> ${escape(value)}</p>`
            )
            .join("")}
          <h3 style="color: #333; margin-top: 20px;">Message</h3>
          <p style="white-space: pre-wrap;">${escape(message)}</p>
        </div>
      `;

    const msg = {
      to: toEmail,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@talonsoftware.dev",
      replyTo: email,
      subject: `Discovery request from ${name} (${company})`,
      text,
      html,
    };

    try {
      await sgMail.send(msg);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error sending email:", errorMessage);
      return mailNotSent(toEmail);
    }

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending email:", errorMessage);
    return mailNotSent(process.env.CONTACT_EMAIL || PUBLIC_CONTACT_EMAIL);
  }
}

function mailNotSent(contactEmail: string) {
  return NextResponse.json(
    {
      error: "We could not send your message from the site.",
      contactEmail,
    },
    { status: 503 }
  );
}
