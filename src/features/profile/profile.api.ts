import { apiClient } from "@/lib/api-client";
import { Profile, UpdateProfileInput } from "./profile.schema";

export const profileApi = {
  /** GET /profiles/me */
  get: () => apiClient.get<Profile>("/api/v1/profiles/me"),

  /** PATCH /profiles/me */
  update: (input: UpdateProfileInput) =>
    apiClient.patch<Profile>("/api/v1/profiles/me", input),

  /** GET /profiles/me/progress */
  getProgress: () => apiClient.get<unknown>("/api/v1/profiles/me/progress"),

  /** GET /profiles/{id} */
  getById: (id: string) => apiClient.get<Profile>(`/api/v1/profiles/${id}`),
};
