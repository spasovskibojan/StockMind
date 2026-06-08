import { useEffect, useState } from "react";
import { Badge, Button, Modal, Spinner, Table } from "react-bootstrap";
import { getRestockSuggestion } from "../api/ai";
import { useTranslation } from "react-i18next";

const URGENCY_VARIANTS = {
  high: "danger",
  medium: "warning",
  low: "info",
};

export default function RestockModal({ show, onHide }) {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    setNote("");
    try {
      const res = await getRestockSuggestion();
      setRecommendations(res.recommendations || []);
      setNote(res.note || "");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) load();
  }, [show]);

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>✨ {t("components.modals.restock.title")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <p className="text-muted mt-2 mb-0">
              {t("components.modals.restock.analyzing")}
            </p>
          </div>
        ) : error ? (
          <p className="text-danger mb-0">
            {t("components.modals.restock.error")}
          </p>
        ) : note ? (
          <p className="text-muted mb-0">{note}</p>
        ) : recommendations.length === 0 ? (
          <p className="text-muted mb-0">
            {t("components.modals.restock.no_need")}
          </p>
        ) : (
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>{t("products.name")}</th>
                <th>{t("components.modals.restock.urgency")}</th>
                <th>{t("components.modals.restock.reason")}</th>
                <th className="text-end">{t("components.modals.restock.qty")}</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((r, i) => (
                <tr key={i}>
                  <td>{r.name}</td>
                  <td>
                    <Badge bg={URGENCY_VARIANTS[r.urgency] || "secondary"}>
                      {r.urgency}
                    </Badge>
                  </td>
                  <td className="text-muted small">{r.reason}</td>
                  <td className="text-end fw-bold">{r.suggested_quantity}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-primary" onClick={load} disabled={loading}>
          ↻ {t("components.modals.restock.regenerate")}
        </Button>
        <Button variant="secondary" onClick={onHide}>
          {t("common.cancel")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
