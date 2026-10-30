import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "")}/api`
  : "/api";

const api = axios.create({ baseURL });

// Attach the team JWT to every request when present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("team_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getAnnouncements = (category) =>
  api.get("/announcements", { params: category ? { category } : {} }).then((r) => r.data);

export const getUnitStatus = (unitNumber) =>
  api.get(`/units/${encodeURIComponent(unitNumber)}`).then((r) => r.data);

export const getUnitByResident = (name) =>
  api.get("/units/by-resident", { params: { name } }).then((r) => r.data);

export const submitContact = (payload) =>
  api.post("/contacts", payload).then((r) => r.data);

export const listContacts = () =>
  api.get("/contacts").then((r) => r.data);

export const updateContactStatus = (id, status) =>
  api.patch(`/contacts/${id}/status`, { status }).then((r) => r.data);

export const createAnnouncement = (payload) =>
  api.post("/announcements", payload).then((r) => r.data);

export const deleteAnnouncement = (id) =>
  api.delete(`/announcements/${id}`).then((r) => r.data);

export const updateUnit = (unitNumber, payload) =>
  api.put(`/units/${encodeURIComponent(unitNumber)}`, payload).then((r) => r.data);

export const listUnits = () =>
  api.get("/units").then((r) => r.data);

export const downloadUnitsCsv = async () => {
  const res = await api.get("/units/export", { responseType: "blob" });
  const disposition = res.headers["content-disposition"] || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : "unit-status.csv";

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const listFiles = () =>
  api.get("/files").then((r) => r.data);

export const uploadFile = (file, { title = "", description = "" } = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  formData.append("description", description);
  return api
    .post("/files", formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
};

export const deleteFile = (id) =>
  api.delete(`/files/${id}`).then((r) => r.data);

export const downloadFile = async (id, filename) => {
  const res = await api.get(`/files/${id}`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename || "download");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const listTasks = () =>
  api.get("/tasks").then((r) => r.data);

export const createTask = (payload) =>
  api.post("/tasks", payload).then((r) => r.data);

export const updateTask = (id, payload) =>
  api.put(`/tasks/${id}`, payload).then((r) => r.data);

export const deleteTask = (id) =>
  api.delete(`/tasks/${id}`).then((r) => r.data);

export const listTaskAttachments = (taskId) =>
  api.get(`/tasks/${taskId}/attachments`).then((r) => r.data);

export const uploadTaskAttachment = (taskId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post(`/tasks/${taskId}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const deleteTaskAttachment = (taskId, attId) =>
  api.delete(`/tasks/${taskId}/attachments/${attId}`).then((r) => r.data);

export const downloadTaskAttachment = async (taskId, attId, filename) => {
  const res = await api.get(`/tasks/${taskId}/attachments/${attId}`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename || "download");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const listUsers = () =>
  api.get("/users").then((r) => r.data);

export const createUser = (payload) =>
  api.post("/users", payload).then((r) => r.data);

export const deleteUser = (id) =>
  api.delete(`/users/${id}`).then((r) => r.data);

export default api;
