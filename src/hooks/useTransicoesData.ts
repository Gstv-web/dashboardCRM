import { useEffect, useMemo, useState } from "react";
import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();

const STATUS_COLUMN_ID = "status6__1"; // coluna de etapa

export interface TransicaoRegistro {
  logId: string;
  itemId: string;
  itemName: string;
  de: string;
  para: string;
  createdAt: string;
  vendedor?: string;
  etapaAtual?: string;
  valor_contrato?: string | number | null;
  fechamento_vendas?: string | null;
  performance?: string | null;
}

interface ActivityLog {
  id: string;
  event?: string;
  data?: any;
  created_at?: string;
  entity?: { id?: string; name?: string } | null;
}

const TRANSICOES_INTERESSE: Array<{ de: string; para: string }> = [
  { de: "Prospect - 25%", para: "Oportunidade - 50%" },
  { de: "Oportunidade - 50%", para: "Forecast - 75%" },
  { de: "Forecast - 75%", para: "Forecast - 90%" },
  { de: "Forecast - 90%", para: "Contrato Firmado - 100%" },
  { de: "Forecast - 90%", para: "Ação Pontual Firmada - 100%" },
  { de: "Forecast - 90%", para: "Operação Pró-Bono" },
];

function tryParseJSON<T>(value: any): T | null {
  if (!value) return null;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch (err) {
    return null;
  }
}

function extrairLabel(obj: any): string | undefined {
  if (!obj) return undefined;
  return obj.label || obj.text || obj.title || obj.name;
}

function normalizarTexto(valor: string | undefined): string | undefined {
  if (!valor) return undefined;
  if (typeof valor !== "string") return undefined;
  return valor.replace(/\s+/g, " ").trim();
}

export function useTransicoesData(boardId: number | null, items: any[]) {
  const [registros, setRegistros] = useState<TransicaoRegistro[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // mapa auxiliar para enriquecer com vendedor e outros campos
  const itemMap = useMemo(() => {
    const map = new Map<string, any>();
    items.forEach((it: any) => {
      if (it?.id != null) map.set(String(it.id), it);
    });
    return map;
  }, [items]);

  useEffect(() => {
    if (!boardId) {
      console.log("[useTransicoesData] Sem boardId, abortando");
      return;
    }
    console.log("[useTransicoesData] Iniciando busca com boardId:", boardId);
    let cancelado = false;

    async function carregar() {
      console.log("[useTransicoesData] Função carregar() iniciada");
      setIsLoading(true);
      setError(null);

      const limiteDias = 90;
      const sinceDate = new Date(Date.now() - limiteDias * 24 * 60 * 60 * 1000);
      const sinceMs = sinceDate.getTime();

      const pageLimit = 200;
      let page = 1;
      const acumulado: TransicaoRegistro[] = [];
      let debugCount = 0; // limita logs brutos

      while (true) {
        console.log("[useTransicoesData] Buscando página", page);
        const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const to = new Date().toISOString();
        
        const query = `query {
          boards(ids: [${boardId}]) {
            activity_logs(
              from: "${from}"
              to: "${to}"
              limit: ${pageLimit}
              page: ${page}
              column_ids: ["${STATUS_COLUMN_ID}"]
            ) {
              id
              event
              data
              created_at
              user_id
              account_id
              entity
            }
          }
        }`;

        let response: any;
        try {
        //   console.log("[useTransicoesData] Executando query da página", page);
          response = await monday.api(query);
        //   console.log("[useTransicoesData] Resposta recebida da página", page);
        } catch (err: any) {
          if (cancelado) return;
        //   console.error("[useTransicoesData] ERRO ao buscar activity_logs:", err);
          setError("Falha ao buscar logs de atividade.");
          setIsLoading(false);
          break;
        }

        const logs: ActivityLog[] = response?.data?.boards?.[0]?.activity_logs ?? [];
        // console.log("[useTransicoesData] Página", page, 'retornou', logs.length, 'logs');
        for (const log of logs) {
          if (debugCount < 20) {
            console.log("[useTransicoesData][RAW] log:", {
              event: log.event,
              data: log.data,
              created_at: log.created_at,
            });
          }

          const data = tryParseJSON<any>(log.data) ?? {};
        //   console.log("DATA", data)
          const colunaId = data.columnId || data.column_id;
          if (colunaId && colunaId !== STATUS_COLUMN_ID) {
            // console.log("[useTransicoesData] Log descartado: coluna diferente", colunaId);
            debugCount++;
            continue;
          }

          const prevRaw = data.previousValue ?? data.previous_value ?? data.fromValue ?? data.from_value;
          const nextRaw = data.value ?? data.toValue ?? data.to_value;
          const prevParsed = tryParseJSON<any>(prevRaw);
          const nextParsed = tryParseJSON<any>(nextRaw);

          const deBruto =
            extrairLabel(prevParsed) ??
            (typeof prevRaw === "string" ? prevRaw : prevRaw != null ? String(prevRaw) : undefined);
            console.log("DE BRUTO", deBruto)
          const paraBruto =
            extrairLabel(nextParsed) ??
            (typeof nextRaw === "string" ? nextRaw : nextRaw != null ? String(nextRaw) : undefined);

          const de = normalizarTexto(deBruto);
          const para = normalizarTexto(paraBruto);

          if (!de || !para) {
            // console.log("[useTransicoesData] Log descartado: sem de/para", { de, para, prevRaw, nextRaw });
            debugCount++;
            continue;
          }

          const transicaoEsperada = TRANSICOES_INTERESSE.find(
            (t) => normalizarTexto(t.de) === de && normalizarTexto(t.para) === para
          );
          if (!transicaoEsperada) {
            // console.log("[useTransicoesData] Log descartado: transição não está em TRANSICOES_INTERESSE", { de, para });
            debugCount++;
            continue;
          }

          const itemId = String(data.item?.id ?? data.itemId ?? data.item_id ?? "");
          if (!itemId) {
            // console.log("[useTransicoesData] Log descartado: sem itemId");
            debugCount++;
            continue;
          }

          const itemName = data.item?.name ?? data.itemName ?? data.item_name ?? "Item";
          const itemInfo = itemMap.get(itemId);

          console.log("[useTransicoesData] Log ACEITO:", { de, para, itemId, itemName });
          acumulado.push({
            logId: String(log.id),
            itemId,
            itemName,
            de,
            para,
            createdAt: log.created_at || new Date().toISOString(),
            vendedor: itemInfo?.vendedor,
            etapaAtual: itemInfo?.etapa ?? para,
            valor_contrato: itemInfo?.valor_contrato ?? null,
            fechamento_vendas: itemInfo?.fechamento_vendas ?? null,
            performance: itemInfo?.performance ?? null,
          });

          debugCount++;
        }

        if (cancelado) break;
        if (logs.length < pageLimit) break;
        page += 1;
      }

      if (!cancelado) {
        console.log("LOGS FINAIS - Total de transições encontradas:", acumulado.length, acumulado);
        setRegistros(acumulado);
        setIsLoading(false);
      }
    }

    carregar();

    return () => {
      cancelado = true;
    };
  }, [boardId, itemMap]);
  console.log("Registros de transições (useTransicoesData):", registros);

  return { registros, isLoading, error };
}
