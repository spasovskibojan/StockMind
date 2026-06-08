import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Image,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import toast from "react-hot-toast";

import { listProducts } from "../api/products";
import { deleteSupplier, getSupplier } from "../api/suppliers";
import SupplierFormModal from "../components/SupplierFormModal";
import { useCurrency } from "../context/CurrencyContext";
import { useTranslation } from "react-i18next";

function ProductImage({ src, alt }) {
  if (!src) {
    return (
      <div
        className="bg-light rounded d-flex align-items-center justify-content-center text-muted"
        style={{ width: 44, height: 44, fontSize: 18 }}
      >
        📦
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      rounded
      style={{ width: 44, height: 44, objectFit: "cover" }}
    />
  );
}

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { format } = useCurrency();
  const { t } = useTranslation();
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [supplierData, productsData] = await Promise.all([
        getSupplier(id),
        listProducts({ supplier: id, page_size: 100 }),
      ]);
      setSupplier(supplierData);
      setProducts(productsData.results || productsData);
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error("Supplier not found");
        navigate("/suppliers");
      } else {
        toast.error("Failed to load supplier");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`Delete supplier "${supplier.name}"?`)) return;
    try {
      await deleteSupplier(supplier.id);
      toast.success("Supplier deleted");
      navigate("/suppliers");
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to delete supplier";
      toast.error(detail);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!supplier) return null;

  const totalProducts = products.length;
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + parseFloat(p.price) * p.stock_quantity,
    0
  );
  const totalStock = products.reduce((sum, p) => sum + p.stock_quantity, 0);
  const lowStockCount = products.filter((p) => p.is_low_stock).length;

  return (
    <Container>
      <div className="mb-3">
        <Link to="/suppliers" className="text-decoration-none text-muted">
          {t("supplier_detail.back_to_suppliers")}
        </Link>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h1 className="mb-2">{supplier.name}</h1>
              <div className="text-muted">
                {supplier.contact_email && (
                  <div>
                    <strong>Email:</strong> {supplier.contact_email}
                  </div>
                )}
                {supplier.phone && (
                  <div>
                    <strong>Phone:</strong> {supplier.phone}
                  </div>
                )}
                {!supplier.contact_email && !supplier.phone && (
                  <span className="fst-italic">No contact info</span>
                )}
              </div>
            </div>
            <div>
              <Button
                variant="outline-primary"
                onClick={() => setEditOpen(true)}
                className="me-2"
              >
                {t("suppliers.edit")}
              </Button>
              <Button variant="outline-danger" onClick={handleDelete}>
                {t("suppliers.delete")}
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <div className="text-muted text-uppercase small mb-1">
                {t("supplier_detail.products_supplied")}
              </div>
              <div className="fs-2 fw-bold">{totalProducts}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <div className="text-muted text-uppercase small mb-1">
                Total stock
              </div>
              <div className="fs-2 fw-bold">{totalStock}</div>
              <div className="text-muted small">units</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <div className="text-muted text-uppercase small mb-1">
                Inventory value
              </div>
              <div className="fs-2 fw-bold">
                {format(totalInventoryValue)}
              </div>
              <div className="text-muted small">at retail price</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card
            className="h-100"
            bg={lowStockCount > 0 ? "warning" : undefined}
          >
            <Card.Body>
              <div className="text-muted text-uppercase small mb-1">
                Low stock
              </div>
              <div className="fs-2 fw-bold">{lowStockCount}</div>
              <div className="text-muted small">items need restock</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <strong>{t("supplier_detail.products_from")}</strong>
        </Card.Header>
        {products.length === 0 ? (
          <Card.Body className="text-center text-muted">
            {t("supplier_detail.no_products_from")}
          </Card.Body>
        ) : (
          <Table responsive hover className="mb-0 align-middle">
            <thead>
              <tr>
                <th style={{ width: 60 }}></th>
                <th>{t("products.name")}</th>
                <th>{t("products.sku")}</th>
                <th>Category</th>
                <th className="text-end">{t("products.price")}</th>
                <th className="text-end">{t("products.stock")}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <ProductImage src={p.image} alt={p.name} />
                  </td>
                  <td>{p.name}</td>
                  <td><code>{p.sku}</code></td>
                  <td>{p.category_name}</td>
                  <td className="text-end">{format(p.price)}</td>
                  <td className="text-end">
                    {p.stock_quantity}
                    {p.is_low_stock && (
                      <Badge bg="warning" text="dark" className="ms-1">
                        Low
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <SupplierFormModal
        show={editOpen}
        onHide={() => setEditOpen(false)}
        supplier={supplier}
        onSaved={() => {
          setEditOpen(false);
          load();
        }}
      />
    </Container>
  );
}
