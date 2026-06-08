import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  ListGroup,
  Row,
  Spinner,
} from "react-bootstrap";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getLowStockProducts } from "../api/products";
import { getSalesStats } from "../api/sales";
import DailyInsightCard from "../components/DailyInsightCard";
import KPICard from "../components/KPICard";
import RestockModal from "../components/RestockModal";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restockOpen, setRestockOpen] = useState(false);

  useEffect(() => {
    Promise.all([getSalesStats(), getLowStockProducts()])
      .then(([statsData, lowStockData]) => {
        setStats(statsData);
        setLowStock(lowStockData.results || lowStockData);
      })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  const chartData = (stats?.last_7_days || []).map((d) => ({
    day: new Date(d.day).toLocaleDateString("en-US", { weekday: "short" }),
    revenue: parseFloat(d.revenue || 0),
    count: d.count,
  }));

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-0">{t("dashboard.title")}</h1>
          <p className="text-muted mb-0">{t("dashboard.welcome_back")} {user?.username}</p>
        </div>
        <Button
          onClick={() => setRestockOpen(true)}
          style={{
            background: "#99a2aa",
            border: "none",
            boxShadow: "0 4px 14px rgba(153,162,170,0.35)",
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        >
          {t("dashboard.generate_restock")}
        </Button>
      </div>

      <Row className="g-3 mb-4">
        <Col md={3}>
          <KPICard
            title={t("dashboard.todays_revenue")}
            value={format(stats?.today_revenue || 0)}
            subtitle={`${stats?.today_count || 0} ${t("dashboard.sales")}`}
          />
        </Col>
        <Col md={3}>
          <KPICard
            title={t("dashboard.sales_today")}
            value={stats?.today_count || 0}
            subtitle={t("dashboard.transactions")}
          />
        </Col>
        <Col md={3}>
          <KPICard
            title={t("dashboard.low_stock")}
            value={lowStock.length}
            subtitle={t("dashboard.items_below_threshold")}
            variant={lowStock.length > 0 ? "warning" : "light"}
          />
        </Col>
        <Col md={3}>
          <KPICard
            title={t("dashboard.top_product_7d")}
            value={stats?.top_product?.product__name || "—"}
            subtitle={
              stats?.top_product
                ? `${stats.top_product.total_qty} ${t("dashboard.units_sold")}`
                : t("dashboard.no_sales_yet")
            }
          />
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col lg={6}>
          <DailyInsightCard />
        </Col>
        <Col lg={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>{t("dashboard.low_stock_alerts")}</Card.Title>
              {lowStock.length === 0 ? (
                <p className="text-muted small mb-0">
                  {t("dashboard.everything_stocked")}
                </p>
              ) : (
                <ListGroup variant="flush">
                  {lowStock.slice(0, 6).map((p) => (
                    <ListGroup.Item
                      key={p.id}
                      className="d-flex justify-content-between align-items-center px-0"
                    >
                      <span>
                        <strong>{p.name}</strong>
                        <br />
                        <small className="text-muted">{p.sku}</small>
                      </span>
                      <Badge bg="warning" text="dark">
                        {p.stock_quantity} / {p.low_stock_threshold}
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          <Card.Title>{t("dashboard.revenue_last_7d")}</Card.Title>
          {chartData.length === 0 ? (
            <p className="text-muted text-center py-5">
              {t("dashboard.no_sales_last_7d")}
            </p>
          ) : (
          <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip
                  formatter={(v) => format(v)}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: 13,
                  }}
                  cursor={{ fill: "rgba(153,162,170,0.08)" }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {chartData.map((_, index) => {
                    const COLORS = [
                      "#7ec8e3", // sky blue
                      "#a8d8a8", // soft green
                      "#f9c784", // warm yellow
                      "#f4a6a0", // coral pink
                      "#b5a0d8", // soft purple
                      "#99d4c8", // teal mint
                      "#f7b2c1", // blush rose
                    ];
                    return <Cell key={index} fill={COLORS[index % COLORS.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card.Body>
      </Card>

      <RestockModal show={restockOpen} onHide={() => setRestockOpen(false)} />
    </Container>
  );
}
