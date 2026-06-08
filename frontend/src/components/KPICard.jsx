import { Card } from "react-bootstrap";

export default function KPICard({ title, value, subtitle, variant = "light" }) {
  return (
    <Card bg={variant} className="h-100">
      <Card.Body>
        <div className="text-muted text-uppercase small mb-1">{title}</div>
        <div className="fs-2 fw-bold">{value}</div>
        {subtitle && <div className="text-muted small">{subtitle}</div>}
      </Card.Body>
    </Card>
  );
}
