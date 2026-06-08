import { useEffect, useState } from "react";
import { Button, Card, Spinner } from "react-bootstrap";
import { getDailyInsight } from "../api/ai";

export default function DailyInsightCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async (forceRefresh = false) => {
    setLoading(true);
    setError(false);
    try {
      const res = await getDailyInsight(forceRefresh);
      setData(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(false);
  }, []);

  return (
    <Card
      className="h-100"
      style={{
        borderTop: "3px solid #99a2aa",
        borderLeft: "1px solid rgba(153,162,170,0.2)",
        borderRight: "1px solid rgba(153,162,170,0.2)",
        borderBottom: "1px solid rgba(153,162,170,0.2)",
        boxShadow: "0 2px 12px rgba(153,162,170,0.12)",
      }}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: "1.2rem" }}>✨</span>
            <Card.Title className="mb-0 fw-semibold">
              ВИ Дневни Увиди
            </Card.Title>
          </div>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => load(true)}
            disabled={loading}
            title="Регенерирај"
            style={{ borderRadius: "50%", width: 32, height: 32, padding: 0, lineHeight: 1, borderColor: "#99a2aa", color: "#99a2aa" }}
          >
            {loading ? <Spinner size="sm" animation="border" /> : "↻"}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" style={{ color: "#99a2aa" }} />
            <span className="ms-2 text-muted">Генерирање увиди...</span>
          </div>
        ) : error ? (
          <p className="text-danger small mb-0">
            Не можев да ги вчитам увидите. Обидете се повторно.
          </p>
        ) : data?.bullets?.length ? (
          <ul className="mb-0 ps-3" style={{ lineHeight: 1.9 }}>
            {data.bullets.map((b, i) => (
              <li key={i} className="mb-1 small text-body">
                {b}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted small mb-0">Нема увиди сè уште.</p>
        )}
      </Card.Body>
    </Card>
  );
}
