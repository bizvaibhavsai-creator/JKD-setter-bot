export function buildHealthResponse() {
  return {
    ok: true,
    service: "jkd-setter-agent",
    now: new Date().toISOString()
  };
}
