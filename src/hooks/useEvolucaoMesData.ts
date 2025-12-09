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
    "prospect" | "oportunidade" | "forecast" | "contrato" | "acaopontual" | "encerrado" | "standby",
    string | Date | null | undefined
  >;
}

// mapa no escopo do módulo (reutilizável)
const etapasMap = {
  "Prospect - 25%": "prospect",
  "Oportunidade - 50%": "oportunidade",
  "Forecast - 75%": "forecast",
  "Contrato Firmado - 100%": "contrato",
  "Ação Pontual Firmada - 100%": "acaopontual",
  "Encerrado/Negado": "encerrado",
  "Stand-by": "standby",
} as const;

// tipos derivados
type DisplayEtapa = keyof typeof etapasMap; // ex: "Prospect - 25%"
type InternalEtapa = typeof etapasMap[DisplayEtapa]; // ex: "prospect"

// tipo da linha do gráfico:
// - dia: string
// - cada DisplayEtapa tem um number
// - cada InternalEtapa tem um array de Item sob a chave `${internal}_objs`
type EvolucaoEtapaDiaFull = {
  dia: string;
} & {
  [K in DisplayEtapa]: number;
} & {
  [K in InternalEtapa as `${K}_objs`]: Item[];
};

// função de parse (mantive sua original)
function parseToDate(valor: any): Date | null {
  if (!valor) return null;
  const d = new Date(valor);
  return isNaN(d.getTime()) ? null : d;
}

export function useEvolucaoMesData(
  items: Item[],
  vendedorSelecionado?: string
): EvolucaoEtapaDiaFull[] {
  return useMemo<EvolucaoEtapaDiaFull[]>(() => {
    if (!Array.isArray(items) || items.length === 0) return [];

    const now = new Date();
    const ano = now.getFullYear();
    const mes = now.getMonth();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();

    // garantimos o tipo certo das keys aqui
    const displayKeys = Object.keys(etapasMap) as DisplayEtapa[];

    // inicializa grafico com tipagem forte
    const grafico: EvolucaoEtapaDiaFull[] = [];

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dd = String(dia).padStart(2, "0");
      const mm = String(mes + 1).padStart(2, "0");
      const diaStr = `${dd}/${mm}`;

      // build de forma segura: cria um objeto com dia, contadores e arrays
      const base = displayKeys.reduce<Record<string, any>>((acc, display) => {
        const internal = etapasMap[display]; // tipo InternalEtapa
        acc[display] = 0;
        acc[`${internal}_objs`] = [];
        return acc;
      }, { dia: diaStr });

      // caste para o tipo final (seguro porque construímos as chaves explicitamente)
      grafico.push(base as EvolucaoEtapaDiaFull);
    }

    // popula contagens e arrays
    for (const item of items) {
      if (vendedorSelecionado && item.vendedor !== vendedorSelecionado) continue;

      const etapaNome = item.etapa as DisplayEtapa; // assumimos que bate com uma das displays
      // se etapaNome não está entre as displays, ignore
      if (!displayKeys.includes(etapaNome)) continue;

      const campoInterno = etapasMap[etapaNome]; // InternalEtapa
      if (!campoInterno) continue;

      const dataEtapa = parseToDate(item.datas?.[campoInterno]);
      if (!dataEtapa) continue;

      if (dataEtapa.getMonth() !== mes || dataEtapa.getFullYear() !== ano) continue;

      const diaNum = dataEtapa.getDate();
      if (diaNum < 1 || diaNum > diasNoMes) continue;

      const linha = grafico[diaNum - 1];

      // incrementa contador (garantido que existe)
      linha[etapaNome] = (linha[etapaNome] as number) + 1;

      // adiciona o item no array correspondente (chave `${internal}_objs`)
      (linha[`${campoInterno}_objs`] as Item[]).push(item);
    }

    return grafico;
  }, [items, vendedorSelecionado]);
}
