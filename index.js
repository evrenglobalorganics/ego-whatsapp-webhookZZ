// EGO WhatsApp Webhook — Evren Global Organics
// Handles inbound WhatsApp messages via Twilio and auto-replies with a menu.

const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const { MessagingResponse } = twilio.twiml;

// ---- Config (set these as environment variables on your host) ----
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;           // from Twilio Console
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;         // from Twilio Console
const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP_NUMBER;   // e.g. whatsapp:+918610154966 (Baskar's number to receive lead alerts)
const EGO_WHATSAPP = process.env.EGO_WHATSAPP_NUMBER;       // e.g. whatsapp:+918015686101 (your sender)
const TDS_URL = process.env.TDS_URL;                        // public link to your TDS PDF
const COA_URL = process.env.COA_URL;                        // public link to a sample COA PDF

const client = (ACCOUNT_SID && AUTH_TOKEN) ? twilio(ACCOUNT_SID, AUTH_TOKEN) : null;

// In-memory session store: { "whatsapp:+91...": { state: "menu" } }
// NOTE: this resets whenever the server restarts. Fine for testing;
// swap for a real database (e.g. a free Supabase/Postgres table) once you have real volume.
const sessions = {};

function menuText() {
  return (
    "🌿 *Evren Global Organics*\n" +
    "Moringa Leaf Powder — Export Quality\n\n" +
    "Reply with a number:\n" +
    "1️⃣ Get a Quote\n" +
    "2️⃣ Product Info (TDS)\n" +
    "3️⃣ Certificate of Analysis (COA)\n" +
    "4️⃣ Talk to our team\n"
  );
}

app.post('/webhook', async (req, res) => {
  // --- Verify the request really came from Twilio ---
  const twilioSignature = req.header('X-Twilio-Signature');
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const isValid = AUTH_TOKEN
    ? twilio.validateRequest(AUTH_TOKEN, twilioSignature, url, req.body)
    : true; // skip only if AUTH_TOKEN isn't set yet (e.g. first local test)

  if (!isValid) {
    console.warn('Invalid Twilio signature — rejecting request');
    return res.status(403).send('Forbidden');
  }

  const from = req.body.From;                 // e.g. "whatsapp:+91XXXXXXXXXX"
  const body = (req.body.Body || '').trim();
  const twiml = new MessagingResponse();

  const session = sessions[from] || { state: 'new' };

  if (/^(hi|hello|hey|menu|start)$/i.test(body) || session.state === 'new') {
    twiml.message(menuText());
    sessions[from] = { state: 'menu' };
  } else if (body === '1') {
    twiml.message(
      "Great! Please share:\n" +
      "• Product & pack size (e.g. 20kg bulk / 500g private label)\n" +
      "• Quantity needed\n" +
      "• Destination country\n\n" +
      "Our team will send a formal quotation shortly."
    );
    sessions[from] = { state: 'awaiting_quote_details' };
    await notifyOwner(`📩 New quote request from ${from}`);
  } else if (body === '2') {
    if (TDS_URL) {
      twiml.message('Here is our Technical Data Sheet:').media(TDS_URL);
    } else {
      twiml.message("Our TDS is being sent shortly — please hold on.");
    }
    twiml.message('Reply *menu* anytime to see options again.');
  } else if (body === '3') {
    if (COA_URL) {
      twiml.message('Here is a sample Certificate of Analysis:').media(COA_URL);
    } else {
      twiml.message("Our COA is being sent shortly — please hold on.");
    }
    twiml.message('Reply *menu* anytime to see options again.');
  } else if (body === '4') {
    twiml.message("Connecting you to our team — someone will reply here shortly.");
    await notifyOwner(`💬 Customer ${from} wants to talk to a person: "${body}"`);
  } else if (session.state === 'awaiting_quote_details') {
    twiml.message("Thank you! We've received your requirements and will send a quotation soon.");
    await notifyOwner(`📩 Quote details from ${from}:\n${body}`);
    sessions[from] = { state: 'menu' };
  } else {
    twiml.message("Sorry, I didn't get that. Reply *menu* to see options.");
  }

  res.type('text/xml').send(twiml.toString());
});

// Notify Baskar on his own WhatsApp when a lead comes in
async function notifyOwner(text) {
  if (!client || !OWNER_WHATSAPP || !EGO_WHATSAPP) return;
  try {
    await client.messages.create({
      from: EGO_WHATSAPP,
      to: OWNER_WHATSAPP,
      body: text,
    });
  } catch (err) {
    console.error('Failed to notify owner:', err.message);
  }
}

app.get('/', (req, res) => res.send('EGO WhatsApp webhook is running.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook listening on port ${PORT}`));
