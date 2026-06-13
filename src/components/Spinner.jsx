export default function Spinner({ size = 'md', centered = false }) {
    const cls = `spinner-border text-primary spinner-border-${size === 'sm' ? 'sm' : ''}`;
    if (centered) {
      return (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className={cls} role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      );
    }
    return <div className={cls} role="status"><span className="visually-hidden">Loading…</span></div>;
  }