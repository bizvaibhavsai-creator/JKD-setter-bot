import { buildHealthResponse } from "../src/http/health.js";

export default async function handler(_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  return res.status(200).json(buildHealthResponse());
}
