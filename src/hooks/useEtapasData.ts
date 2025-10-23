import { useState, useEffect } from "react";
import mondaySdk from "monday-sdk-js";

interface EtapaData {
    title: string;
    total: number;
}
const monday = mondaySdk();
interface MondayContext {
    boardId?: number,
    theme?: string,
    [key: string]: any // permite eu escolher outras propriedades dinamicamente
}

export function useEtapasData(id: number| null) {
    const [etapas, setEtapas] = useState<EtapaData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);


    useEffect(() => {
        async function fetchMockedData() {
            setIsLoading(true);

            // simulação de requisição (pode virar API ou Monday API depois)
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const mockData: EtapaData[] = [
                { title: "Prospects", total: 24 },
                { title: "Oportunidades", total: 15 },
                { title: "Forecasts", total: 10 },
                { title: "Contratos Firmados", total: 8 },
                { title: "Stand-by", total: 5 },
            ];

            setEtapas(mockData);
            setIsLoading(false);
        }

        fetchMockedData();
    }, []);

    return { etapas, isLoading };
}
