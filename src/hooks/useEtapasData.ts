import { useMemo } from "react";

interface EtapaData {
  title: string;
  total: number;
}

interface Item {
  id: string;
  name: string;
  status: string;
  etapa: string;
  vendedor?: string;
}

export function useEtapasData(items: Item[], vendedorSelecionado?: string) {
  return useMemo(() => {
    if (!items.length) return [];
    // console.log("itens em useEtapasData:", items)
    // const itemsPorVendedor = vendedorSelecionado ? items.filter((item) => item.column_values.some((col) => col.id === "dropdown_mksy1g2t" && col.text === vendedorSelecionado)) : items;
   
    const itemsFiltrados = vendedorSelecionado
      ? items.filter((item) => item.status === "Ativo" && item.vendedor === vendedorSelecionado)
      : items.filter((item) => item.status === "Ativo");

    // const itemsAtivos = items.filter((item) => item.status === "Ativo");
    // console.log("itens ativos:", itemsAtivos);
    
    const etapaTitles = [
      "Prospect - 25%",
      "Oportunidade - 50%",
      "Forecast - 75%",
      "Forecast - 90%",
      "Contrato Firmado - 100%",
      "Ação Pontual Firmada - 100%",
      "Operação Pró-Bono",
      "Stand-by",
      // "Encerrado/Negado",
    ];

    return etapaTitles.map((title) => {
      const total = itemsFiltrados.filter((item) => item.etapa === title).length;
      return { title, total };
    });
  }, [items, vendedorSelecionado]);
}
