import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  sortOrder: z.number().int().optional(),
});

export const menuItemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  price: z.number().int().positive("Preço deve ser positivo"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  active: z.boolean().optional(),
  categoryIds: z.array(z.number().int()).min(1, "Selecione ao menos uma categoria"),
});

export const orderItemInputSchema = z.object({
  menuItemId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

const phoneSchema = z
  .string()
  .min(1, "Telefone é obrigatório")
  .transform(normalizePhone)
  .refine((v) => v.length >= 10 && v.length <= 13, "Telefone inválido");

const optionalPhoneSchema = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? normalizePhone(v) : undefined))
  .refine((v) => v === undefined || (v.length >= 10 && v.length <= 13), "Telefone inválido");

const optionalEmailSchema = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? v.trim().toLowerCase() : undefined))
  .refine(
    (v) => v === undefined || z.string().email().safeParse(v).success,
    "E-mail inválido",
  );

export const createDeliveryOrderSchema = z.object({
  restaurantId: z.number().int().positive(),
  customerName: z.string().min(2, "Nome é obrigatório"),
  customerCpf: z
    .string()
    .min(11, "CPF inválido")
    .max(14)
    .transform((v) => v.replace(/\D/g, "")),
  customerPhone: phoneSchema,
  customerEmail: z.string().email("E-mail inválido").transform((v) => v.toLowerCase()),
  customerAddress: z.string().min(10, "Endereço completo é obrigatório"),
  paymentMethod: z.enum(["dinheiro", "cartao_entrega", "pix"]),
  notes: z.string().optional(),
  items: z.array(orderItemInputSchema).min(1, "Adicione itens ao carrinho"),
});

export const createPresencialOrderSchema = z.object({
  type: z.literal("presencial"),
  restaurantId: z.number().int().positive(),
  tableNumber: z.string().min(1, "Número da mesa é obrigatório"),
  customerPhone: optionalPhoneSchema,
  customerEmail: optionalEmailSchema,
  notes: z.string().optional(),
  items: z.array(orderItemInputSchema).min(1, "Adicione itens ao carrinho"),
});

export const closeComandaSchema = z.object({
  paymentMethod: z.enum(["dinheiro", "cartao", "pix"]),
});

export const trackOrderSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  cpf: z
    .string()
    .min(11, "CPF inválido")
    .max(14)
    .transform((v) => v.replace(/\D/g, "")),
});

export const orderStatusValues = [
  "em_analise",
  "em_producao",
  "pronto",
  "entregue",
] as const;

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatusValues),
});

export const webhookEventValues = [
  "order.created",
  "order.status_changed",
  "order.delivered",
  "comanda.opened",
  "comanda.closed",
  "menu.item_updated",
] as const;

export const webhookSubscriptionSchema = z.object({
  url: z.string().url("URL inválida"),
  events: z
    .array(z.enum(webhookEventValues))
    .min(1, "Selecione ao menos um evento"),
  active: z.boolean().optional(),
});

export const restaurantSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  address: z.string().optional(),
  maxDeliveryKm: z.number().int().positive().optional().nullable(),
  operatingHours: z.string().optional(),
});

export const deliverySettingsSchema = z.object({
  baseFee: z.number().int().min(0).optional(),
  feePerKm: z.number().int().min(0).optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  active: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type CreateDeliveryOrderInput = z.infer<typeof createDeliveryOrderSchema>;
export type CreatePresencialOrderInput = z.infer<typeof createPresencialOrderSchema>;
export type CloseComandaInput = z.infer<typeof closeComandaSchema>;
export type TrackOrderInput = z.infer<typeof trackOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type WebhookSubscriptionInput = z.infer<typeof webhookSubscriptionSchema>;
export type RestaurantSettingsInput = z.infer<typeof restaurantSettingsSchema>;
export type DeliverySettingsInput = z.infer<typeof deliverySettingsSchema>;
