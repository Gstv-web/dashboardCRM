import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface GraficoTransicoesProps {
  dados: Array<{ 
    data: string; 
    transicoes: Array<{ transicao: string; movimento: string; total: number; items?: any[] }>; 
    totalGeral: number; 
    items?: any[] 
  }>;
  onPontoClick?: (ponto: { periodo: string; data: string; movimento: "AVANCOU" | "REGREDIU" }) => void;
}

export default function GraficoTransicoes({ dados, onPontoClick }: GraficoTransicoesProps) {
  if (!dados?.length)
    return <p className="text-gray-500 text-center">carregando gráfico...</p>;

  const handleBarClick = (
    movimento: "AVANCOU" | "REGREDIU",
    barData: any
  ) => {
    if (!onPontoClick) return;

    const payload = barData?.payload ?? barData;
    const dataIso = payload?.data;
    if (!dataIso) return;

    onPontoClick({
      periodo: formatarData(dataIso),
      data: dataIso,
      movimento,
    });
  };

  // 🎯 NOVA ESTRUTURA: Somar Avanços e Retrocessos por dia
  const dadosAgregados = dados
    .map((dataObj) => {
      let avancos = 0;
      let retrocessos = 0;

      dataObj.transicoes.forEach((tr) => {
        if (tr.movimento === "AVANCOU") {
          avancos += tr.total;
        } else if (tr.movimento === "REGREDIU") {
          retrocessos += tr.total;
        }
      });

      return {
        data: dataObj.data,
        "Avanços": avancos,
        "Retrocessos": retrocessos,
        items: dataObj.items || [],
      };
    })
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()); // ⬆️ Mais antigo → Mais novo

  // 🎨 CORES SIMPLES: Verde para Avanços, Vermelho para Retrocessos
  const cores = {
    "Avanços": "#22c55e",      // verde
    "Retrocessos": "#ef4444",  // vermelho
  };

  const formatarData = (dataIso: string) => {
    const d = new Date(dataIso);
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <BarChart
          data={dadosAgregados}
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

          <Bar
            dataKey="Avanços"
            stackId="movimento"
            fill={cores["Avanços"]}
            cursor="pointer"
            barSize={40}
            onClick={(data) => handleBarClick("AVANCOU", data)}
          />
          <Bar
            dataKey="Retrocessos"
            stackId="movimento"
            fill={cores["Retrocessos"]}
            cursor="pointer"
            barSize={40}
            onClick={(data) => handleBarClick("REGREDIU", data)}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
