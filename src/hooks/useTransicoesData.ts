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
    if (!boardId) return;
    let cancelado = false;

    async function carregar() {
      setIsLoading(true);
      setError(null);

      const limiteDias = 90;
      const sinceDate = new Date(Date.now() - limiteDias * 24 * 60 * 60 * 1000);
      const sinceMs = sinceDate.getTime();

      const pageLimit = 200;
      let page = 1;
      const acumulado: TransicaoRegistro[] = [];

      while (true) {
        const query = `query($boardIds: [Int], $page: Int, $limit: Int) {\n          audit_logs(board_ids: $boardIds, page: $page, limit: $limit) {\n            id\n            event\n            data\n            created_at\n            entity { ... on Item { id name } }\n          }\n        }`;

        let response: any;
        try {
          response = await monday.api(query, {
            variables: { boardIds: [boardId], page, limit: pageLimit },
          });
        } catch (err: any) {
          if (cancelado) return;
          console.error("Erro ao buscar audit_logs:", err);
          setError("Falha ao buscar logs de atividade.");
          setIsLoading(false);
          break;
        }

        const logs: ActivityLog[] = response?.data?.audit_logs ?? [];
        if (!logs.length) break;

        for (const log of logs) {
          const data = tryParseJSON<any>(log.data) ?? {};
          const colunaId = data.columnId || data.column_id;
          if (colunaId && colunaId !== STATUS_COLUMN_ID) continue;

          const prevRaw = data.previousValue ?? data.previous_value ?? data.fromValue ?? data.from_value;
          const nextRaw = data.value ?? data.toValue ?? data.to_value;
          const prevParsed = tryParseJSON<any>(prevRaw);
          const nextParsed = tryParseJSON<any>(nextRaw);

          const de = extrairLabel(prevParsed);
          const para = extrairLabel(nextParsed);
          if (!de || !para) continue;

          const transicaoEsperada = TRANSICOES_INTERESSE.find(
            (t) => t.de === de && t.para === para
          );
          if (!transicaoEsperada) continue;

          const itemId = String(log.entity?.id ?? data.itemId ?? data.item_id ?? "");
          if (!itemId) continue;

          const itemName = log.entity?.name ?? data.itemName ?? data.item_name ?? "Item";
          const itemInfo = itemMap.get(itemId);
          const createdAtMs = new Date(log.created_at || new Date().toISOString()).getTime();
          
          // filtro por data (últimos 90 dias)
          const sinceDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).getTime();
          if (createdAtMs < sinceDate) continue;

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
        }

        if (cancelado) break;
        if (logs.length < pageLimit) break;
        page += 1;
      }

      if (!cancelado) {
        setRegistros(acumulado);
        setIsLoading(false);
      }
    }

    carregar();

    return () => {
      cancelado = true;
    };
  }, [boardId, itemMap]);

  return { registros, isLoading, error };
}
