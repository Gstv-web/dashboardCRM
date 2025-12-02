import React, { useState } from "react";
import { EvolucaoEtapa, PeriodoChave } from "../hooks/useEvolucaoData";
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

interface Item {
  id: string;
  name: string;
  fechamento_vendas?: string;
  valor_contrato?: number;
  vendedor?: string;
  etapa?: string;
  performance?: string;
}

interface GraficoEvolucaoProps {
  dados: EvolucaoEtapa[];
  onPontoClick?: (ponto: any) => void;
}

export default function GraficoEvolucao({ dados, onPontoClick }: GraficoEvolucaoProps) {
  const [linhaHover, setLinhaHover] = useState<string | null>(null);

  if (!dados?.length)
    return <p className="text-gray-500 text-center">carregando gráfico...</p>;

  /** 🔹 Converte "7 dias" → "dias7" */
  function periodoToKey(periodo: string): PeriodoChave {
    switch (periodo) {
      case "7 dias": return "dias7";
      case "14 dias": return "dias14";
      case "21 dias": return "dias21";
      case "30 dias": return "dias30";
      case "60 dias": return "dias60";
      case "90 dias": return "dias90";
      default: return "dias7";
    }
  }

  /** 🔹 Reestrutura dados para o gráfico */
  const dadosTransformados = [
    { periodo: "90 dias" },
    { periodo: "60 dias" },
    { periodo: "30 dias" },
    { periodo: "21 dias" },
    { periodo: "14 dias" },
    { periodo: "7 dias" },
  ].map((linha) => {
    const resultado: any = { periodo: linha.periodo };
    const key = periodoToKey(linha.periodo);

    dados.forEach((etapa) => {
      // valores numéricos da linha — AGORA CORRETO
      resultado[etapa.etapa] = etapa.items[key].length;

      // itens da faixa
      if (!resultado.items) resultado.items = {};
      resultado.items[etapa.etapa] = etapa.items[key];
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
                  onMouseEnter={() => setLinhaHover(etapa.etapa)}
                  onMouseLeave={() => setLinhaHover(null)}
                />
              )}
              activeDot={(props) => (
                <Dot
                  {...props}
                  r={5}
                  onClick={() => {
                    if (onPontoClick) {
                      const ponto = {
                        etapa: etapa.etapa,
                        periodo: props.payload.periodo,
                        valor: props.value,
                        items: props.payload.items?.[etapa.etapa] || [],
                      };
                      onPontoClick(ponto);
                    }
                  }}
                  onMouseEnter={() => setLinhaHover(etapa.etapa)}
                  onMouseLeave={() => setLinhaHover(null)}
                />
              )}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
