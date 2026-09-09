const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

admin.initializeApp();

const { onCall, onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const crypto = require("crypto");

const db = admin.firestore();
const YOCO_SECRET_KEY = defineSecret("YOCO_SECRET_KEY");
const YOCO_WEBHOOK_SECRET = defineSecret("YOCO_WEBHOOK_SECRET");

function makeProgramSlug(name, dop) {
  const year = dop ? new Date(dop).getFullYear() : new Date().getFullYear();
  const base = String(name || "program")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 35) || "program";
  return `${base}-${year}-${Math.random().toString(36).slice(2, 6)}`;
}

async function uniqueProgramId(name, dop) {
  let programId = makeProgramSlug(name, dop);
  const existing = await db.collection("programs").doc(programId).get();
  if (existing.exists) programId = `${programId}-${Math.random().toString(36).slice(2, 6)}`;
  return programId;
}


exports.serveProgramMeta = functions.https.onRequest(async (req, res) => {
  const userAgent = req.get("User-Agent") || "";
  const isCrawler = /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Discordbot/i.test(userAgent);

  // req.path looks like /program/abc123
  const programId = req.path.split("/").filter(Boolean).pop();

  // ── Real visitor (not a crawler) — serve the normal SPA shell ──
  if (!isCrawler || !programId) {
    try {
      const indexPath = path.join(__dirname, "index.html"); // copied in during predeploy step
      let html = fs.readFileSync(indexPath, "utf8");

      // Recover if the function has an older shell than Firebase Hosting.
      if (html.includes('src="/src/main.tsx"')) {
        const origin = `${req.protocol}://${req.get("host")}`;
        const shellResponse = await fetch(`${origin}/index.html`, {
          headers: { "User-Agent": "HeartView-SPA-Shell" },
        });
        if (shellResponse.ok) html = await shellResponse.text();
      }

      res.set("Cache-Control", "no-store");
      return res.send(html);
    } catch (err) {
      console.error("Could not read SPA index.html:", err);
      return res.status(500).send("Error loading app");
    }
  }

  // ── Crawler (WhatsApp, Facebook, etc.) — serve static meta tags ──
  try {
    const doc = await admin.firestore().collection("programs").doc(programId).get();
    if (!doc.exists) return res.status(404).send("Not found");

    const program = doc.data();
    const title = `In memory of ${program.name} — HeartView`;
    const image = program.shareImageUrl || "https://heartview.co.za/default-share-image.jpg";
    const description = "View this memorial program on HeartView";
    const url = `https://heartview.co.za/program/${programId}`;

    res.set("Cache-Control", "public, max-age=300");
    return res.send(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/png" sizes="512x512" href="https://heartview.co.za/heartview-logo.png" />
    <link rel="shortcut icon" href="https://heartview.co.za/heartview-logo.png" />
    <link rel="apple-touch-icon" href="https://heartview.co.za/heartview-logo.png" />
    <title>${title}</title>
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body></body>
</html>`);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error");
  }
});

// ── Payments ─────────────────────────────────────────────────────────────

exports.createPendingPayment = onCall(async (req) => {
  if (!req.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in required to start a payment.");
  }
  const paymentId = crypto.randomUUID();
  await db.collection("payments").doc(paymentId).set({
    status: "pending",
    amountCents: 200, // R2.00 — fixed server-side, never trust a client-sent amount
    userId: req.auth.uid,
    programDraft: req.data.programDraft,
    createdAt: Date.now(),
  });
  return { paymentId };
});


exports.createYocoCheckout = onCall({ secrets: [YOCO_SECRET_KEY] }, async (req) => {
  if (!req.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in required to start a payment.");
  }
  const { paymentId } = req.data;
  const paymentRef = db.collection("payments").doc(paymentId);
  const snap = await paymentRef.get();
  const payment = snap.data();

  if (!payment) {
    throw new functions.https.HttpsError("not-found", "Payment not found.");
  }
  if (payment.userId !== req.auth.uid) {
    throw new functions.https.HttpsError("permission-denied", "Not authorized for this payment.");
  }

  const res = await fetch("https://payments.yoco.com/api/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${YOCO_SECRET_KEY.value()}`,
      "Content-Type": "application/json",
      "Idempotency-Key": paymentId,
    },
    body: JSON.stringify({
      amount: payment.amountCents,
      currency: "ZAR",
      successUrl: `https://heartview.co.za/payment/return?paymentId=${paymentId}`,
      cancelUrl: `https://heartview.co.za/payment/return?paymentId=${paymentId}&cancelled=1`,
      failureUrl: `https://heartview.co.za/payment/return?paymentId=${paymentId}&failed=1`,
      metadata: { paymentId },
    }),
  });

  if (!res.ok) {
    console.error("Yoco checkout creation failed:", await res.text());
    throw new functions.https.HttpsError("internal", "Could not start Yoco checkout.");
  }

  const checkout = await res.json();
  await paymentRef.update({ yocoCheckoutId: checkout.id });
  return { redirectUrl: checkout.redirectUrl };
});

