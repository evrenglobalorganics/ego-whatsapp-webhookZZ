# EGO WhatsApp Webhook

Auto-reply bot for Evren Global Organics' WhatsApp number, built for Twilio.

## What it does
- Greets new chats with a menu (Get Quote / TDS / COA / Talk to team)
- Captures RFQ details and pings you (the owner) on WhatsApp when a lead comes in
- Sends your TDS/COA PDFs automatically when requested

## Deploy on Render (free, ~10 minutes)

1. **Push this folder to GitHub**
   - Create a new repo (e.g. `ego-whatsapp-webhook`), upload `index.js`, `package.json`, this `README.md`.

2. **Create a Render account** at render.com (free tier is fine to start).

3. **New Web Service**
   - Render dashboard → "New +" → "Web Service" → connect your GitHub repo.
   - Build command: `npm install`
   - Start command: `npm start`
   - Instance type: Free

4. **Add environment variables** (Render dashboard → your service → Environment):
   | Key | Value |
   |---|---|
   | `TWILIO_ACCOUNT_SID` | from Twilio Console (top of dashboard) |
   | `TWILIO_AUTH_TOKEN` | from Twilio Console → Account → API keys & tokens |
   | `EGO_WHATSAPP_NUMBER` | `whatsapp:+918015686101` |
   | `OWNER_WHATSAPP_NUMBER` | `whatsapp:+91XXXXXXXXXX` (your personal WhatsApp, to receive lead alerts — **must first message the EGO sandbox/number once if still in test mode**) |
   | `TDS_URL` | a public URL to your TDS PDF (e.g. hosted on your website) |
   | `COA_URL` | a public URL to a sample COA PDF |

5. **Deploy** — Render will give you a URL like `https://ego-whatsapp-webhook.onrender.com`.

6. **Set the webhook in Twilio**
   - Twilio Console → Messaging → Services → your Messaging Service → **Settings** tab
   - Under "Inbound messages" select **"Send a webhook"**
   - Paste: `https://ego-whatsapp-webhook.onrender.com/webhook`
   - Method: HTTP POST
   - Save

7. **Test it** — send "Hi" to your EGO WhatsApp number from your phone. You should get the menu back.

## Notes
- Free Render services sleep after inactivity and take ~30s to wake on the first message — fine for low volume, upgrade to a paid instance ($7/mo) once you have real order flow.
- Session memory resets on redeploy/restart. For production-grade lead tracking, this should later log to a real database or your CRM instead of in-memory storage.
- TDS_URL / COA_URL must be publicly accessible links (not Google Drive private links) — host them on your website (evrenglobalorganics.com) or a public storage bucket.
