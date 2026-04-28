const nodemailer = require("nodemailer");

const RECIPIENT_EMAIL = process.env.CONTACT_RECIPIENT_EMAIL || "julie.chu@ruirongbio.com";
const ALLOWED_ORIGIN = "https://www.ruirongbio.com";
const SMTP_HOST = String(process.env.SMTP_HOST || "smtp.feishu.cn").trim();
const SMTP_PORT = Number.parseInt(String(process.env.SMTP_PORT || ""), 10) || 465;
const SMTP_SECURE = String(process.env.SMTP_SECURE || (SMTP_PORT === 465 ? "true" : "false")).trim() === "true";
const SMTP_USER = String(process.env.SMTP_USER || RECIPIENT_EMAIL).trim();
const SMTP_PASS = String(process.env.SMTP_PASS || "").trim();
const SMTP_FROM = String(process.env.SMTP_FROM || SMTP_USER || RECIPIENT_EMAIL).trim();
const SMTP_FROM_NAME = String(process.env.SMTP_FROM_NAME || "Ruirong Bio Website").trim();

let transporterPromise = null;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function applyHeaders(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-RR-Dry-Run");
}

async function parseRequestBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (_error) {
      return {};
    }
  }

  if (Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString("utf8"));
    } catch (_error) {
      return {};
    }
  }

  let rawBody = "";
  for await (const chunk of req) {
    rawBody += chunk;
  }

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch (_error) {
    return {};
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasSmtpConfig() {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && SMTP_FROM);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getTransporter() {
  if (!hasSmtpConfig()) {
    return null;
  }

  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      })
    );
  }

  return transporterPromise;
}

function buildTextMessage(fields) {
  return [
    "New product inquiry",
    "",
    `Company name: ${fields.companyName}`,
    `Contact person: ${fields.contactPerson}`,
    `Phone / WhatsApp: ${fields.phone}`,
    `Email: ${fields.email}`,
    `Product interest: ${fields.productInterest || "-"}`,
    `Estimated quantity: ${fields.estimatedQuantity || "-"}`,
    `Destination country: ${fields.destinationCountry || "-"}`,
    `Application: ${fields.application || "-"}`,
    `Required documents: ${fields.requiredDocuments || "-"}`,
    "Message:",
    fields.message,
    "",
    `Submitted at: ${fields.submittedAt}`,
    `Page title: ${fields.pageTitle || "-"}`,
    `Page URL: ${fields.pageUrl || "-"}`,
    `User agent: ${fields.userAgent || "-"}`,
  ].join("\n");
}

function buildHtmlMessage(fields) {
  return [
    "<h2>New product inquiry</h2>",
    "<table cellpadding=\"8\" cellspacing=\"0\" border=\"1\" style=\"border-collapse:collapse;border:1px solid #d7d7d7;font-family:Arial,sans-serif;font-size:14px;\">",
    `<tr><th align="left">Company name</th><td>${escapeHtml(fields.companyName)}</td></tr>`,
    `<tr><th align="left">Contact person</th><td>${escapeHtml(fields.contactPerson)}</td></tr>`,
    `<tr><th align="left">Phone / WhatsApp</th><td>${escapeHtml(fields.phone)}</td></tr>`,
    `<tr><th align="left">Email</th><td>${escapeHtml(fields.email)}</td></tr>`,
    `<tr><th align="left">Product interest</th><td>${escapeHtml(fields.productInterest || "-")}</td></tr>`,
    `<tr><th align="left">Estimated quantity</th><td>${escapeHtml(fields.estimatedQuantity || "-")}</td></tr>`,
    `<tr><th align="left">Destination country</th><td>${escapeHtml(fields.destinationCountry || "-")}</td></tr>`,
    `<tr><th align="left">Application</th><td>${escapeHtml(fields.application || "-")}</td></tr>`,
    `<tr><th align="left">Required documents</th><td>${escapeHtml(fields.requiredDocuments || "-")}</td></tr>`,
    `<tr><th align="left">Message</th><td>${escapeHtml(fields.message).replace(/\r?\n/g, "<br>")}</td></tr>`,
    `<tr><th align="left">Submitted at</th><td>${escapeHtml(fields.submittedAt)}</td></tr>`,
    `<tr><th align="left">Page title</th><td>${escapeHtml(fields.pageTitle || "-")}</td></tr>`,
    `<tr><th align="left">Page URL</th><td>${escapeHtml(fields.pageUrl || "-")}</td></tr>`,
    `<tr><th align="left">User agent</th><td>${escapeHtml(fields.userAgent || "-")}</td></tr>`,
    "</table>",
  ].join("");
}

async function sendViaSmtp(fields) {
  const transporter = await getTransporter();

  if (!transporter) {
    return {
      ok: false,
      error: "SMTP is not configured on the server.",
      statusCode: 500,
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME.replace(/"/g, "")}" <${SMTP_FROM}>`,
      to: RECIPIENT_EMAIL,
      replyTo: fields.email,
      subject: `New product inquiry from ${fields.companyName} (${fields.contactPerson})`,
      text: buildTextMessage(fields),
      html: buildHtmlMessage(fields),
    });

    return {
      ok: true,
      messageId: info.messageId || "",
      accepted: Array.isArray(info.accepted) ? info.accepted : [],
      rejected: Array.isArray(info.rejected) ? info.rejected : [],
    };
  } catch (error) {
    return {
      ok: false,
      error: "SMTP delivery failed.",
      detail: error && error.message ? error.message : "",
      code: error && error.code ? error.code : "",
      statusCode: 502,
    };
  }
}

module.exports = async (req, res) => {
  applyHeaders(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, service: "contact-form" });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed." });
    return;
  }

  const body = await parseRequestBody(req);
  const companyName = String(body.companyName || "").trim();
  const contactPerson = String(body.contactPerson || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  const message = String(body.message || "").trim();
  const productInterest = String(body.productInterest || "").trim();
  const estimatedQuantity = String(body.estimatedQuantity || "").trim();
  const destinationCountry = String(body.destinationCountry || "").trim();
  const application = String(body.application || "").trim();
  const requiredDocuments = String(body.requiredDocuments || "").trim();
  const pageTitle = String(body.pageTitle || "").trim();
  const pageUrl = String(body.pageUrl || "").trim();
  const userAgent = String(req.headers["user-agent"] || "").trim();
  const dryRun = req.headers["x-rr-dry-run"] === "1";

  if (!companyName || !contactPerson || !phone || !email || !message) {
    sendJson(res, 400, {
      ok: false,
      error: "Company name, contact person, phone / WhatsApp, email and message are required.",
    });
    return;
  }

  if (!isValidEmail(email)) {
    sendJson(res, 400, { ok: false, error: "Email format is invalid." });
    return;
  }

  if (dryRun) {
    sendJson(res, 200, {
      ok: true,
      dryRun: true,
      transport: hasSmtpConfig() ? "smtp" : "unconfigured",
    });
    return;
  }

  const deliveryResult = await sendViaSmtp({
    companyName,
    contactPerson,
    phone,
    email,
    message,
    productInterest,
    estimatedQuantity,
    destinationCountry,
    application,
    requiredDocuments,
    pageTitle,
    pageUrl,
    userAgent,
    submittedAt: new Date().toISOString(),
  });

  if (!deliveryResult.ok) {
    sendJson(res, deliveryResult.statusCode || 502, {
      ok: false,
      error: deliveryResult.error || "Unable to send email.",
      code: deliveryResult.code || "",
    });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    transport: "smtp",
    messageId: deliveryResult.messageId,
    accepted: deliveryResult.accepted,
    rejected: deliveryResult.rejected,
  });
};
