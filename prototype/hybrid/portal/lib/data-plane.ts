export type Principal = {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  role: string;
  email: string;
  displayName: string;
};

export type Ticket = {
  id: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  requesterId: string;
  respondDueAt: string;
  resolveDueAt: string;
  createdAt: string;
  updatedAt: string;
  slaStatus: string;
};

export async function dataPlane(path: string, token: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${token}`);
  if (init?.body) headers.set("content-type", "application/json");
  const origin = process.env.DATA_PLANE_ORIGIN;
  if (!origin) throw new Error("DATA_PLANE_ORIGIN is required");
  const response = await fetch(new URL(path, origin), {
    ...init,
    headers,
    cache: "no-store",
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}
