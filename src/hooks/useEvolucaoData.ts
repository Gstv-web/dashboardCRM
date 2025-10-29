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

/** Verifica se uma data está dentro dos últimos X dias */
function dentroDosUltimosDias(date: Date | null, dias: number): boolean {
  if (!date) return false;
  const agora = new Date();
  const limite = new Date();
  limite.setUTCDate(agora.getUTCDate() - dias);
  return date >= limite;
}

/** Converte string ou Date para Date de forma segura */
function parseDate(valor: string | Date | null | undefined): Date | null {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  const d = new Date(valor);
  return isNaN(d.getTime()) ? null : d;
}

/** Hook para calcular evolução real das etapas (considerando etapa atual) */
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
      const filtro = (dias: number) =>
        items.filter((i) => {
          const data = parseDate(i[campoData]);
          return i.etapa === etapa && dentroDosUltimosDias(data, dias);
        }).length;

      resultados.push({
        etapa,
        dias7: filtro(7),
        dias14: filtro(14),
        dias21: filtro(21),
        dias30: filtro(30),
      });
    }

    return resultados;
  }, [items]);
}
