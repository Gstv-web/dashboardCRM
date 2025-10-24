import { useState, useEffect } from "react";
import mondaySdk from "monday-sdk-js";

interface EtapaData {
    title: string;
    total: number;
}

const monday = mondaySdk();

export function useEtapasData(boardId: number | null) {
    const [etapas, setEtapas] = useState<EtapaData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!boardId) return;

        setIsLoading(true);
        let allItems: any[] = [];
        let cursor: string | null = null;

        function fetchPage() {
            const query = cursor
                ? `query { next_items_page(cursor: "${cursor}") { cursor items { id name column_values { id text ... on MirrorValue { id display_value } ... on FormulaValue { id value display_value } ... on BoardRelationValue { linked_item_ids display_value } } } } }`
                : `query { boards(ids: ${boardId}) { items_page { cursor items { id name column_values { id text ... on MirrorValue { id display_value } ... on FormulaValue { id value display_value } ... on BoardRelationValue { linked_item_ids display_value } } } } } }`;
            console.log("Executando query:", query);
            monday.api(query).then(res => {
                const page = cursor ? res.data?.next_items_page : res.data?.boards?.[0]?.items_page;
                console.log("resposta:", res)
                console.log("page:", page)
                if (!page) {
                    setIsLoading(false);
                    return;
                }
                allItems = allItems.concat(page.items);
                cursor = page.cursor || null;
                console.log("cursor atual:", cursor)

                if (cursor) {
                    fetchPage(); // continua paginando
                } else {
                    console.log("Todos os itens carregados:", allItems)
                    const etapaTitles = ["Prospects", "Oportunidades", "Forecasts", "Contratos Firmados", "Stand-by"];
                    const etapasData: EtapaData[] = etapaTitles.map((title) => {
                        const total = allItems.filter(item => item.name.includes(title)).length;
                        return { title, total };
                    });

                    setEtapas(etapasData);
                    setIsLoading(false);
                }
            }).catch(err => {
                console.error("Erro ao buscar itens do Monday:", err);
                setIsLoading(false);
            });
        }


        fetchPage(); // inicia a primeira página
    }, [boardId]);

    return { etapas, isLoading };
}
