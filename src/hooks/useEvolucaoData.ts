import { useMemo } from "react";

/** 🔹 Representa um item vindo do Monday normalizado */
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

/** 🔹 Estrutura de saída — contagens por etapa e faixa de dias */
export interface EvolucaoEtapa {
  etapa: string;
  dias7: number;
  dias14: number;
  dias21: number;
  dias30: number;
}

/** 🔹 Representa uma faixa de tempo em dias (não acumulativa) */
interface Range {
  nome: keyof Omit<EvolucaoEtapa, "etapa">;
  diasInicio: number;
  diasFim: number;
}

/** 🔹 Converte string (ex: "2025-10-29") ou Date em Date válida */
function parseDate(valor: string | Date | null | undefined): Date | null {
  if (!valor) return null;
  if (valor instanceof Date) return valor;

  const partes: string[] = valor.split("-");
  if (partes.length === 3) {
    const [ano, mes, dia] = partes.map(Number);
    const parsed = new Date(ano, mes - 1, dia);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(valor);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** 🔹 Hook para calcular a evolução das etapas (não acumulativa) */
export function useEvolucaoData(items: Item[]): EvolucaoEtapa[] {
  return useMemo<EvolucaoEtapa[]>(() => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    /** Mapeia a etapa textual para o campo correspondente em `datas` */
    const etapasMap: Record<string, keyof Item["datas"]> = {
      "Prospect - 25%": "prospect",
      "Oportunidade - 50%": "oportunidade",
      "Forecast - 75%": "forecast",
      "Contrato Firmado - 100%": "contrato",
      "Encerrado/Negado": "encerrado",
      "Stand-by": "standby",
    };

    /** Define faixas de dias (não acumulativas) */
    const ranges: Range[] = [
      { nome: "dias7", diasInicio: 0, diasFim: 7 },
      { nome: "dias14", diasInicio: 8, diasFim: 14 },
      { nome: "dias21", diasInicio: 15, diasFim: 21 },
      { nome: "dias30", diasInicio: 22, diasFim: 30 },
    ];

    const hoje: Date = new Date();
    const resultados: EvolucaoEtapa[] = [];

    /** Itera cada etapa e calcula suas contagens */
    for (const [etapa, campoData] of Object.entries(etapasMap)) {
      // Inicializa contadores fortemente tipados
      const contagens: Record<keyof Omit<EvolucaoEtapa, "etapa">, number> = {
        dias7: 0,
        dias14: 0,
        dias21: 0,
        dias30: 0,
      };

      items.forEach((item: Item): void => {
        const dataEtapa: Date | null = parseDate(item.datas?.[campoData]);
        if (!dataEtapa) return;

        // Somente conta se o item estiver atualmente nesta etapa
        if (item.etapa !== etapa) return;

        const diffDias: number = (hoje.getTime() - dataEtapa.getTime()) / (1000 * 60 * 60 * 24);

        // Atribui o item à faixa correta (não acumulativa)
        for (const { nome, diasInicio, diasFim } of ranges) {
          if (diffDias >= diasInicio && diffDias <= diasFim) {
            contagens[nome] += 1;
            break;
          }
        }
      });

      resultados.push({
        etapa,
        ...contagens,
      });
    }

    console.log("📊 Evolução (faixas exclusivas, tipado):", resultados);
    return resultados;
  }, [items]);
}
