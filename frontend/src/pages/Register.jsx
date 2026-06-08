import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Container, Form } from "react-bootstrap";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function Register() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await register(
        formData.username,
        formData.email,
        formData.password,
        formData.passwordConfirm
      );
      toast.success(t("auth.account_created"));
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data || {};
      const formatted = {};
      Object.keys(data).forEach((k) => {
        formatted[k] = Array.isArray(data[k]) ? data[k].join(" ") : data[k];
      });
      setErrors(
        Object.keys(formatted).length
          ? formatted
          : { general: t("auth.registration_failed") }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container style={{ maxWidth: 480 }}>
      <Card>
        <Card.Body className="p-4">
          <h3 className="text-center mb-4">{t("auth.create_account")}</h3>
          {errors.general && <Alert variant="danger">{errors.general}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>{t("auth.username")}</Form.Label>
              <Form.Control
                name="username"
                value={formData.username}
                onChange={handleChange}
                isInvalid={!!errors.username}
                required
              />
              <Form.Control.Feedback type="invalid">
                {errors.username}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t("auth.email")}</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
                required
              />
              <Form.Control.Feedback type="invalid">
                {errors.email}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t("auth.password")}</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                isInvalid={!!errors.password}
                required
              />
              <Form.Control.Feedback type="invalid">
                {errors.password}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                {t("auth.password_hint")}
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t("auth.confirm_password")}</Form.Label>
              <Form.Control
                type="password"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={loading}
            >
              {loading ? t("auth.creating") : t("auth.create_account")}
            </Button>
          </Form>
          <p className="text-center mt-3 mb-0">
            {t("auth.already_have_account")} <Link to="/login">{t("auth.signin")}</Link>
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}
