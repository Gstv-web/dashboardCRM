import { useMemo } from "react";

/** Tipos exportados */
export interface Item {
  id: string;
  name: string;
  etapa: string;
  vendedor?: string;
  cliente?: string;
  valor_contrato?: string;
  fechamento_vendas?: string;
  valor_mensal_contrato?: string;
  datas: Record<
    "prospect" | "oportunidade" | "forecast" | "contrato" | "acaopontual" | "encerrado" | "standby",
    string | Date | null | undefined
  >;
}

export type PeriodoChave =
  | "dias7"
  | "dias14"
  | "dias21"
  | "dias30"
  | "dias60"
  | "dias90";

// export interface EvolucaoEtapa {
//   etapa: string;
//   dias7: number;
//   dias14: number;
//   dias21: number;
//   dias30: number;
//   dias60: number;
//   dias90: number;
//   items: {
//     dias7: Item[];
//     dias14: Item[];
//     dias21: Item[];
//     dias30: Item[];
//     dias60: Item[];
//     dias90: Item[];
//   };
// }

export interface EvolucaoEtapa {
  etapa: string;
  items: Record<PeriodoChave, Item[]>;
}

/** Config */
const DEBUG = false; // liga logs se precisar diagnosticar

/** Parsea YYYY-MM-DD ou Date para um Date UTC no midnight (truncado) */
function parseToUTCDateMidnight(valor: string | Date | null | undefined): Date | null {
  if (!valor) return null;
  if (valor instanceof Date) {
    // cria cópia truncada para midnight UTC
    return new Date(Date.UTC(valor.getUTCFullYear(), valor.getUTCMonth(), valor.getUTCDate()));
  }
  const s = String(valor).trim();
  // tenta formato YYYY-MM-DD (mais comum do Monday)
  const partes = s.split("-");
  if (partes.length === 3) {
    const [anoStr, mesStr, diaStr] = partes;
    const ano = Number(anoStr);
    const mes = Number(mesStr);
    const dia = Number(diaStr);
    if (!Number.isNaN(ano) && !Number.isNaN(mes) && !Number.isNaN(dia)) {
      return new Date(Date.UTC(ano, mes - 1, dia)); // midnight UTC
    }
  }
  // fallback: tenta criar Date e normalizar para UTC midnight
  const maybe = new Date(s);
  if (isNaN(maybe.getTime())) return null;
  return new Date(Date.UTC(maybe.getUTCFullYear(), maybe.getUTCMonth(), maybe.getUTCDate()));
}

/** calcula diferença em dias inteiros (hojeUTCMidnight - dateUTCmidnight) */
function diffDaysFromTodayUTC(dateUtcMidnight: Date): number {
  const now = new Date();
  const todayUtcMid = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const target = Date.UTC(dateUtcMidnight.getUTCFullYear(), dateUtcMidnight.getUTCMonth(), dateUtcMidnight.getUTCDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((todayUtcMid - target) / msPerDay);
}

/** hook principal */
export function useEvolucaoData(items: Item[], vendedorSelecionado?: string): EvolucaoEtapa[] {
  return useMemo<EvolucaoEtapa[]>(() => {
    if (!Array.isArray(items) || items.length === 0) return [];

    // 🔹 aplica filtro por vendedor se selecionado
    const itensFiltrados = vendedorSelecionado && vendedorSelecionado !== "Todos"
      ? items.filter(i => i.vendedor?.trim() === vendedorSelecionado.trim())
      : items;

    const etapasMap: Record<string, keyof Item["datas"]> = {
      "Prospect - 25%": "prospect",
      "Oportunidade - 50%": "oportunidade",
      "Forecast - 75%": "forecast",
      "Contrato Firmado - 100%": "contrato",
      "Ação Pontual Firmada - 100%": "acaopontual",
      "Encerrado/Negado": "encerrado",
      "Stand-by": "standby",
    };

    const ranges = [
      { key: "dias7" as const, start: 0, end: 7 },
      { key: "dias14" as const, start: 8, end: 14 },
      { key: "dias21" as const, start: 15, end: 21 },
      { key: "dias30" as const, start: 22, end: 30 },
      { key: "dias60" as const, start: 31, end: 60 },
      { key: "dias90" as const, start: 61, end: 90 },
    ];

    const resultados: EvolucaoEtapa[] = [];

    for (const [etapa, campoData] of Object.entries(etapasMap)) {
      const contagens = { dias7: 0, dias14: 0, dias21: 0, dias30: 0, dias60: 0, dias90: 0 };
      const itemsPorFaixa = { dias7: [] as Item[], dias14: [] as Item[], dias21: [] as Item[], dias30: [] as Item[], dias60: [] as Item[], dias90: [] as Item[] };

      for (const it of itensFiltrados) {
        if (it.etapa.trim() !== etapa) continue;
        const data = parseToUTCDateMidnight(it.datas?.[campoData]);
        if (!data) continue;

        const diff = diffDaysFromTodayUTC(data);
        for (const r of ranges) {
          if (diff >= r.start && diff <= r.end) {
            contagens[r.key] += 1;
            itemsPorFaixa[r.key].push(it);
            break;
          }
        }
      }

      resultados.push({
        etapa,
        ...contagens,
        items: itemsPorFaixa,
      });
    }

    return resultados;
  }, [items, vendedorSelecionado]);
}
