interface BlockDialogProps {
  reason: string;
}

export function BlockDialog({ reason }: BlockDialogProps) {
  return <p role="alert">{reason}</p>;
}
