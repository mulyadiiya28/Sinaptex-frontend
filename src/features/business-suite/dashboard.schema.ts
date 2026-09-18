import { z } from "zod";

export const bsDashboardSchema = z.object({
  partyId: z.string(),
  dateRange: z.string(),
  financial: z.object({
    balance: z.number(),
    income: z.number(),
    expense: z.number(),
    netCashFlow: z.number(),
    totalReceivable: z.number(),
    totalDebt: z.number(),
    totalInventoryValue: z.number(),
    equity: z.number(),
  }),
  operational: z.object({
    totalProducts: z.number(),
    lowStockProducts: z.number(),
    totalOrders: z.number(),
  }).passthrough(),
  contacts: z.object({
    customers: z.number(),
    suppliers: z.number(),
    debtors: z.number(),
    creditors: z.number(),
  }),
  tasks: z.object({
    total: z.number(),
    overdue: z.number(),
    completed: z.number(),
  }).passthrough(),
  inventory: z.object({}).passthrough(),
  recentActivity: z.unknown().optional(),
});
export type BsDashboard = z.infer<typeof bsDashboardSchema>;
