import apiClient from "./client";

export const generateDescription = (data) =>
  apiClient.post("/ai/generate-description/", data).then((r) => r.data);

export const getDailyInsight = (forceRefresh = false) =>
  apiClient
    .get("/ai/daily-insight/", { params: forceRefresh ? { refresh: "true" } : {} })
    .then((r) => r.data);

export const getRestockSuggestion = () =>
  apiClient.post("/ai/restock-suggestion/").then((r) => r.data);

export const chat = (messages) =>
  apiClient.post("/ai/chat/", { messages }).then((r) => r.data);
