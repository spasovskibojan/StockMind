import apiClient from "./client";

export const listSuppliers = (params = {}) =>
  apiClient.get("/suppliers/", { params }).then((r) => r.data);

export const getSupplier = (id) =>
  apiClient.get(`/suppliers/${id}/`).then((r) => r.data);

export const createSupplier = (data) =>
  apiClient.post("/suppliers/", data).then((r) => r.data);

export const updateSupplier = (id, data) =>
  apiClient.patch(`/suppliers/${id}/`, data).then((r) => r.data);

export const deleteSupplier = (id) =>
  apiClient.delete(`/suppliers/${id}/`);
