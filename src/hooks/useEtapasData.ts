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
        if (!boardId) return; // não faz nada se não houver boardId

        async function fetchAllItems() {
            setIsLoading(true);
            let allItems: any[] = [];
            let cursor: string | null = null;

            try {
                do {
                    const query: string = `query {
                        boards(ids: ${boardId}) {
                            items_page(limit: 500${cursor ? `, after: "${cursor}"` : ""}) {
                                items {
                                    id
                                    name
                                    column_values {
                                        id
                                        text
                                        ... on MirrorValue { id display_value }
                                        ... on FormulaValue { id value display_value }
                                        ... on BoardRelationValue { linked_item_ids display_value }
                                    }
                                }
                            cursor
                            }
                        }
                    }`;

                    const res = await monday.api(query);
                    console.log("Resposta da API:", res);
                    const page = res.data?.boards?.[0]?.items_page;
                    console.log("Página retornada:", page);
                    if (!page) break;

                    allItems = allItems.concat(page.items);
                    cursor = page.cursor || null;
                } while (cursor);

                // Transformar os itens em etapas
                // Por enquanto mantemos mock por título, mas total vem do allItems
                const etapaTitles = ["Prospects", "Oportunidades", "Forecasts", "Contratos Firmados", "Stand-by"];
                const etapasData: EtapaData[] = etapaTitles.map((title) => {
                    // aqui você pode filtrar `allItems` por alguma coluna para contar
                    const total = allItems.filter(item => item.name.includes(title)).length;
                    return { title, total };
                });

                setEtapas(etapasData);
            } catch (error) {
                console.error("Erro ao buscar itens do Monday:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAllItems();
    }, [boardId]);

    return { etapas, isLoading };
}
