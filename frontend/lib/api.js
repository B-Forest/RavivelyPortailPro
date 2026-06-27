const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || "Une erreur est survenue.");
    error.status = res.status;
    error.details = data;
    throw error;
  }
  return data;
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  registerAssociation: (payload) =>
    request("/auth/register-association", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
  createDonation: (payload) => request("/donations", { method: "POST", body: JSON.stringify(payload) }),
  getDonation: (id) => request(`/donations/${id}`),
  updateDonation: (id, payload) => request(`/donations/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  getDonationsByAssociation: (associationId) => request(`/donations/association/${associationId}`),
  getStats: (associationId) => request(`/donations/association/${associationId}/stats`),
  updateDonationStatus: (id, status) =>
    request(`/donations/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteDonation: (id) => request(`/donations/${id}`, { method: "DELETE" }),
  getMyAssociation: () => request("/associations/me"),
  updateMyAssociation: (payload) => request("/associations/me", { method: "PUT", body: JSON.stringify(payload) })
};
