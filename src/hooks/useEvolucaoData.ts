import { useMemo } from "react";

interface Item {
  id: string;
  name: string;
  etapa: string; // etapa atual
  prospectDate?: string | Date | null;
  oportunidadeDate?: string | Date | null;
  forecastDate?: string | Date | null;
  contratoDate?: string | Date | null;
  encerradoDate?: string | Date | null;
  standbyDate?: string | Date | null;
}

interface EvolucaoEtapa {
  etapa: string;
  dias7: number;
  dias14: number;
  dias21: number;
  dias30: number;
}

/** 🔹 Verifica se uma data está dentro dos últimos X dias */
function dentroDosUltimosDias(date: Date | null, dias: number): boolean {
  if (!date) return false;
  const agora = new Date();
  const limite = new Date();
  limite.setDate(agora.getDate() - dias); // ❗️use setDate, não setUTCDate
  return date >= limite && date <= agora;
}

/** 🔹 Converte string (ex: '2025-10-28') ou Date em Date válida */
function parseDate(valor: string | Date | null | undefined): Date | null {
  if (!valor) return null;
  if (valor instanceof Date) return valor;

  // Normaliza formato YYYY-MM-DD (caso venha do Monday)
  const partes = valor.split("-");
  if (partes.length === 3) {
    const [ano, mes, dia] = partes.map(Number);
    return new Date(ano, mes - 1, dia);
  }

  const d = new Date(valor);
  return isNaN(d.getTime()) ? null : d;
}

/** 🔹 Hook para calcular evolução real das etapas (considerando etapa atual) */
export function useEvolucaoData(items: Item[]) {
  return useMemo(() => {
    if (!items?.length) return [];

    const etapasMap: Record<string, keyof Item> = {
      "Prospect - 25%": "prospectDate",
      "Oportunidade - 50%": "oportunidadeDate",
      "Forecast - 75%": "forecastDate",
      "Contrato Firmado - 100%": "contratoDate",
      "Encerrado/Negado": "encerradoDate",
      "Stand-by": "standbyDate",
    };

    const resultados: EvolucaoEtapa[] = [];

    for (const [etapa, campoData] of Object.entries(etapasMap)) {
      const contar = (dias: number) => {
        return items.filter((i) => {
          const data = parseDate(i[campoData]);
          // 🔸 antes, só contava se `i.etapa === etapa`
          //     mas o item pode ter mudado recentemente, então
          //     a contagem deve considerar *a data da mudança*,
          //     não a etapa atual
          return data && dentroDosUltimosDias(data, dias);
        }).length;
      };

      resultados.push({
        etapa,
        dias7: contar(7),
        dias14: contar(14),
        dias21: contar(21),
        dias30: contar(30),
      });
    }

    console.log("📊 Evolução calculada:", resultados);
    return resultados;
  }, [items]);
}
