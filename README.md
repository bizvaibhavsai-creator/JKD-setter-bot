# JKD Setter Agent

Webhook-driven AI agent for Instantly replies. It:

- receives `reply_received` webhooks from Instantly
- classifies the reply with OpenAI
- drafts a response using your playbook
- sends the reply back through Instantly
- updates Google Sheets
- skips auto-send when confidence is low

## What you need

1. An Instantly API v2 key with at least these scopes:
   - `emails:create`
   - `webhooks:create`
   - `leads:update`
2. An OpenAI API key.
3. A Google service account with Editor access to:
   - your Google Sheet
   - your Google Doc, if you use Doc mode

## Google access

Share both assets with:

`clawbot-jkd-setter@workspace-automation-490022.iam.gserviceaccount.com`

## Sheet headers

Create these headers in row 1:

```text
lead_id
lead_email
campaign_name
email_account
email_id
thread_id
classification
sheet_status
confidence
reason
reply_subject
reply_body
last_reply_text
human_review_required
instantly_interest_value
reply_sent
sent_at
updated_at
unibox_url
```

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Health check:

```bash
curl http://localhost:3000/healthz
```

## Register the Instantly webhook

Set:

- `INSTANTLY_WEBHOOK_SECRET`
- your server public URL

Then run:

```bash
export PUBLIC_BASE_URL=https://your-domain.com
npm run register:webhook
```

That script creates a `reply_received` webhook targeting:

`https://your-domain.com/webhooks/instantly?token=YOUR_SECRET`

## Deploy on your VPS

```bash
cp .env.example .env
# fill in the values
docker compose up -d --build
```

Then put Nginx or Caddy in front of port `3000`.

## How it behaves

- `reply_received` is processed
- `auto_reply_received` is logged to Sheets but not answered
- replies below the confidence threshold are not sent automatically
- Instantly interest status is updated where applicable

## Playbook options

Use either:

1. `PLAYBOOK_SOURCE=local`
   Put the full playbook into [playbooks/response-handling.md](/Users/vaibhavsai/Downloads/JKD setter MVP/playbooks/response-handling.md)

2. `PLAYBOOK_SOURCE=google_doc`
   Set `GOOGLE_DOC_ID` and share the doc with the service account

Current shared doc ID:

`1rqmKTbzzRhsQx8K0_uTYWa7VDGWL4igzlS9C28XFY2E`

## Sources used while implementing

- [Instantly webhook events](https://developer.instantly.ai/guides/webhook-events)
- [Instantly reply endpoint](https://developer.instantly.ai/api/v2/email/replytoemail)
- [Instantly update lead status](https://developer.instantly.ai/api/v2/lead/updateleadintereststatus)
- [Instantly webhook creation](https://developer.instantly.ai/api/v2/webhook)
- [Google Workspace credentials guide](https://developers.google.com/workspace/guides/create-credentials)
