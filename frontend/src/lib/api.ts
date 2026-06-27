import type {
  ApiError,
  ApiErrorDetails,
  Association,
  AssociationProfilePayload,
  CreateDonationPayload,
  DetailedDonationStats,
  Donation,
  DonationStats,
  DonationStatus,
  RegisterAssociationPayload,
  User
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  const data = (await res.json().catch(() => ({}))) as T & ApiErrorDetails;

  if (!res.ok) {
    const error = new Error(data.message || "Une erreur est survenue.") as ApiError;
    error.status = res.status;
    error.details = data;
    throw error;
  }
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  registerAssociation: (payload: RegisterAssociationPayload) =>
    request<{ user: User }>("/auth/register-association", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  me: () => request<{ user: User }>("/auth/me"),
  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),
  createDonation: (payload: CreateDonationPayload) =>
    request<{ donation: Donation }>("/donations", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getDonation: (id: string) => request<{ donation: Donation }>(`/donations/${id}`),
  updateDonation: (id: string, payload: CreateDonationPayload) =>
    request<{ donation: Donation }>(`/donations/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  getDonationsByAssociation: (associationId: string) =>
    request<{ donations: Donation[]; stats: DonationStats }>(
      `/donations/association/${associationId}`
    ),
  getStats: (associationId: string) =>
    request<DetailedDonationStats>(`/donations/association/${associationId}/stats`),
  updateDonationStatus: (id: string, status: DonationStatus) =>
    request<{ donation: Donation }>(`/donations/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),
  deleteDonation: (id: string) =>
    request<{ message: string }>(`/donations/${id}`, { method: "DELETE" }),
  getMyAssociation: () => request<{ association: Association }>("/associations/me"),
  updateMyAssociation: (payload: AssociationProfilePayload) =>
    request<{ association: Association }>("/associations/me", {
      method: "PUT",
      body: JSON.stringify(payload)
    })
};
