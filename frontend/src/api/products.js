import apiClient from "./client";

const isFormData = (data) => typeof FormData !== "undefined" && data instanceof FormData;
const multipartConfig = (data) =>
  isFormData(data) ? { headers: { "Content-Type": "multipart/form-data" } } : {};

export const listProducts = (params = {}) =>
  apiClient.get("/products/", { params }).then((r) => r.data);

export const getProduct = (id) =>
  apiClient.get(`/products/${id}/`).then((r) => r.data);

export const createProduct = (data) =>
  apiClient.post("/products/", data, multipartConfig(data)).then((r) => r.data);

export const updateProduct = (id, data) =>
  apiClient.patch(`/products/${id}/`, data, multipartConfig(data)).then((r) => r.data);

export const deleteProduct = (id) =>
  apiClient.delete(`/products/${id}/`);

export const getLowStockProducts = () =>
  apiClient.get("/products/low-stock/").then((r) => r.data);
