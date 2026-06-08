import { Link } from "react-router-dom";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export default function Landing() {
  const { t } = useTranslation();

  const FEATURES = [
    {
      title: t('landing.feat1_title'),
      text: t('landing.feat1_text'),
    },
    {
      title: t('landing.feat2_title'),
      text: t('landing.feat2_text'),
    },
    {
      title: t('landing.feat3_title'),
      text: t('landing.feat3_text'),
    },
    {
      title: t('landing.feat4_title'),
      text: t('landing.feat4_text'),
    },
  ];

  return (
    <Container className="py-5">
      <div className="text-center mb-5">
        <h1 className="display-3 mb-3">StockMind</h1>
        <p className="lead text-muted mb-4">
          {t('landing.subtitle')}
        </p>
        <div>
          <Button as={Link} to="/login" variant="primary" size="lg" className="me-2">
            {t('landing.signin')}
          </Button>
          <Button as={Link} to="/register" variant="outline-primary" size="lg">
            {t('landing.create_account')}
          </Button>
        </div>
      </div>

      <Row className="g-4">
        {FEATURES.map((f, i) => (
          <Col md={6} lg={3} key={i}>
            <Card className="h-100">
              <Card.Body>
                <Card.Title>{f.title}</Card.Title>
                <Card.Text className="text-muted">{f.text}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
