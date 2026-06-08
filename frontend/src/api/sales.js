import apiClient from "./client";

export const listSales = (params = {}) =>
  apiClient.get("/sales/", { params }).then((r) => r.data);

export const createSale = (data) =>
  apiClient.post("/sales/", data).then((r) => r.data);

export const deleteSale = (id) =>
  apiClient.delete(`/sales/${id}/`);

export const getSalesStats = () =>
  apiClient.get("/sales/stats/").then((r) => r.data);
