import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Container, Spinner, Table } from "react-bootstrap";
import toast from "react-hot-toast";

import { deleteSupplier, listSuppliers } from "../api/suppliers";
import Pagination from "../components/Pagination";
import SupplierFormModal from "../components/SupplierFormModal";
import { useTranslation } from "react-i18next";

export default function Suppliers() {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listSuppliers({ page });
      setSuppliers(data.results);
      setCount(data.count);
    } catch {
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setModalOpen(false);
    load();
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete supplier "${s.name}"?`)) return;
    try {
      await deleteSupplier(s.id);
      toast.success("Supplier deleted");
      load();
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to delete supplier";
      toast.error(detail);
    }
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">{t("suppliers.title")}</h1>
        <Button variant="primary" onClick={openCreate}>
          {t("suppliers.new_supplier")}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : suppliers.length === 0 ? (
        <Card body className="text-center text-muted">
          {t("suppliers.no_suppliers_yet")}
        </Card>
      ) : (
        <>
          <Card>
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>{t("suppliers.name")}</th>
                  <th>{t("suppliers.email")}</th>
                  <th>{t("suppliers.phone")}</th>
                  <th className="text-end">{t("suppliers.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td className="text-muted">{s.contact_email || "—"}</td>
                    <td className="text-muted">{s.phone || "—"}</td>
                    <td className="text-end">
                      <Button
                        as={Link}
                        to={`/suppliers/${s.id}`}
                        variant="outline-secondary"
                        size="sm"
                        className="me-1"
                      >
                        {t("suppliers.view")}
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => openEdit(s)}
                        className="me-1"
                      >
                        {t("suppliers.edit")}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(s)}
                      >
                        {t("suppliers.delete")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
          <Pagination count={count} currentPage={page} onPageChange={setPage} />
        </>
      )}

      <SupplierFormModal
        show={modalOpen}
        onHide={() => setModalOpen(false)}
        supplier={editing}
        onSaved={handleSaved}
      />
    </Container>
  );
}
