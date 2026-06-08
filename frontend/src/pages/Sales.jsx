import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import toast from "react-hot-toast";

import { listProducts } from "../api/products";
import { listSales } from "../api/sales";
import Pagination from "../components/Pagination";
import SaleFormModal from "../components/SaleFormModal";
import { useCurrency } from "../context/CurrencyContext";
import { useTranslation } from "react-i18next";

export default function Sales() {
  const { format } = useCurrency();
  const { t } = useTranslation();
  const [sales, setSales] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const data = await listSales(params);
      setSales(data.results);
      setCount(data.count);
    } catch {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await listProducts({ page_size: 100 });
      setProducts(data.results || data);
    } catch {
      toast.error("Failed to load products");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, startDate, endDate]);

  const handleSaved = () => {
    setModalOpen(false);
    load();
    loadProducts(); // refresh stocks
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">{t("sales.title")}</h1>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          {t("sales.new_sale")}
        </Button>
      </div>

      <Card className="mb-3">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={4}>
              <Form.Label className="small mb-1">{t("sales.from_date")}</Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </Col>
            <Col md={4}>
              <Form.Label className="small mb-1">{t("sales.to_date")}</Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </Col>
            <Col md={4}>
              <Button
                variant="outline-secondary"
                onClick={clearFilters}
                disabled={!startDate && !endDate}
              >
                {t("sales.clear_filters")}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : sales.length === 0 ? (
        <Card body className="text-center text-muted">
          {t("sales.no_sales_yet")}
        </Card>
      ) : (
        <>
          <Card>
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>{t("sales.date")}</th>
                  <th>{t("sales.product")}</th>
                  <th className="text-end">{t("sales.qty")}</th>
                  <th className="text-end">{t("sales.unit_price")}</th>
                  <th className="text-end">{t("sales.total")}</th>
                  <th>{t("sales.customer")}</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td>{new Date(s.sold_at).toLocaleString()}</td>
                    <td>
                      {s.product_name}{" "}
                      <code className="text-muted small">({s.product_sku})</code>
                    </td>
                    <td className="text-end">{s.quantity}</td>
                    <td className="text-end">{format(s.unit_price)}</td>
                    <td className="text-end fw-semibold">{format(s.total_price)}</td>
                    <td className="text-muted">{s.customer_name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
          <Pagination
            count={count}
            currentPage={page}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />

        </>
      )}

      <SaleFormModal
        show={modalOpen}
        onHide={() => setModalOpen(false)}
        products={products}
        onSaved={handleSaved}
      />
    </Container>
  );
}
