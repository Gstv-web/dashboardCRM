import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface EvolucaoEtapaMes {
  etapa: string;
  total: number; // total da etapa no mês atual
}

interface GraficoEvolucaoMesProps {
  dados: EvolucaoEtapaMes[];
}

/**
 * Gráfico de evolução por etapa — mês atual
 */
export default function GraficoEvolucaoMes({ dados }: GraficoEvolucaoMesProps) {
  if (!dados?.length)
    return <p className="text-gray-500 text-center">carregando gráfico...</p>;

  // 🔹 Estrutura única para o mês atual
  const dadosTransformados: Record<string, number | string> = {
    periodo: "Mês Atual",
  };

  dados.forEach((etapa) => {
    dadosTransformados[etapa.etapa] = etapa.total;
  });

  const cores = [
    "#2563eb",
    "#f8e800ff",
    "#17d45c",
    "#135c25ff",
    "#dc2626",
    "#da810cff",
    "#64748b",
  ];

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <LineChart
          data={[dadosTransformados]} // só 1 ponto
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
              strokeWidth={3}
              dot={{ r: 6 }}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
