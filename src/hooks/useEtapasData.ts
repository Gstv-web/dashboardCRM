import { useMemo } from "react";

interface EtapaData {
  title: string;
  total: number;
}

export function useEtapasData(items: any[]) {
  return useMemo<EtapaData[]>(() => {
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
  }, [items]);
}
