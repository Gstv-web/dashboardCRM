import { useState } from "react";
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

interface Props {
  dados: any[];
  onPontoClcick?: (ponto: any) => void;
}

export default function GraficoEvolucaoMes({ dados, onPontoClcick }: Props) {
  const [linhaHover, setLinhaHover] = useState<string | null>(null);
  if (!dados?.length)
    return <p className="text-gray-500 text-center">carregando gráfico...</p>;

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

  const etapas = Object.keys(dados[0]).filter((k) => k !== "dia");
  console.log("const etapas em GraficoEvolucaoMes:", etapas)

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <LineChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dia" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />

          {etapas.map((etapa, i) => (
            <Line
              key={etapa}
              type="monotone"
              dataKey={etapa}
              stroke={cores[i % cores.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
