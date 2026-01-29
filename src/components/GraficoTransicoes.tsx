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

  // Ordem específica para as transições
  const ordemTransicoes = [
    "Prospect - 25% → Oportunidade - 50%",
    "Oportunidade - 50% → Forecast - 75%",
    "Forecast - 75% → Forecast - 90%",
  ];

  const transicoesArray = Array.from(transicoesUnicas).sort((a, b) => {
    const indexA = ordemTransicoes.indexOf(a);
    const indexB = ordemTransicoes.indexOf(b);

    // Se ambas estão na lista de prioridade, ordena pela posição
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // Se só A está na lista, A vem primeiro
    if (indexA !== -1) return -1;
    // Se só B está na lista, B vem primeiro
    if (indexB !== -1) return 1;
    // Se nenhuma está na lista, mantém ordem alfabética
    return a.localeCompare(b);
  });

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
