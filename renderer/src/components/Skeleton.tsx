/** A calm placeholder while a screen loads: the layout shape is there, so nothing jumps when data arrives. */
export function Skeleton(props: { rows?: number }): React.JSX.Element {
  const widths = ['wide', 'mid', 'wide', 'short'] as const;
  return (
    <div className="panel" role="status" aria-label="Loading">
      <div className="skeleton short" style={{ height: 18 }} />
      {Array.from({ length: props.rows ?? 4 }, (_, i) => (
        <div key={i} className={`skeleton ${widths[i % widths.length]}`} />
      ))}
    </div>
  );
}
