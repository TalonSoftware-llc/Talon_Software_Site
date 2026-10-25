export function roleLabel(role: string) {
  if (role === "essentials") return "Essentials";
  if (role === "pro") return "Pro";
  return role;
}

export function statusLabel(status: string) {
  if (status === "in_progress") return "In progress";
  if (status === "open") return "Open";
  if (status === "waiting") return "Waiting";
  if (status === "resolved") return "Resolved";
  return status;
}

export function slaLabel(status: string) {
  if (status === "within_sla") return "Within SLA";
  if (status === "response_breached") return "Response overdue";
  if (status === "resolve_breached") return "Resolve overdue";
  if (status === "met") return "Met";
  return status;
}
