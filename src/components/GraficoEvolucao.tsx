import React from "react";
import { useState } from "react";
import {
  LineChart,
  Line,
  Dot,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface EvolucaoEtapa {
  etapa: string;
  dias7: number;
  dias14: number;
  dias21: number;
  dias30: number;
  dias60: number;
  dias90: number;
  items?: any[];
}

interface GraficoEvolucaoProps {
  dados: EvolucaoEtapa[];
  onPontoClick?: (ponto: any) => void;
}

/**
 * Gráfico de evolução das etapas ao longo de 7, 14, 21 e 30 dias
 */
export default function GraficoEvolucao({ dados, onPontoClick }: GraficoEvolucaoProps) {
  const [linhaHover, setLinhaHover] = useState<string | null>(null);

  if (!dados?.length)
    return <p className="text-gray-500 text-center">carregando gráfico...</p>;

  // 🔹 Reestrutura os dados para o formato usado pelo LineChart
  const dadosTransformados = [
    { periodo: "90 dias" },
    { periodo: "60 dias" },
    { periodo: "30 dias" },
    { periodo: "21 dias" },
    { periodo: "14 dias" },
    { periodo: "7 dias" },
  ].map((linha) => {
    const resultado: any = { periodo: linha.periodo };
    // const resultado: Record<string, string | number> = { periodo: linha.periodo };

    dados.forEach((etapa) => {
      const valor =
        linha.periodo === "7 dias"
          ? etapa.dias7
          : linha.periodo === "14 dias"
            ? etapa.dias14
            : linha.periodo === "21 dias"
              ? etapa.dias21
              : linha.periodo === "30 dias"
                ? etapa.dias30
                : linha.periodo === "60 dias"
                  ? etapa.dias60
                  : etapa.dias90;
      resultado[etapa.etapa] = valor;

      if (!resultado.items) resultado.items = {};
      resultado.items[etapa.etapa] = etapa.items ?? [];
    });

    return resultado;
  });

  const cores = [
    "#2563eb",
    "#f8e800ff",
    "#17d45c",
    "#135c25ff",
    "#00a84cff",
    "#dc2626",
    "#da810cff",
    "#64748b",
  ];

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <LineChart
          data={dadosTransformados}
          margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="periodo" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />

          {dados.map((etapa, index) => (
            <Line
              key={etapa.etapa}
              type="monotone"
              dataKey={etapa.etapa}
              stroke={cores[index % cores.length]}
              strokeWidth={linhaHover === etapa.etapa ? 3 : 2}
              dot={(props) => (
                <Dot
                  {...props}
                  r={3}
                  onMouseEnter={() => setLinhaHover(etapa.etapa)} // 👈 hover ON
                  onMouseLeave={() => setLinhaHover(null)}        // 👈 hover OFF
                />
              )}
              activeDot={(props) => (
                <Dot
                  {...props}
                  r={5}
                  onClick={() => {
                    console.log("clicou no ponto", props);

                    if (onPontoClick) {
                      const ponto = {
                        etapa: etapa.etapa,
                        periodo: props.payload.periodo,
                        valor: props.value,

                        // se você quiser listar os itens reais
                        items: props.payload.items?.[etapa.etapa] || [],
                      };

                      onPontoClick(ponto);
                    }
                  }}
                  onMouseEnter={() => setLinhaHover(etapa.etapa)} // 👈 também destaca no activeDot
                  onMouseLeave={() => setLinhaHover(null)}
                />
              )}
            // activeDot={{ r: 8, onClick: (e) => console.log("clicou no ponto", e) }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
