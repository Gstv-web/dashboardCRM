import { useState } from "react";
import {
  LineChart,
  Dot,
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
  onPontoClick?: (ponto: any) => void;
}

export default function GraficoEvolucaoMes({ dados, onPontoClick }: Props) {
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

  const etapas = Object.keys(dados[0]).filter((k) => k !== "dia" && k !== "itens");
  const dias = Object.values(dados);
  console.log("printando 'Object.values':", dias);
  // console.log("dados no componente GraficoEvolucaoMes:", dados)

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <LineChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dia" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />

          {etapas.map((etapas, i) => (
            <Line
              key={etapas}
              type="monotone"
              dataKey={etapas}
              stroke={cores[i % cores.length]}
              strokeWidth={2}
              dot={(props) => (
                <Dot
                  {...props}
                  r={3}
                  onMouseEnter={() => setLinhaHover(etapas)}
                  onMouseLeave={() => setLinhaHover(null)}
                />
              )}
              activeDot={(props) => (
                <Dot
                  {...props}
                  r={5}
                  onClick={() => {
                    if (onPontoClick) {
                      // console.log("(click) props no GraficoEvolucaoMes:", props);
                      const ponto = {
                        etapa: etapas,
                        periodo: props.payload.dia,
                        valor: props.value,
                        items: props.payload.itens?.filter((item: any) => item.etapa === etapas) || [],
                      }
                      onPontoClick(ponto);
                    }
                  }}
                />
              )}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
