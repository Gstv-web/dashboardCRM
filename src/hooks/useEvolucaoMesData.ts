import { useMemo } from "react";

/** Tipos exportados */
export interface Item {
  id: string;
  name: string;
  etapa: string;
  vendedor?: string;
  cliente?: string;
  valor_ativacao?: string;
  valor_manutencao?: string;
  datas: Record<
    "prospect" | "oportunidade" | "forecast" | "contrato" | "encerrado" | "standby",
    string | Date | null | undefined
  >;
}

export interface EvolucaoEtapaMes {
  etapa: string;
  total: number; // total daquela etapa no mês atual
}

/** utilitário: converte para Date UTC midnight */
function parseToUTCDateMidnight(valor: string | Date | null | undefined): Date | null {
  if (!valor) return null;
  if (valor instanceof Date)
    return new Date(Date.UTC(valor.getUTCFullYear(), valor.getUTCMonth(), valor.getUTCDate()));

  const s = String(valor).trim();
  const partes = s.split("-");
  if (partes.length === 3) {
    const [anoStr, mesStr, diaStr] = partes.map(Number);
    return new Date(Date.UTC(anoStr, mesStr - 1, diaStr));
  }

  const maybe = new Date(s);
  if (isNaN(maybe.getTime())) return null;

  return new Date(
    Date.UTC(maybe.getUTCFullYear(), maybe.getUTCMonth(), maybe.getUTCDate())
  );
}

/** Hook principal — evolução no mês atual */
export function useEvolucaoMesData(
  items: Item[],
  vendedorSelecionado?: string
): EvolucaoEtapaMes[] {
  return useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return [];

    // 🔹 Filtra por vendedor se necessário
    const itensFiltrados =
      vendedorSelecionado && vendedorSelecionado !== "Todos"
        ? items.filter((i) => i.vendedor?.trim() === vendedorSelecionado.trim())
        : items;

    // 🔹 Define início e fim do mês
    const now = new Date();
    const inicioMes = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const hoje = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    const etapasMap: Record<string, keyof Item["datas"]> = {
      "Prospect - 25%": "prospect",
      "Oportunidade - 50%": "oportunidade",
      "Forecast - 75%": "forecast",
      "Contrato Firmado - 100%": "contrato",
      "Encerrado/Negado": "encerrado",
      "Stand-by": "standby",
    };

    const resultados: EvolucaoEtapaMes[] = [];

    for (const [etapa, campoData] of Object.entries(etapasMap)) {
      let total = 0;

      for (const item of itensFiltrados) {
        if (item.etapa.trim() !== etapa) continue;

        const data = parseToUTCDateMidnight(item.datas?.[campoData]);
        if (!data) continue;

        // pertence ao mês atual?
        if (data >= inicioMes && data <= hoje) total++;
      }

      resultados.push({ etapa, total });
    }

    return resultados;
  }, [items, vendedorSelecionado]);
}
