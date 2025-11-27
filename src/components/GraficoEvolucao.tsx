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
  items: {
    dias7: any[];
    dias14: any[];
    dias21: any[];
    dias30: any[];
    dias60: any[];
    dias90: any[];
  };
}

interface GraficoEvolucaoProps {
  dados: EvolucaoEtapa[];
  onPontoClick?: (ponto: any) => void;
}

export default function GraficoEvolucao({ dados, onPontoClick }: GraficoEvolucaoProps) {
  const [linhaHover, setLinhaHover] = useState<string | null>(null);

  if (!dados?.length)
    return <p className="text-gray-500 text-center">carregando gráfico...</p>;

  // 🔹 Mapeamento período → chave correta dos items
  function periodoToKey(periodo: string): keyof EvolucaoEtapa["items"] {
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

  // 🔹 Reestrutura os dados
  const dadosTransformados = [
    { periodo: "90 dias" },
    { periodo: "60 dias" },
    { periodo: "30 dias" },
    { periodo: "21 dias" },
    { periodo: "14 dias" },
    { periodo: "7 dias" },
  ].map((linha) => {
    const resultado: any = { periodo: linha.periodo };

    dados.forEach((etapa) => {
      const key =
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

      resultado[etapa.etapa] = key;

      // 🔹 Adiciona corretamente os items da faixa do período
      if (!resultado.items) resultado.items = {};
      const faixa = periodoToKey(linha.periodo);
      resultado.items[etapa.etapa] = etapa.items[faixa];
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
