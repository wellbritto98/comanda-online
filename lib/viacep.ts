export type ViaCepAddress = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

export async function fetchAddressByCep(cep: string): Promise<ViaCepAddress | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const base =
    process.env.VIACEP_BASE_URL?.replace(/\/$/, "") ??
    "https://viacep.com.br/ws";

  try {
    const res = await fetch(`${base}/${digits}/json/`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ViaCepAddress;
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

export function formatAddressFromCep(data: ViaCepAddress, number?: string) {
  const parts = [
    data.logradouro,
    number?.trim() || null,
    data.bairro,
    `${data.localidade} - ${data.uf}`,
    data.cep.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2"),
  ].filter(Boolean);
  return parts.join(", ");
}
