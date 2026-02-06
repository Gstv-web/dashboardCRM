import { useMemo } from "react";

interface Item {
  id: string;
  name: string;
  status: string;
  etapa: string;
  vendedor?: string;
  empresa?: string;
  valor_contrato?: string | number | null;
}

interface EtapaValorData {
  title: string;
  total: number;
}

const ETAPAS_VALOR = [
  "Prospect - 25%",
  "Oportunidade - 50%",
  "Forecast - 75%",
  "Forecast - 90%",
];

function parseValorContrato(valor: string | number | null | undefined): number {
  if (typeof valor === "number") return valor;
  if (!valor) return 0;
  const normalizado = String(valor)
    .replace(/[^0-9,.-]/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

export function useEtapasValorData(
  items: Item[],
  vendedorSelecionado?: string,
  empresaSelecionada?: string
): EtapaValorData[] {
  return useMemo(() => {
    if (!items.length) return [];

    let itemsFiltrados = items.filter((item) => item.status === "Ativo");

    if (vendedorSelecionado) {
      itemsFiltrados = itemsFiltrados.filter(
        (item) => item.vendedor === vendedorSelecionado
      );
    }

    if (empresaSelecionada) {
      itemsFiltrados = itemsFiltrados.filter(
        (item) => item.empresa === empresaSelecionada
      );
    }

    return ETAPAS_VALOR.map((title) => {
      const total = itemsFiltrados
        .filter((item) => item.etapa === title)
        .reduce((acc, item) => acc + parseValorContrato(item.valor_contrato), 0);
      return { title, total };
    });
  }, [items, vendedorSelecionado, empresaSelecionada]);
}
