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
            // console.log("Paginação finalizada. ITEMS:", allItems);
            
            //DEFINIR DIAS
            // const now = new Date();
            // const hoje = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

            // const inicio7Dias = diasAtras(7, hoje);
            // const inicio14Dias = diasAtras(14, hoje);
            // const inicio21Dias  = diasAtras(21, hoje);
            // Exemplo de transformação em etapas
            const etapaTitles = [
              "Prospect - 25%",
              "Oportunidade - 50%",
              "Forecast - 75%",
              "Contrato Firmado - 100%",
              "Ação Pontual Firmada - 100%",
              "Operação Pró-Bono",
              "Stand-by",
              "Encerrado/Negado"
            ];

            const etapasData: EtapaData[] = etapaTitles.map((title) => {
              const total = allItems.filter((item) =>
                item.column_values.find((col: {id: string }) => col.id === "status6__1").text.includes(title)
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