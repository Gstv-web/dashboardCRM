import { useMemo } from "react";

interface Item {
  id: string;
  name: string;
  etapa: string;
  vendedor?: string;
  cliente?: string;
  valor_ativacao?: string;
  valor_manutencao?: string;
  datas: {
    prospect?: string | Date | null;
    oportunidade?: string | Date | null;
    forecast?: string | Date | null;
    contrato?: string | Date | null;
    encerrado?: string | Date | null;
    standby?: string | Date | null;
  };
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
  limite.setDate(agora.getDate() - dias);
  return date >= limite && date <= agora;
}

/** 🔹 Converte string (ex: '2025-10-28') ou Date em Date válida */
function parseDate(valor: string | Date | null | undefined): Date | null {
  if (!valor) return null;
  if (valor instanceof Date) return valor;

  // Normaliza formato YYYY-MM-DD (como vem do Monday)
  const partes = valor.split("-");
  if (partes.length === 3) {
    const [ano, mes, dia] = partes.map(Number);
    return new Date(ano, mes - 1, dia);
  }

  const d = new Date(valor);
  return isNaN(d.getTime()) ? null : d;
}

/** 🔹 Hook para calcular evolução real das etapas (usando `datas`) */
export function useEvolucaoData(items: Item[]) {
  return useMemo(() => {
    if (!items?.length) return [];

    const etapasMap: Record<string, keyof Item["datas"]> = {
      "Prospect - 25%": "prospect",
      "Oportunidade - 50%": "oportunidade",
      "Forecast - 75%": "forecast",
      "Contrato Firmado - 100%": "contrato",
      "Encerrado/Negado": "encerrado",
      "Stand-by": "standby",
    };

    const resultados: EvolucaoEtapa[] = [];

    for (const [etapa, campoData] of Object.entries(etapasMap)) {
      const contar = (dias: number) => {
        return items.filter((i) => {
          const data = parseDate(i.datas?.[campoData]);
          return i.etapa === etapa && dentroDosUltimosDias(data, dias);
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
