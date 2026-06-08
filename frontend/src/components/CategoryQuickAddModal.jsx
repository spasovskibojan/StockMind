import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import toast from "react-hot-toast";
import { createCategory } from "../api/categories";
import { useTranslation } from "react-i18next";

export default function CategoryQuickAddModal({ show, onHide, onCreated }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setName("");
      setError("");
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setLoading(true);
    try {
      const created = await createCategory({ name: name.trim() });
      toast.success(`Category "${created.name}" added`);
      onCreated(created);
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.name?.[0] || data?.detail || "Failed to add category";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t("components.modals.category_quick_add.title")}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group>
            <Form.Label>{t("components.modals.category_quick_add.label")}</Form.Label>
            <Form.Control
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("components.modals.category_quick_add.placeholder")}
              isInvalid={!!error}
              autoFocus
              required
            />
            <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            {t("components.modals.cancel")}
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? t("components.modals.adding") : t("components.modals.add")}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
