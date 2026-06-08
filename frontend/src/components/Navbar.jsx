import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Button,
  ButtonGroup,
  Container,
  Dropdown,
  Image,
  Nav,
  Navbar as BSNavbar,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

function Avatar({ src, name, size }) {
  const initial = name?.[0]?.toUpperCase() || "?";
  if (src) {
    return (
      <Image
        src={src}
        roundedCircle
        style={{ width: size, height: size, objectFit: "cover" }}
      />
    );
  }
  return (
    <span
      className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        fontWeight: 600,
      }}
    >
      {initial}
    </span>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <BSNavbar bg="dark" variant="dark" expand="lg" sticky="top" className="mb-4">
      <Container>
        <BSNavbar.Brand as={Link} to={user ? "/dashboard" : "/"}>
          {user?.store_name ? (
            <>
              <span className="fw-bold">{user.store_name}</span>
              <span className="text-white-50 ms-2" style={{ fontSize: "0.7em" }}>by StockMind</span>
            </>
          ) : "StockMind"}
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="main-navbar" />
        <BSNavbar.Collapse id="main-navbar">
          {user ? (
            <>
              <Nav className="me-auto">
                <Nav.Link as={NavLink} to="/dashboard">{t('navbar.dashboard')}</Nav.Link>
                <Nav.Link as={NavLink} to="/products">{t('navbar.products')}</Nav.Link>
                <Nav.Link as={NavLink} to="/sales">{t('navbar.sales')}</Nav.Link>
                <Nav.Link as={NavLink} to="/suppliers">{t('navbar.suppliers')}</Nav.Link>
                <Nav.Link as={NavLink} to="/assistant">{t('navbar.assistant')}</Nav.Link>
              </Nav>
              <Nav>
                <Dropdown align="end" autoClose="outside">
                  <Dropdown.Toggle
                    variant="outline-light"
                    size="sm"
                    id="user-dropdown"
                    className="d-flex align-items-center"
                  >
                    <span className="me-2">
                      <Avatar src={user.avatar} name={user.username} size={24} />
                    </span>
                    {user.username}
                  </Dropdown.Toggle>
                  <Dropdown.Menu style={{ minWidth: 300 }}>
                    {/* User identity */}
                    <div className="px-3 py-2">
                      <div className="d-flex align-items-center">
                        <span className="me-2">
                          <Avatar
                            src={user.avatar}
                            name={user.username}
                            size={36}
                          />
                        </span>
                        <div>
                          {user.store_name && (
                            <div className="fw-bold text-primary small">{user.store_name}</div>
                          )}
                          <div className="fw-semibold">{user.username}</div>
                          {user.email && (
                            <div className="text-muted small">{user.email}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Dropdown.Divider />

                    {/* Language switcher */}
                    <div className="px-3 py-2">
                      <div className="fw-semibold small mb-1">{t('navbar.language')}</div>
                      <div
                        className="text-muted small mb-2"
                        style={{ lineHeight: 1.3 }}
                      >
                        {t('navbar.language_desc')}
                      </div>
                      <ButtonGroup size="sm" className="w-100">
                        <Button
                          variant={i18n.language === 'mk' ? "primary" : "outline-secondary"}
                          onClick={() => handleLanguageChange('mk')}
                        >
                          MK
                        </Button>
                        <Button
                          variant={i18n.language === 'en' ? "primary" : "outline-secondary"}
                          onClick={() => handleLanguageChange('en')}
                        >
                          EN
                        </Button>
                      </ButtonGroup>
                    </div>

                    <Dropdown.Divider />

                    <Dropdown.Item as={Link} to="/settings">
                      ⚙ {t('navbar.settings')}
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={handleLogout}
                      className="text-danger"
                    >
                      {t('navbar.logout')}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Nav>
            </>
          ) : (
            <Nav className="ms-auto">
              <Nav.Link as={NavLink} to="/login">{t('navbar.login')}</Nav.Link>
              <Nav.Link as={NavLink} to="/register">{t('navbar.register')}</Nav.Link>
            </Nav>
          )}
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}
