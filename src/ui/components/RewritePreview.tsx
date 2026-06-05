interface RewritePreviewProps {
  value: string;
}

export function RewritePreview({ value }: RewritePreviewProps) {
  return <textarea readOnly value={value} />;
}