function isValidYocoWebhookSignature(rawBody, headers, secret) {
  const signatureHeader = headers["webhook-signature"];
  const webhookId = headers["webhook-id"];
  const webhookTimestamp = headers["webhook-timestamp"];

  if (!signatureHeader || !webhookId || !webhookTimestamp || !secret) {
    return false;
  }

  // The secret is formatted as "whsec_<base64-bytes>". The HMAC key must be
  // the *decoded* bytes, not the raw "whsec_..." string.
  const secretBytes = Buffer.from(secret.split("_")[1], "base64");

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody.toString()}`;
  const expected = crypto.createHmac("sha256", secretBytes).update(signedContent).digest("base64");

  const candidates = signatureHeader
    .split(" ")
    .flatMap((part) => part.split(","))
    .map((value) => value.trim())
    .map((value) => value.replace(/^v1$/i, ""))
    .filter(Boolean);

  return candidates.some((sig) => {
    const sigBuf = Buffer.from(sig, "base64");
    const expBuf = Buffer.from(expected, "base64");
    return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
  });
}

exports.yocoWebhook = onRequest({ secrets: [YOCO_WEBHOOK_SECRET], rawBody: true }, async (req, res) => {
  const signatureHeader = req.headers["webhook-signature"];
  const webhookId = req.headers["webhook-id"];
  const webhookTimestamp = req.headers["webhook-timestamp"];

  if (!signatureHeader || !webhookId || !webhookTimestamp) {
    console.error("Missing webhook signature headers");
    return res.status(400).send("Missing signature headers");
  }

  const secret = YOCO_WEBHOOK_SECRET.value();
  const isValid = isValidYocoWebhookSignature(req.rawBody, req.headers, secret);

  if (!isValid) {
    console.error("Invalid webhook signature");
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;


  const checkoutId = event.payload?.metadata?.checkoutId;

  if (!checkoutId) {
    console.error("No checkoutId in webhook metadata");
    return res.sendStatus(200);
  }

  const paymentQuery = await db.collection("payments").where("yocoCheckoutId", "==", checkoutId).limit(1).get();

  if (paymentQuery.empty) {
    console.error("No payment found for checkoutId:", checkoutId);
    return res.sendStatus(200);
  }

  const paymentDoc = paymentQuery.docs[0];
  const paymentId = paymentDoc.id;
  const payment = paymentDoc.data();
  const paymentRef = paymentDoc.ref;

  if (event.type === "payment.succeeded") {
    if (payment.status !== "paid") await finalizePayment(paymentId, payment);
  } else if (event.type === "payment.failed") {
    await paymentRef.update({ status: "failed" }).catch(() => {});
  }
  res.sendStatus(200);
});

async function finalizePayment(paymentId, payment) {
  const paymentRef = db.collection("payments").doc(paymentId);
  const programId = await uniqueProgramId(payment.programDraft?.name, payment.programDraft?.dop);
  await db.runTransaction(async (tx) => {
    const fresh = await tx.get(paymentRef);
    if (fresh.data()?.status === "paid") return; // already done, no-op
    tx.set(db.collection("programs").doc(programId), {
      ...payment.programDraft,
      id: programId,
      createdAt: Date.now(),
      ...(payment.userId ? { userId: payment.userId } : {}),
    });
    tx.update(paymentRef, { status: "paid", programId });
  });
}
