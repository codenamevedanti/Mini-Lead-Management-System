export default function Pagination({ page, total, limit, onPageChange }) {
    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) return null;
  
    const pages = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      pages.push(i);
    }
  
    return (
      <nav>
        <ul className="pagination justify-content-center mb-0">
          <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(page - 1)}>
              <i className="bi bi-chevron-left" />
            </button>
          </li>
          {pages[0] > 1 && (
            <>
              <li className="page-item"><button className="page-link" onClick={() => onPageChange(1)}>1</button></li>
              {pages[0] > 2 && <li className="page-item disabled"><span className="page-link">…</span></li>}
            </>
          )}
          {pages.map((p) => (
            <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
              <button className="page-link" onClick={() => onPageChange(p)}>{p}</button>
            </li>
          ))}
          {pages[pages.length - 1] < totalPages && (
            <>
              {pages[pages.length - 1] < totalPages - 1 && <li className="page-item disabled"><span className="page-link">…</span></li>}
              <li className="page-item"><button className="page-link" onClick={() => onPageChange(totalPages)}>{totalPages}</button></li>
            </>
          )}
          <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(page + 1)}>
              <i className="bi bi-chevron-right" />
            </button>
          </li>
        </ul>
      </nav>
    );
  }