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

export interface EvolucaoEtapa {
  etapa: string;
  dias7: number;
  dias14: number;
  dias21: number;
  dias30: number;
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
export function useEvolucaoData(items: Item[]): EvolucaoEtapa[] {
  return useMemo<EvolucaoEtapa[]>(() => {
    if (!Array.isArray(items) || items.length === 0) return [];

    const etapasMap: Record<string, keyof Item["datas"]> = {
      "Prospect - 25%": "prospect",
      "Oportunidade - 50%": "oportunidade",
      "Forecast - 75%": "forecast",
      "Contrato Firmado - 100%": "contrato",
      "Encerrado/Negado": "encerrado",
      "Stand-by": "standby",
    };

    // faixas EXCLUSIVAS: 0-7, 8-14, 15-21, 22-30 (ambos inclusivos)
    const ranges = [
      { key: "dias7" as const, start: 0, end: 7 },
      { key: "dias14" as const, start: 8, end: 14 },
      { key: "dias21" as const, start: 15, end: 21 },
      { key: "dias30" as const, start: 22, end: 30 },
    ];

    const resultados: EvolucaoEtapa[] = [];

    // pré-process debug: converte todas as datas para UTC-truncated (cache)
    const cacheDates = new Map<string, Partial<Record<keyof Item["datas"], Date | null>>>();
    for (const it of items) {
      const parsed: Partial<Record<keyof Item["datas"], Date | null>> = {};
      for (const key of Object.values(etapasMap) as (keyof Item["datas"])[]) {
        parsed[key] = parseToUTCDateMidnight(it.datas?.[key]);
      }
      cacheDates.set(it.id, parsed);
    }

    if (DEBUG) {
      console.log("DEBUG cacheDates sample:", Array.from(cacheDates.entries()).slice(0, 5));
      console.log("DEBUG total items:", items.length);
    }

    for (const [etapa, campoData] of Object.entries(etapasMap)) {
      // contadores tipados
      const contagens = { dias7: 0, dias14: 0, dias21: 0, dias30: 0 };

      for (const it of items) {
        // regra: só conta para a etapa se a etapa atual do item for exatamente igual (string compare)
        if (!it.etapa || it.etapa.trim() !== etapa) continue;

        const parsedDates = cacheDates.get(it.id);
        const data = parsedDates ? parsedDates[campoData] ?? null : parseToUTCDateMidnight(it.datas?.[campoData]);

        if (!data) {
          if (DEBUG) console.log(`DEBUG no date for item ${it.id} stage ${etapa}`);
          continue;
        }

        const diff = diffDaysFromTodayUTC(data); // inteiro >= 0
        if (DEBUG) {
          // mostra quando a data cai dentro 0..30 para inspeção
          if (diff <= 30) console.log(`DEBUG item ${it.id} etapa ${etapa} diffDays=${diff}`);
        }

        // encontra faixa exclusiva
        for (const r of ranges) {
          if (diff >= r.start && diff <= r.end) {
            (contagens as any)[r.key] += 1;
            break; // garante um item entra em 1 faixa no máximo
          }
        }
      }

      resultados.push({
        etapa,
        dias7: contagens.dias7,
        dias14: contagens.dias14,
        dias21: contagens.dias21,
        dias30: contagens.dias30,
      });
    }

    if (DEBUG) console.log("📊 Evolução (não acumulada):", resultados);
    return resultados;
  }, [items]);
}
