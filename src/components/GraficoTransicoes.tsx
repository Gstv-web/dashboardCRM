import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface GraficoTransicoesProps {
  dados: Array<{ data: string; transicao: string; total: number }>;
  onBarClick?: (payload: any) => void;
}

export default function GraficoTransicoes({ dados }: GraficoTransicoesProps) {
  if (!dados?.length)
    return <p className="text-gray-500 text-center">carregando gráfico...</p>;

  // Agrupa dados por data, criando uma propriedade para cada transição
  const mapaDataTransicoes: Record<string, any> = {};
  const transicoesUnicas = new Set<string>();

  dados.forEach(({ data, transicao, total }) => {
    if (!mapaDataTransicoes[data]) {
      mapaDataTransicoes[data] = { data };
    }
    mapaDataTransicoes[data][transicao] = total;
    transicoesUnicas.add(transicao);
  });

  const dadosFormatados = Object.values(mapaDataTransicoes).sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
  );

  const transicoesArray = Array.from(transicoesUnicas);

  const cores = [
    "#2563eb",
    "#f8e800ff",
    "#17d45c",
    "#464e49ff",
    "#135c25ff",
    "#00a84cff",
    "#dc2626",
    "#da810cff",
    "#64748b",
  ];

  const formatarData = (dataIso: string) => {
    const d = new Date(dataIso);
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <LineChart
          data={dadosFormatados}
          margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="data"
            tickFormatter={formatarData}
            angle={-20}
            textAnchor="end"
            height={70}
          />
          <YAxis allowDecimals={false} />
          <Tooltip
            labelFormatter={(value) => formatarData(value as string)}
          />
          <Legend />

          {transicoesArray.map((transicao, idx) => (
            <Line
              key={transicao}
              type="monotone"
              dataKey={transicao}
              stroke={cores[idx % cores.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
