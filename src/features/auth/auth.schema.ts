// src/features/auth/auth.schema.ts

export interface RegisterProfileInput {
  fullName: string;
  phone?: string;
  bio?: string;
  location?: string;
  party?: {
    name: string;
    isCompany?: boolean;
    categoryId?: string;
    description?: string;
    location?: string;
    npwp?: string;
    nib?: string;
  };
  businessRoles?: string[];
  capabilityNames?: string[];
}

export interface Me {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  bio?: string | null;
  location?: string | null;
  isVerified?: boolean;
  avatarUrl?: string | null;
  accountStatus?: string;
  businessRoles?: Array<{ role: string }> | null;
  parties?: Array<Record<string, unknown>> | null;
  createdAt?: string;
  updatedAt?: string;
}