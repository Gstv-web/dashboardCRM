import { useMemo } from "react";

interface EtapaData {
  title: string;
  total: number;
}

interface Item {
  id: string;
  name: string;
  column_values: { id: string, text: string }[];
}

export function useEtapasData(items: Item[], vendedorSelecionado?: string) {
  return useMemo(() => {
    if (!items.length) return [];

    const itemsPorVendedor = vendedorSelecionado ? items.filter((item) => item.column_values.some((col) => col.id === "dropdown_mksy1g2t" && col.text === vendedorSelecionado)) : items;

    const etapaTitles = [
      "Prospect - 25%",
      "Oportunidade - 50%",
      "Forecast - 75%",
      "Contrato Firmado - 100%",
      "Ação Pontual Firmada - 100%",
      "Operação Pró-Bono",
      "Stand-by",
      "Encerrado/Negado",
    ];

    return etapaTitles.map((title) => {
      const total = items.filter((item) =>
        item.column_values.find((col: { id: string }) => col.id === "status6__1")?.text.includes(title)
      ).length;
      return { title, total };
    });
  }, [items, vendedorSelecionado]);
}
