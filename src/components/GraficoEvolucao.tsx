import React from "react";
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
    { periodo: "90 dias" },
    { periodo: "60 dias" },
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
              : linha.periodo === "30 dias"
                ? etapa.dias30
                : linha.periodo === "60 dias"
                  ? etapa.dias60
                  : etapa.dias90;
      resultado[etapa.etapa] = valor;
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
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={(props) => (
                <Dot
                  {...props}
                  r={6}
                  onClick={() => console.log("props", props)}
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
