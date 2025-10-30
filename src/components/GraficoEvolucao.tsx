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

interface EvolucaoEtapa {
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
 * Componente que exibe a evolução das etapas ao longo de 7, 14, 21 e 30 dias.
 * Usa LineChart (Recharts)
 */
export default function GraficoEvolucao({ dados }: GraficoEvolucaoProps) {
  if (!dados?.length) return <p className="text-gray-500 text-center">Sem dados suficientes para exibir o gráfico</p>;

  // 🔹 Transformar formato [{ etapa, dias7, dias14... }]
  // em formato [{ periodo: "7 dias", Prospect: 4, Oportunidade: 3, ... }]
  const dadosTransformados = [
    { periodo: "7 dias" },
    { periodo: "14 dias" },
    { periodo: "21 dias" },
    { periodo: "30 dias" },
  ].map((linha) => {
    const periodo = linha.periodo;
    const resultado: any = { periodo };

    dados.forEach((etapa) => {
      const chave =
        periodo === "7 dias"
          ? etapa.dias7
          : periodo === "14 dias"
          ? etapa.dias14
          : periodo === "21 dias"
          ? etapa.dias21
          : etapa.dias30;

      resultado[etapa.etapa] = chave;
    });

    return resultado;
  });

  // 🔹 Cores automáticas para linhas
  const cores = [
    "#2563eb", // azul
    "#16a34a", // verde
    "#f59e0b", // amarelo
    "#dc2626", // vermelho
    "#9333ea", // roxo
    "#0ea5e9", // ciano
    "#64748b", // cinza
  ];

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <LineChart data={dadosTransformados} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
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
