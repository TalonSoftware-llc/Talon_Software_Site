import { NextRequest, NextResponse } from "next/server";

import sgMail from "@sendgrid/mail";

// Only log warning in development, not in production
if (!process.env.SENDGRID_API_KEY && process.env.NODE_ENV !== "production") {
  console.warn("SENDGRID_API_KEY is not set");
}

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      // Don't log in production to avoid exposing configuration state
      if (process.env.NODE_ENV !== "production") {
        console.error("SENDGRID_API_KEY is not configured");
      }
      return NextResponse.json(
        { error: "Email service is not configured" },
        { status: 500 }
      );
    }

    // Get recipient email from environment or use a default
    const toEmail = process.env.CONTACT_EMAIL || "contact@talonsoftware.com";

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
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@talonsoftware.com",
      replyTo: email,
      subject: `Discovery request from ${name} (${company})`,
      text,
      html,
    };

    // Send email via SendGrid
    await sgMail.send(msg);

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending email:", errorMessage);

    if (!error || typeof error !== "object" || !("response" in error)) {
      return NextResponse.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 }
      );
    }

    const { response } = error as {
      response?: { body?: { errors?: Array<{ message?: string }> } };
    };

    if (!response) {
      return NextResponse.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 }
      );
    }

    const errorBody = response.body;

    if (errorBody?.errors) {
      const firstError = errorBody.errors[0];
      const errorMsg = firstError?.message || "";

      if (errorMsg.includes("domain") || errorMsg.includes("authenticated")) {
        return NextResponse.json(
          {
            error:
              "Domain authentication issue. Please ensure your sender email is from a verified domain in SendGrid.",
          },
          { status: 500 }
        );
      }

      const safeErrorMessage =
        errorMsg.includes("API") || errorMsg.includes("key")
          ? "Failed to send email. Please check your SendGrid configuration."
          : errorMsg;

      return NextResponse.json(
        {
          error:
            safeErrorMessage ||
            "Failed to send email. Please check your SendGrid configuration.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send email. Please check your SendGrid configuration." },
      { status: 500 }
    );
  }
}
