import { handleInstantlyWebhookRequest } from "../../src/http/instantlyWebhook.js";

type VercelLikeRequest = {
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type VercelLikeResponse = {
  status: (code: number) => {
    json: (body: unknown) => void;
  };
};

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse) {
  const token = Array.isArray(req.query?.token) ? req.query?.token[0] : req.query?.token;
  const response = await handleInstantlyWebhookRequest({
    token,
    body: req.body
  });

  return res.status(response.status).json(response.body);
}
