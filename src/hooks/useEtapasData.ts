import { useState, useEffect } from "react";
import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();

interface EtapaData {
  title: string;
  total: number;
}

export function useEtapasData(boardId: number | null) {
  const [etapas, setEtapas] = useState<EtapaData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!boardId) return;

    setIsLoading(true);
    let allItems: any[] = [];

    // função recursiva de paginação
    function fetchPage(cursor?: string) {
      const query = cursor
        ? `query { next_items_page(cursor: "${cursor}", limit: 80) { cursor items { id name column_values { id text ... on MirrorValue { id display_value } ... on FormulaValue { id value display_value } ... on BoardRelationValue { linked_item_ids display_value } } } } }`
        : `query { boards(ids: ${boardId}) { items_page(limit: 80) { cursor items { id name column_values { id text ... on MirrorValue { id display_value } ... on FormulaValue { id value display_value } ... on BoardRelationValue { linked_item_ids display_value } } } } } }`;
        console.log("Executando query:", query);
      monday
        .api(query)
        .then((res: any) => {
          let page;
          if (cursor) {
            page = res?.data?.next_items_page;
          } else {
            page = res?.data?.boards?.[0]?.items_page;
          }
          console.log("Página recebida:", page);
          if (!page) {
            console.warn("Nenhuma página retornada.");
            setIsLoading(false);
            return;
          }

          allItems = allItems.concat(page.items);
          console.log("Itens acumulados:", allItems.length);

          if (page.cursor) {
            console.log("indo pra próxima página com cursor:", page.cursor);
            // fetchPage(page.cursor); // continua paginando
            setTimeout(() => fetchPage(page.cursor), 2000);
          } else {
            console.log("Paginação finalizada. Total de itens:", allItems.length);

            // Exemplo de transformação em etapas
            const etapaTitles = [
              "Prospects",
              "Oportunidades",
              "Forecasts",
              "Contratos Firmados",
              "Stand-by",
            ];

            const etapasData: EtapaData[] = etapaTitles.map((title) => {
              const total = allItems.filter((item) =>
                item.name.includes(title)
              ).length;
              return { title, total };
            });

            setEtapas(etapasData);
            setIsLoading(false);
          }
        })
        .catch((err: any) => {
          console.error("Erro ao buscar itens do Monday:", err);
          setIsLoading(false);
        });
    }

    fetchPage(); // primeira chamada
  }, [boardId]);

  return { etapas, isLoading };
}
