import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Image,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import toast from "react-hot-toast";

import { listCategories } from "../api/categories";
import { deleteProduct, listProducts } from "../api/products";
import { listSuppliers } from "../api/suppliers";
import Pagination from "../components/Pagination";
import ProductFormModal from "../components/ProductFormModal";
import { useCurrency } from "../context/CurrencyContext";
import { useTranslation } from "react-i18next";

function marginInfo(price, cost) {
  const p = parseFloat(price || 0);
  const c = parseFloat(cost || 0);
  if (!p || p <= 0) return { value: 0, pct: 0, variant: "secondary" };
  const value = p - c;
  const pct = (value / p) * 100;
  let variant = "danger";
  if (pct >= 30) variant = "success";
  else if (pct >= 10) variant = "warning";
  return { value, pct, variant };
}

function ProductImage({ src, alt }) {
  if (!src) {
    return (
      <div
        className="bg-light rounded d-flex align-items-center justify-content-center text-muted"
        style={{ width: 44, height: 44, fontSize: 18 }}
        title="No image"
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

export default function Products() {
  const { format } = useCurrency();
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const data = await listProducts(params);
      setProducts(data.results);
      setCount(data.count);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const refreshCategories = async () => {
    try {
      const cats = await listCategories();
      setCategories(cats);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    Promise.all([listCategories(), listSuppliers({ page_size: 100 })])
      .then(([cats, sups]) => {
        setCategories(cats);
        setSuppliers(sups.results || sups);
      })
      .catch(() => toast.error("Failed to load categories/suppliers"));
  }, []);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, categoryFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const openCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setModalOpen(false);
    loadProducts();
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product.id);
      toast.success("Product deleted");
      loadProducts();
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to delete product";
      toast.error(detail);
    }
  };

  const handleCategoryAdded = (newCat) => {
    setCategories((prev) => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleSupplierAdded = (newSup) => {
    setSuppliers((prev) => [...prev, newSup].sort((a, b) => a.name.localeCompare(b.name)));
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">{t("products.title")}</h1>
        <Button variant="primary" onClick={openCreate}>
          {t("products.add_product")}
        </Button>
      </div>

      <Card className="mb-3">
        <Card.Body>
          <Row className="g-2">
            <Col md={7}>
              <Form onSubmit={handleSearch}>
                <Form.Control
                  type="search"
                  placeholder={t("products.search_placeholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Form>
            </Col>
            <Col md={4}>
              <Form.Select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={1}>
              <Button variant="outline-secondary" onClick={handleSearch} className="w-100">
                Go
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : products.length === 0 ? (
        <Card body className="text-center text-muted">
          No products yet. Click "+ New Product" to add one.
        </Card>
      ) : (
        <>
          <Card>
            <Table responsive hover className="mb-0 align-middle">
              <thead>
                <tr>
                  <th style={{ width: 60 }}></th>
                  <th>{t("products.name")}</th>
                  <th>{t("products.sku")}</th>
                  <th>Category</th>
                  <th className="text-end">{t("products.price")}</th>
                  <th className="text-end">Cost</th>
                  <th className="text-end">Margin</th>
                  <th className="text-end">{t("products.stock")}</th>
                  <th className="text-end">{t("products.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const m = marginInfo(p.price, p.cost);
                  return (
                    <tr key={p.id}>
                      <td>
                        <ProductImage src={p.image} alt={p.name} />
                      </td>
                      <td>{p.name}</td>
                      <td><code>{p.sku}</code></td>
                      <td>{p.category_name}</td>
                      <td className="text-end">{format(p.price)}</td>
                      <td className="text-end text-muted">{format(p.cost)}</td>
                      <td className="text-end">
                        <Badge bg={m.variant}>
                          {m.pct.toFixed(0)}%
                        </Badge>
                        <div className="text-muted small">
                          {format(m.value)}
                        </div>
                      </td>
                      <td className="text-end">
                        {p.stock_quantity}
                        {p.is_low_stock && (
                          <Badge bg="warning" text="dark" className="ms-1">
                            Low
                          </Badge>
                        )}
                      </td>
                      <td className="text-end">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => openEdit(p)}
                          className="me-1"
                        >
                          {t("products.edit")}
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(p)}
                        >
                          {t("products.delete")}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
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

      <ProductFormModal
        show={modalOpen}
        onHide={() => setModalOpen(false)}
        product={editingProduct}
        categories={categories}
        suppliers={suppliers}
        onSaved={handleSaved}
        onCategoryAdded={handleCategoryAdded}
        onSupplierAdded={handleSupplierAdded}
      />
    </Container>
  );
}
