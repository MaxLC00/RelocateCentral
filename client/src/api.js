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

export const listUsers = () =>
  api.get("/users").then((r) => r.data);

export const createUser = (payload) =>
  api.post("/users", payload).then((r) => r.data);

export const deleteUser = (id) =>
  api.delete(`/users/${id}`).then((r) => r.data);

export default api;
