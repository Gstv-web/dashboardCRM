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

const etapasMap = {
  "Prospect - 25%": "prospect",
  "Oportunidade - 50%": "oportunidade",
  "Forecast - 75%": "forecast",
  "Contrato Firmado - 100%": "contrato",
  "Ação Pontual Firmada - 100%": "acaopontual",
  "Encerrado/Negado": "encerrado",
  "Stand-by": "standby",
} as const;

type DisplayEtapa = keyof typeof etapasMap;
type InternalEtapa = typeof etapasMap[DisplayEtapa];

type EvolucaoEtapaDiaFull = {
  dia: string;
} & {
  [K in DisplayEtapa]: number;
} & {
  [K in InternalEtapa as `${K}_objs`]: Item[];
};

function parseToDate(valor: any): Date | null {
  if (!valor) return null;
  const d = new Date(valor);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Normaliza strings para comparação (remove espaços extras e passa para minúsculas).
 * Não mexe na string original — só para matching.
 */
function normalizeKey(s: string | undefined | null) {
  return typeof s === "string" ? s.trim().toLowerCase() : "";
}

/**
 * Retorna a chave interna (ex: "prospect") dada uma etapa que pode ser:
 *  - o display ("Prospect - 25%")
 *  - a própria chave interna ("prospect")
 * Faz tentativas:
 * 1) lookup direto em etapasMap (assume item.etapa é display)
 * 2) se item.etapa parece ser uma das internals, retorna ela
 * 3) tentativa fuzzy: compara normalized strings entre displays e item.etapa
 */
function resolveCampoInternoFromEtapa(etapaRaw: string | undefined): InternalEtapa | null {
  if (!etapaRaw) return null;

  const displayKeys = Object.keys(etapasMap) as DisplayEtapa[];
  const internalValues = displayKeys.map((d) => etapasMap[d]);

  // 1) se for exatamente um display key
  if (displayKeys.includes(etapaRaw as DisplayEtapa)) {
    return etapasMap[etapaRaw as DisplayEtapa] as InternalEtapa;
  }

  // 2) se for exatamente um internal value
  if ((internalValues as string[]).includes(etapaRaw)) {
    return etapaRaw as InternalEtapa;
  }

  // 3) tentativa normalizada (remove acentos não é feita aqui; apenas toLower + trim)
  const normalized = normalizeKey(etapaRaw);
  // compara com displays normalizados
  for (const d of displayKeys) {
    if (normalizeKey(d) === normalized) return etapasMap[d] as InternalEtapa;
  }
  // compara com internals normalizados
  for (const inv of internalValues) {
    if (normalizeKey(inv) === normalized) return inv as InternalEtapa;
  }

  // nada encontrado
  return null;
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

    const displayKeys = Object.keys(etapasMap) as DisplayEtapa[];

    // inicializa gráfico com contadores e arrays de objetos (tipados)
    const grafico: EvolucaoEtapaDiaFull[] = [];

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dd = String(dia).padStart(2, "0");
      const mm = String(mes + 1).padStart(2, "0");
      const diaStr = `${dd}/${mm}`;

      // build seguro das chaves
      const base: Record<string, any> = { dia: diaStr };
      for (const display of displayKeys) {
        const internal = etapasMap[display];
        base[display] = 0;
        base[`${internal}_objs`] = [];
      }

      grafico.push(base as EvolucaoEtapaDiaFull);
    }

    // percorre items e popula
    for (const item of items) {
      if (vendedorSelecionado && item.vendedor !== vendedorSelecionado) continue;

      // tenta resolver qual é o campo interno
      const campoInterno = resolveCampoInternoFromEtapa(item.etapa);

      if (!campoInterno) {
        // log para debug: etapa não reconhecida
        console.debug("[useEvolucaoMesData] etapa não reconhecida:", item.etapa, "item.id=", item.id);
        continue;
      }

      const dataEtapa = parseToDate(item.datas?.[campoInterno]);
      if (!dataEtapa) {
        console.debug(
          "[useEvolucaoMesData] dataEtapa inválida ou ausente para item:",
          item.id,
          "campoInterno:",
          campoInterno,
          "raw:",
          item.datas?.[campoInterno]
        );
        continue;
      }

      // filtra por mês/ano atual
      if (dataEtapa.getMonth() !== mes || dataEtapa.getFullYear() !== ano) continue;

      const diaNum = dataEtapa.getDate();
      if (diaNum < 1 || diaNum > diasNoMes) continue;

      const linha = grafico[diaNum - 1];

      // precisamos do display correspondente para incrementar o contador
      // encontra display que corresponde ao campoInterno
      const displayParaEsteInternal = displayKeys.find((d) => etapasMap[d] === campoInterno)!;

      // incrementa contador
      linha[displayParaEsteInternal] = (linha[displayParaEsteInternal] as number) + 1;

      // empurra item no array de objetos (chave `${campoInterno}_objs`)
      (linha[`${campoInterno}_objs`] as Item[]).push(item);
    }

    // debug final opcional: pode comentar/remover depois
    // console.debug("useEvolucaoMesData result:", grafico);

    return grafico;
  }, [items, vendedorSelecionado]);
}
