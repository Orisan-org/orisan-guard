interface GuardBadgeProps {
  status: string;
}

export function GuardBadge({ status }: GuardBadgeProps) {
  return <span className="badge">Guard: {status}</span>;
}
