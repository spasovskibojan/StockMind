import { useEffect, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import toast from "react-hot-toast";
import { createSale } from "../api/sales";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../context/CurrencyContext";

export default function SaleFormModal({ show, onHide, products, onSaved }) {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setProductId("");
      setQuantity(1);
      setCustomerName("");
      setErrors({});
    }
  }, [show]);

  const selectedProduct = products.find((p) => p.id === parseInt(productId, 10));
  const total = selectedProduct
    ? Number(selectedProduct.price) * Number(quantity)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const saved = await createSale({
        product: parseInt(productId, 10),
        quantity: parseInt(quantity, 10),
        customer_name: customerName,
      });
      toast.success(`Sale completed — ${format(saved.total_price)}`);
      if (selectedProduct && selectedProduct.stock_quantity - quantity <= selectedProduct.low_stock_threshold) {
        toast(`Low stock: ${selectedProduct.name}`, { icon: "⚠️" });
      }
      onSaved(saved);
    } catch (err) {
      const data = err.response?.data || {};
      const formatted = {};
      Object.keys(data).forEach((k) => {
        formatted[k] = Array.isArray(data[k]) ? data[k].join(" ") : data[k];
      });
      setErrors(formatted);
      if (!Object.keys(formatted).length) toast.error("Failed to record sale");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{t("components.modals.sale.title")}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>{t("components.modals.sale.product")}</Form.Label>
            <Form.Select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              isInvalid={!!errors.product}
              required
            >
              <option value="">— Select product —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (stock: {p.stock_quantity}) — {format(p.price)}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.product}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t("components.modals.sale.qty")}</Form.Label>
            <Form.Control
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              isInvalid={!!errors.quantity}
              required
            />
            <Form.Control.Feedback type="invalid">
              {errors.quantity}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t("components.modals.sale.customer")}</Form.Label>
            <Form.Control
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in"
            />
          </Form.Group>

          {selectedProduct && (
            <Alert variant="light" className="mb-0">
              <div className="d-flex justify-content-between">
                <span>Unit price:</span>
                <strong>{format(selectedProduct.price)}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Quantity:</span>
                <strong>{quantity}</strong>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between fs-5">
                <span>Total:</span>
                <strong>{format(total)}</strong>
              </div>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            {t("components.modals.cancel")}
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading || !productId}
          >
            {loading ? "Recording..." : "Complete Sale"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
