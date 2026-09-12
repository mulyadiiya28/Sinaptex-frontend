import { z } from "zod";

// ============================================
// ENUMS
// ============================================
export const productSectorSchema = z.enum(["GOODS", "SERVICE", "PROPERTY"]);
export type ProductSector = z.infer<typeof productSectorSchema>;

export const fulfillmentFlowSchema = z.enum(["DIRECT", "INQUIRY_FIRST"]);
export type FulfillmentFlow = z.infer<typeof fulfillmentFlowSchema>;

// ============================================
// MEDIA
// ============================================
export const productMediaSchema = z.object({
    id: z.string(),
    url: z.string(),
    type: z.string().optional(),
    isPrimary: z.boolean().optional(),
    order: z.number().optional(),
});
export type ProductMedia = z.infer<typeof productMediaSchema>;

// ============================================
// VARIANT
// ============================================
export const productVariantSchema = z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().nullable().optional(),
    stock: z.number(),
    sku: z.string().nullable().optional(),
});
export type ProductVariant = z.infer<typeof productVariantSchema>;

// ============================================
// UNIT
// ============================================
export const productUnitSchema = z.object({
    id: z.string(),
    unit: z.string(),
    conversionToBase: z.number(),
    price: z.number(),
    isDefault: z.boolean(),
});
export type ProductUnit = z.infer<typeof productUnitSchema>;

// ============================================
// PRODUCT (FULL)
// ============================================
export const productSchema = z.object({
    id: z.string(),
    partyId: z.string(),
    categoryId: z.string().nullable().optional(),
    name: z.string(),
    description: z.string().nullable().optional(),
    price: z.number(),
    currency: z.string(),
    stock: z.number(),
    baseUnit: z.string(),
    sku: z.string().nullable().optional(),
    sector: productSectorSchema,
    fulfillmentFlow: fulfillmentFlowSchema,
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    tags: z.array(z.string()),
    createdAt: z.string(),
    updatedAt: z.string(),
    // Relasi
    party: z
        .object({
            id: z.string(),
            name: z.string().optional(),
            verificationStatus: z.string().nullable().optional(),
        })
        .optional(),
    category: z
        .object({
            id: z.string(),
            name: z.string(),
            slug: z.string(),
        })
        .nullable()
        .optional(),
    media: z.array(productMediaSchema).optional(),
    variants: z.array(productVariantSchema).optional(),
    units: z.array(productUnitSchema).optional(),
    serviceDetail: z.record(z.string(), z.unknown()).nullable().optional(),
    propertyDetail: z.record(z.string(), z.unknown()).nullable().optional(),
    _count: z
        .object({
            reviews: z.number().optional(),
            cartItems: z.number().optional(),
        })
        .optional(),
});
export type Product = z.infer<typeof productSchema>;

// ============================================
// LIST PARAMS
// ============================================
export const listProductParamsSchema = z.object({
    categoryId: z.string().optional(),
    partyId: z.string().optional(),
    sector: productSectorSchema.optional(),
    search: z.string().max(200).optional(),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional(),
    sortBy: z.enum(["createdAt", "price", "name"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
});
export type ListProductParams = z.infer<typeof listProductParamsSchema>;