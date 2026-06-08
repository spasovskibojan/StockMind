import { Link } from "react-router-dom";
import { Container } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <Container className="text-center">
        <div className="mb-3 d-flex justify-content-center flex-wrap align-items-center">
          {user ? (
            <>
              <Link to="/dashboard" className="text-white text-decoration-none mx-2 hover-opacity">{t('navbar.dashboard')}</Link>
              <span className="text-secondary">|</span>
              <Link to="/products" className="text-white text-decoration-none mx-2 hover-opacity">{t('navbar.products')}</Link>
              <span className="text-secondary">|</span>
              <Link to="/sales" className="text-white text-decoration-none mx-2 hover-opacity">{t('navbar.sales')}</Link>
              <span className="text-secondary">|</span>
              <Link to="/suppliers" className="text-white text-decoration-none mx-2 hover-opacity">{t('navbar.suppliers')}</Link>
              <span className="text-secondary">|</span>
              <Link to="/assistant" className="text-white text-decoration-none mx-2 hover-opacity">{t('navbar.assistant')}</Link>
              <span className="text-secondary">|</span>
              <Link to="/settings" className="text-white text-decoration-none mx-2 hover-opacity">{t('navbar.settings')}</Link>
            </>
          ) : (
            <>
              <Link to="/" className="text-white text-decoration-none mx-2 hover-opacity">{t('footer.home')}</Link>
              <span className="text-secondary">|</span>
              <Link to="/login" className="text-white text-decoration-none mx-2 hover-opacity">{t('footer.signin')}</Link>
              <span className="text-secondary">|</span>
              <Link to="/register" className="text-white text-decoration-none mx-2 hover-opacity">{t('footer.create_account')}</Link>
            </>
          )}
        </div>
        <p className="text-white small mb-0">
          © {year} {t('footer.copyright')}
        </p>
      </Container>
    </footer>
  );
}
