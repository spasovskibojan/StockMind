import { useEffect, useState } from "react";
import { Button, Col, Form, Image, Modal, Row, Spinner } from "react-bootstrap";
import toast from "react-hot-toast";
import { generateDescription } from "../api/ai";
import { createProduct, updateProduct } from "../api/products";
import CategoryQuickAddModal from "./CategoryQuickAddModal";
import { useTranslation } from "react-i18next";
import SupplierFormModal from "./SupplierFormModal";

const EMPTY = {
  name: "",
  sku: "",
  description: "",
  price: "",
  cost: "",
  stock_quantity: 0,
  low_stock_threshold: 10,
  category: "",
  supplier: "",
};

export default function ProductFormModal({
  show,
  onHide,
  product,
  categories,
  suppliers,
  onSaved,
  onCategoryAdded,
  onSupplierAdded,
}) {
  const { t } = useTranslation();

  const isEdit = !!product;
  const [data, setData] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);

  useEffect(() => {
    if (product) {
      setData({
        name: product.name,
        sku: product.sku,
        description: product.description || "",
        price: product.price,
        cost: product.cost,
        stock_quantity: product.stock_quantity,
        low_stock_threshold: product.low_stock_threshold,
        category: product.category,
        supplier: product.supplier || "",
      });
      setImagePreview(product.image || null);
    } else {
      setData(EMPTY);
      setImagePreview(null);
    }
    setImageFile(null);
    setErrors({});
  }, [product, show]);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5 MB)");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCategoryAdded = (newCat) => {
    onCategoryAdded?.(newCat);
    setData((d) => ({ ...d, category: newCat.id }));
    setCategoryModalOpen(false);
  };

  const handleSupplierAdded = (newSup) => {
    onSupplierAdded?.(newSup);
    setData((d) => ({ ...d, supplier: newSup.id }));
    setSupplierModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const payload = {
      name: data.name,
      sku: data.sku,
      description: data.description,
      price: data.price,
      cost: data.cost,
      stock_quantity: parseInt(data.stock_quantity, 10),
      low_stock_threshold: parseInt(data.low_stock_threshold, 10),
      category: parseInt(data.category, 10),
      supplier: data.supplier ? parseInt(data.supplier, 10) : "",
    };

    try {
      let saved;
      if (imageFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== "" && v !== null && v !== undefined) {
            fd.append(k, v);
          }
        });
        fd.append("image", imageFile);
        saved = isEdit
          ? await updateProduct(product.id, fd)
          : await createProduct(fd);
      } else {
        // Plain JSON; supplier=null when empty
        const jsonPayload = { ...payload, supplier: payload.supplier || null };
        saved = isEdit
          ? await updateProduct(product.id, jsonPayload)
          : await createProduct(jsonPayload);
      }
      toast.success(isEdit ? t("product_modal.updated") : t("product_modal.created"));
      onSaved(saved);
    } catch (err) {
      const respData = err.response?.data || {};
      const formatted = {};
      Object.keys(respData).forEach((k) => {
        formatted[k] = Array.isArray(respData[k])
          ? respData[k].join(" ")
          : respData[k];
      });
      setErrors(formatted);
      if (!Object.keys(formatted).length) toast.error(t("product_modal.save_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? t("product_modal.edit_title") : t("product_modal.new_title")}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("components.modals.product.name")}</Form.Label>
                  <Form.Control
                    name="name"
                    value={data.name}
                    onChange={handleChange}
                    isInvalid={!!errors.name}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("components.modals.product.sku")}</Form.Label>
                  <Form.Control
                    name="sku"
                    value={data.sku}
                    onChange={handleChange}
                    isInvalid={!!errors.sku}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.sku}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <Form.Label className="mb-0">{t("product_modal.description")}</Form.Label>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={async () => {
                    if (!data.name.trim()) {
                      toast.error(t("product_modal.enter_name_first"));
                      return;
                    }
                    setGeneratingDesc(true);
                    try {
                      const catName =
                        categories.find((c) => c.id === parseInt(data.category, 10))
                          ?.name || "";
                      const res = await generateDescription({
                        name: data.name,
                        category: catName,
                      });
                      setData((d) => ({ ...d, description: res.description }));
                      toast.success(t("product_modal.desc_generated"));
                    } catch {
                      toast.error(t("product_modal.desc_failed"));
                    } finally {
                      setGeneratingDesc(false);
                    }
                  }}
                  disabled={generatingDesc}
                >
                  {generatingDesc ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1" />
                      {t("product_modal.generating")}
                    </>
                  ) : (
                    <>✨ {t("product_modal.generate_ai")}</>
                  )}
                </Button>
              </div>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={data.description}
                onChange={handleChange}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Form.Label className="mb-0">{t("product_modal.category")}</Form.Label>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0"
                      onClick={() => setCategoryModalOpen(true)}
                    >
                      + {t("product_modal.new")}
                    </Button>
                  </div>
                  <Form.Select
                    name="category"
                    value={data.category}
                    onChange={handleChange}
                    isInvalid={!!errors.category}
                    required
                  >
                    <option value="">{t("product_modal.select_category")}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.category}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Form.Label className="mb-0">{t("product_modal.supplier_optional")}</Form.Label>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0"
                      onClick={() => setSupplierModalOpen(true)}
                    >
                      + {t("product_modal.new")}
                    </Button>
                  </div>
                  <Form.Select
                    name="supplier"
                    value={data.supplier}
                    onChange={handleChange}
                  >
                    <option value="">{t("product_modal.no_supplier")}</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("products.price")}</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={data.price}
                    onChange={handleChange}
                    isInvalid={!!errors.price}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.price}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("product_modal.cost")}</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="cost"
                    value={data.cost}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("products.stock")}</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="stock_quantity"
                    value={data.stock_quantity}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("product_modal.low_stock_alert")}</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="low_stock_threshold"
                    value={data.low_stock_threshold}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>{t("product_modal.image_optional")}</Form.Label>
              <div className="d-flex align-items-center gap-3">
                {imagePreview && (
                  <Image
                    src={imagePreview}
                    rounded
                    style={{ width: 80, height: 80, objectFit: "cover" }}
                  />
                )}
                <div className="flex-grow-1">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <Form.Text className="text-muted">
                    JPG, PNG, or WebP. Max 5 MB.
                  </Form.Text>
                </div>
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? t("common.saving") : isEdit ? t("common.update") : t("common.create")}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <CategoryQuickAddModal
        show={categoryModalOpen}
        onHide={() => setCategoryModalOpen(false)}
        onCreated={handleCategoryAdded}
      />

      <SupplierFormModal
        show={supplierModalOpen}
        onHide={() => setSupplierModalOpen(false)}
        supplier={null}
        onSaved={handleSupplierAdded}
      />
    </>
  );
}
