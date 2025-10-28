import { useState, useEffect } from "react";
import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();

// BUSCAR ITEMS DO QUADRO PARA SEREM USADOS EM OUTROS ARQUIVOS PARA FILTRO
export function useMondayData(boardId: number | null) {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!boardId) return;
    setIsLoading(true);
    let allItems: any[] = [];

    // função recursiva de paginação
    function fetchPage(cursor?: string) {
      const query = cursor
        ? `query { next_items_page(cursor: "${cursor}", limit: 500) { cursor items { id name column_values(ids: ["status2", "status6__1", "dropdown_mksy1g2t", "pessoas1__1", "n_meros5", "formula_mkrcbxzb", "data7__1", "date2", "date", "data_mkm88e9q", "date_mkqz73j2", "date_mksxtcqj"]) { id text ... on MirrorValue { id display_value } ... on FormulaValue { id value display_value } ... on BoardRelationValue { linked_item_ids display_value } } } } }`
        : `query { boards(ids: ${boardId}) { items_page(limit: 500) { cursor items { id name column_values(ids: ["status2", "status6__1", "dropdown_mksy1g2t", "pessoas1__1", "n_meros5", "formula_mkrcbxzb", "data7__1", "date2", "date", "data_mkm88e9q", "date_mkqz73j2", "date_mksxtcqj"]) { id text ... on MirrorValue { id display_value } ... on FormulaValue { id value display_value } ... on BoardRelationValue { linked_item_ids display_value } } } } } }`;
        // console.log("Executando query:", query);
      monday
        .api(query)
        .then((res: any) => {
          let page;
          if (cursor) {
            page = res?.data?.next_items_page;
          } else {
            page = res?.data?.boards?.[0]?.items_page;
          }
        //   console.log("Página recebida:", page);
          if (!page) {
            console.warn("Nenhuma página retornada.");
            setIsLoading(false);
            return;
          }

          allItems = allItems.concat(page.items);
          console.log("Itens acumulados:", allItems.length);

          if (page.cursor) {
            // console.log("indo pra próxima página com cursor:", page.cursor);
            // fetchPage(page.cursor); // continua paginando
            setTimeout(() => fetchPage(page.cursor), 2000);
          } else {
            console.log("Paginação finalizada. ITEMS:", allItems);

            setItems(allItems);
            setIsLoading(false);
            console.log("printar etapas", items);
          }
        })
        .catch((err: any) => {
          console.error("Erro ao buscar itens do Monday:", err);
          setIsLoading(false);
        });
    }

    fetchPage(); // primeira chamada
  }, [boardId]);

  return { items, isLoading };
}


function parseYMD(s:string | null): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function diasAtras(n: number, hoje: Date): Date {
  const dt = new Date(hoje);
  dt.setUTCDate(dt.getUTCDate() - n);
  return dt;
}