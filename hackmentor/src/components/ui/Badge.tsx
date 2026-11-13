export function Badge({
  children,
  tone = "",
}: {
  children: string;
  tone?: string;
}) {
  return <span className={`badge ${tone}`.trim()}>{children.replaceAll("_", " ")}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={status.toLowerCase()}>{status.replaceAll("_", " ")}</Badge>;
}
