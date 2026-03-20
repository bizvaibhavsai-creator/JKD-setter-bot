import "dotenv/config";
import express from "express";
import { config } from "./config.js";
import { buildHealthResponse } from "./http/health.js";
import { handleInstantlyWebhookRequest } from "./http/instantlyWebhook.js";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/healthz", (_req, res) => {
  res.json(buildHealthResponse());
});

app.post("/webhooks/instantly", async (req, res) => {
  const rawToken = req.query.token;
  const token =
    typeof rawToken === "string"
      ? rawToken
      : Array.isArray(rawToken) && typeof rawToken[0] === "string"
        ? rawToken[0]
        : undefined;
  const response = await handleInstantlyWebhookRequest({
    token,
    body: req.body
  });

  return res.status(response.status).json(response.body);
});

app.listen(config.PORT, () => {
  console.log(`JKD Setter Agent listening on port ${config.PORT}`);
});
