import { Form } from "react-bootstrap";
import { Pagination as BSPagination } from "react-bootstrap";
import { useTranslation } from "react-i18next";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function Pagination({ count, currentPage, onPageChange, pageSize = 10, onPageSizeChange }) {
  const { t } = useTranslation();
  const totalPages = Math.ceil(count / pageSize);

  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 gap-2">
      {/* Page size selector */}
      <div className="d-flex align-items-center gap-2">
        <span className="text-muted small">{t("components.pagination.rows_per_page")}</span>
        <Form.Select
          size="sm"
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange?.(Number(e.target.value));
            onPageChange(1);
          }}
          style={{ width: "auto" }}
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Form.Select>
      </div>

      {/* Page navigation */}
      {totalPages > 1 && (
        <BSPagination className="mb-0">
          <BSPagination.First
            disabled={currentPage === 1}
            onClick={() => onPageChange(1)}
          />
          <BSPagination.Prev
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          />
          {start > 1 && <BSPagination.Ellipsis disabled />}
          {pages.map((p) => (
            <BSPagination.Item
              key={p}
              active={p === currentPage}
              onClick={() => onPageChange(p)}
            >
              {p}
            </BSPagination.Item>
          ))}
          {end < totalPages && <BSPagination.Ellipsis disabled />}
          <BSPagination.Next
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          />
          <BSPagination.Last
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
          />
        </BSPagination>
      )}

      {/* Count info */}
      <span className="text-muted small">
        {count} {t("components.pagination.total")}
      </span>
    </div>
  );
}
