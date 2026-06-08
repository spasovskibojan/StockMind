import apiClient from "./client";

const isFormData = (data) => typeof FormData !== "undefined" && data instanceof FormData;
const multipartConfig = (data) =>
  isFormData(data) ? { headers: { "Content-Type": "multipart/form-data" } } : {};

export const getMe = () => apiClient.get("/auth/me/").then((r) => r.data);

export const updateMe = (data) =>
  apiClient.patch("/auth/me/", data, multipartConfig(data)).then((r) => r.data);
