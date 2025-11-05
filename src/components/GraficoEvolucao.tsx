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

export interface EvolucaoEtapa {
  etapa: string;
  dias7: number;
  dias14: number;
  dias21: number;
  dias30: number;
}

interface GraficoEvolucaoProps {
  dados: EvolucaoEtapa[];
}

/**
 * Gráfico de evolução das etapas ao longo de 7, 14, 21 e 30 dias
 */
export default function GraficoEvolucao({ dados }: GraficoEvolucaoProps) {
  if (!dados?.length)
    return <p className="text-gray-500 text-center">carregando gráfico...</p>;

  // 🔹 Reestrutura os dados para o formato usado pelo LineChart
  const dadosTransformados = [
    { periodo: "30 dias" },
    { periodo: "21 dias" },
    { periodo: "14 dias" },
    { periodo: "7 dias" },
  ].map((linha) => {
    const resultado: Record<string, string | number> = { periodo: linha.periodo };

    dados.forEach((etapa) => {
      const valor =
        linha.periodo === "7 dias"
          ? etapa.dias7
          : linha.periodo === "14 dias"
          ? etapa.dias14
          : linha.periodo === "21 dias"
          ? etapa.dias21
          : etapa.dias30;
      resultado[etapa.etapa] = valor;
    });

    return resultado;
  });

  const cores = [
    "#2563eb",
    "#f59e0b",
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
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
