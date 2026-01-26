import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

interface GraficoTransicoesProps {
  dados: Array<{ transicao: string; total: number; items?: any[] }>;
  onBarClick?: (payload: any) => void;
}

export default function GraficoTransicoes({ dados, onBarClick }: GraficoTransicoesProps) {
  if (!dados?.length)
    return <p className="text-gray-500 text-center">carregando gráfico...</p>;

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

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <BarChart
          data={dados}
          margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="transicao"
            interval={0}
            angle={-20}
            textAnchor="end"
            height={70}
          />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />

          <Bar
            dataKey="total"
            name="Total de transições"
            onClick={(payload) => onBarClick?.(payload.payload)}
          >
            {dados.map((_, idx) => (
              <Cell key={idx} fill={cores[idx % cores.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
