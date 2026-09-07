import { apiClient } from "@/lib/api-client";
import { SubmitVerificationInput, Verification } from "./verification.schema";

// upload + list dokumen verifikasi (OpenAPI: /verification-documents)
export const verificationApi = {
  /** POST /verification-documents */
  submit: (input: SubmitVerificationInput) =>
    apiClient.post<Verification>("/api/v1/verification-documents", input),

  /** GET /verification-documents/me */
  mine: () =>
    apiClient.get<Verification[]>("/api/v1/verification-documents/me"),
};
