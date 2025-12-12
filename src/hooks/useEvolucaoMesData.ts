import { useMemo } from "react";

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
    "prospect" | "oportunidade" | "forecast75" | "forecast90" | "contrato" | "acaopontual" | "encerrado" | "standby",
    string | Date | null | undefined
  >;
}

export interface EvolucaoEtapaDia {
  dia: string; // "05/02"
  itens: Item[]; // 🔥 AGORA cada dia guarda os itens do dia
  [etapa: string]: number | string | Item[];
}

function parseToDate(valor: any): Date | null {
  if (!valor) return null;

  const d = new Date(valor);
  return isNaN(d.getTime()) ? null : d;
}

export function useEvolucaoMesData(
  items: Item[],
  vendedorSelecionado?: string
): EvolucaoEtapaDia[] {
  return useMemo<EvolucaoEtapaDia[]>(() => {
    if (!Array.isArray(items) || items.length === 0) return [];

    const now = new Date();
    const ano = now.getFullYear();
    const mes = now.getMonth();

    const diasNoMes = new Date(ano, mes + 1, 0).getDate();

    const etapasMap = {
      "Prospect - 25%": "prospect",
      "Oportunidade - 50%": "oportunidade",
      "Forecast - 75%": "forecast75",
      "Forecast - 90%": "forecast90",
      "Contrato Firmado - 100%": "contrato",
      "Ação Pontual Firmada - 100%": "acaopontual",
      "Encerrado/Negado": "encerrado",
      "Stand-by": "standby",
    } as const;

    console.log("itens em useEvolucaoMesData:", items);

    const itensPorDia: Record<string, Item[]> = {};

    const grafico: EvolucaoEtapaDia[] = [];

    // 🎯 1 — Inicializa dias + coleta itens do dia
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dd = String(dia).padStart(2, "0");
      const mm = String(mes + 1).padStart(2, "0");

      const chaveDia = `${dd}/${mm}`;
      itensPorDia[chaveDia] = [];

      // ⬇ IMPLEMENTAÇÃO DO COMENTÁRIO
      for (const obj of items) {
        for (const etapaCampo of Object.values(etapasMap)) {
          const dataBruta = obj.datas?.[etapaCampo];
          const dataEtapa = parseToDate(dataBruta);

          if (!dataEtapa) continue;

          const mesmoDia =
            dataEtapa.getDate() === dia &&
            dataEtapa.getMonth() === mes &&
            dataEtapa.getFullYear() === ano;

          if (mesmoDia) {
            itensPorDia[chaveDia].push(obj);
            break; // já adicionou, não precisa verificar outras etapas
          }
        }
      }

      // ⬇ PUSH no gráfico já incluindo itens do dia
      grafico.push({
        dia: chaveDia,
        itens: itensPorDia[chaveDia],
        ...Object.fromEntries(Object.keys(etapasMap).map((e) => [e, 0])),
      });
    }

    // 🎯 2 — Soma quantitativos por etapa no gráfico
    for (const item of items) {
      if (vendedorSelecionado && item.vendedor !== vendedorSelecionado) continue;

      const etapaNome = item.etapa;
      const campo = etapasMap[etapaNome as keyof typeof etapasMap];
      if (!campo) continue;

      const dataEtapa = parseToDate(item.datas?.[campo]);
      if (!dataEtapa) continue;

      const dia = dataEtapa.getDate();

      if (dataEtapa.getMonth() === mes && dataEtapa.getFullYear() === ano) {
        grafico[dia - 1][etapaNome] =
          (grafico[dia - 1][etapaNome] as number) + 1;
      }
    }

    console.log("itensPorDia:", itensPorDia);
    console.log("dados useEvolucaoMesData:", grafico);

    return grafico;
  }, [items, vendedorSelecionado]);
}
