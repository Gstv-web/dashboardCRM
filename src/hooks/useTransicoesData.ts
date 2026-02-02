import { useEffect, useMemo, useState } from "react";
import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();

const STATUS_COLUMN_ID = "status6__1"; // coluna de etapa

// 🎯 TIER SYSTEM - Níveis de etapas (0-5)
const ETAPA_TIERS: Record<string, number> = {
  "Encerrado/Negado": 0,
  "Stand-by": 0,
  "Prospect - 25%": 1,
  "Oportunidade - 50%": 2,
  "Forecast - 75%": 3,
  "Forecast - 90%": 4,
  "Contrato Firmado - 100%": 5,
  "Ação Pontual Firmada - 100%": 5,
  "Operação Pró-Bono": 5,
};

export type TipoMovimento = "AVANCOU" | "REGREDIU";

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
  movimento: TipoMovimento; // AVANCOU ou REGREDIU
}

interface ActivityLog {
  id: string;
  event?: string;
  data?: any;
  created_at?: string;
  entity?: { id?: string; name?: string } | null;
}

function tryParseJSON<T>(value: any): T | null {
  if (!value) return null;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch (err) {
    return null;
  }
}

// 🎯 Calcula se foi avanço ou regressão baseado no tier system
function calcularMovimento(etapaDe: string, etapaPara: string): TipoMovimento {
  const tierDe = ETAPA_TIERS[etapaDe];
  const tierPara = ETAPA_TIERS[etapaPara];

  // Se não encontra tier em uma das etapas, considera como não classificado
  if (tierDe === undefined || tierPara === undefined) {
    return tierPara > tierDe ? "AVANCOU" : "REGREDIU";
  }

  return tierPara > tierDe ? "AVANCOU" : "REGREDIU";
}

function normalizarTexto(valor: string | undefined): string | undefined {
  if (!valor) return undefined;
  if (typeof valor !== "string") return undefined;
  return valor.replace(/\s+/g, " ").trim();
}

function converterTimestampMondayParaData(timestamp17Digitos: string | number | undefined): string {
  if (!timestamp17Digitos) return new Date().toISOString();
  
  const num = typeof timestamp17Digitos === "string" ? parseInt(timestamp17Digitos, 10) : timestamp17Digitos;
  
  // Converte 17-digit time para milissegundos
  const ms = Math.round(num / 10000);
  
  return new Date(ms).toISOString();
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
      return;
    }
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
      let debugCount = 0; // limita logs brutos

      while (true) {
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
          const data = tryParseJSON<any>(log.data) ?? {};
          const colunaId = data.columnId || data.column_id || data.column_id;
          if (colunaId && colunaId !== STATUS_COLUMN_ID) {
            // console.log("[useTransicoesData] Log descartado: coluna diferente", colunaId);
            debugCount++;
            continue;
          }

          const prevRaw = data.previousValue ?? data.previous_value ?? data.fromValue ?? data.from_value;
          const nextRaw = data.value ?? data.toValue ?? data.to_value;
          const prevParsed = tryParseJSON<any>(prevRaw);
          const nextParsed = tryParseJSON<any>(nextRaw);
        //   console.log("PREV parsed", prevParsed);

        //   const deBruto =
        //     extrairLabel(prevParsed) ??
        //     (typeof prevRaw.text === "string" ? prevRaw : prevRaw != null ? String(prevRaw) : undefined);
        //     // console.log("DE BRUTO", deBruto.text)
        //   const paraBruto =
        //     extrairLabel(nextParsed) ??
        //     (typeof nextRaw.text === "string" ? nextRaw : nextRaw != null ? String(nextRaw) : undefined);

          const deBruto = prevParsed?.label?.text || undefined;
          const paraBruto = nextParsed?.label?.text || undefined;
          
          const de = normalizarTexto(deBruto);
          const para = normalizarTexto(paraBruto);
          
        //   console.log("DE bruto:", deBruto, "→ normalizado:", de);
        //   console.log("PARA bruto:", paraBruto, "→ normalizado:", para);

          if (!de || !para) {
            // console.log("[useTransicoesData] Log descartado: sem de/para", { de, para, prevRaw, nextRaw });
            debugCount++;
            continue;
          }

          // 🎯 RASTREIA TODAS AS TRANSIÇÕES (removeu filtro TRANSICOES_INTERESSE)
          const movimento = calcularMovimento(de, para);

          // Extrai itemId - em activity_logs é "pulse_id"
          const itemId = String(
            data.pulse_id ?? 
            data.itemId ?? 
            data.item_id ?? 
            data.entity?.id ??
            ""
          );
          
          if (!itemId) {
            debugCount++;
            continue;
          }

          // Extrai itemName - em activity_logs é "pulse_name"
          const itemName = String(
            data.pulse_name ?? 
            data.itemName ?? 
            data.item_name ?? 
            data.entity?.name ??
            "Item"
          );
          
          const itemInfo = itemMap.get(itemId);

          acumulado.push({
            logId: String(log.id),
            itemId,
            itemName,
            de,
            para,
            createdAt: converterTimestampMondayParaData(log.created_at),
            vendedor: itemInfo?.vendedor,
            etapaAtual: itemInfo?.etapa ?? para,
            valor_contrato: itemInfo?.valor_contrato ?? null,
            fechamento_vendas: itemInfo?.fechamento_vendas ?? null,
            performance: itemInfo?.performance ?? null,
            movimento, // ✅ ADICIONADO: tipo de movimento (AVANCOU/REGREDIU)
          });

          debugCount++;
        }

        if (cancelado) break;
        if (logs.length < pageLimit) break;
        page += 1;
      }

      if (!cancelado) {
        setRegistros(acumulado);
        console.log("🎯 [useTransicoesData] Registros carregados:", acumulado);
        console.log("📊 Estatísticas:", {
          total: acumulado.length,
          avancos: acumulado.filter(r => r.movimento === "AVANCOU").length,
          retrocessos: acumulado.filter(r => r.movimento === "REGREDIU").length,
        });
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
