interface ProtectedItemsListProps {
  counts: Record<string, number>;
}

export function ProtectedItemsList({ counts }: ProtectedItemsListProps) {
  return (
    <ul>
      {Object.entries(counts)
        .filter(([, count]) => count > 0)
        .map(([key, count]) => (
          <li key={key}>
            {key.replaceAll("_", " ")}: {count}
          </li>
        ))}
    </ul>
  );
}
