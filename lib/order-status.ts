export const ORDER_STATUS_LABELS: Record<string, string> = {
  em_analise: "Em análise",
  em_producao: "Em produção",
  pronto: "Pronto para entrega",
  entregue: "Entregue",
};

export const ORDER_STATUS_STEPS = [
  { key: "em_analise", label: "Em análise" },
  { key: "em_producao", label: "Em produção" },
  { key: "pronto", label: "Pronto" },
  { key: "entregue", label: "Entregue" },
] as const;

export type OrderStatusKey = (typeof ORDER_STATUS_STEPS)[number]["key"];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  cartao_entrega: "Cartão na entrega",
  pix: "Pix",
};
