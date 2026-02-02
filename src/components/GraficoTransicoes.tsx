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
  dados: Array<{ data: string; transicao: string; movimento: string; total: number; items?: any[] }>;
  onPontoClick?: (ponto: any) => void;
}

export default function GraficoTransicoes({ dados, onPontoClick }: GraficoTransicoesProps) {
  if (!dados?.length)
    return <p className="text-gray-500 text-center">carregando gráfico...</p>;

  // Agrupa dados por data, criando uma propriedade para cada transição
  const mapaDataTransicoes: Record<string, any> = {};
  const mapaDataItems: Record<string, any[]> = {}; // Armazena items por data
  const transicoesUnicas = new Set<string>();
  const tipoMovimentoPorTransicao: Record<string, string> = {}; // AVANCOU ou REGREDIU

  dados.forEach(({ data, transicao, movimento, total, items }) => {
    if (!mapaDataTransicoes[data]) {
      mapaDataTransicoes[data] = { data };
      mapaDataItems[data] = [];
    }
    mapaDataTransicoes[data][transicao] = total;
    transicoesUnicas.add(transicao);
    tipoMovimentoPorTransicao[transicao] = movimento;
    
    // Acumula todos os items daquela data
    if (items) {
      mapaDataItems[data].push(...items);
    }
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

  // 🎨 CORES: Verde para Avanço, Vermelho para Regressão
  const obterCorTransicao = (transicao: string): string => {
    const movimento = tipoMovimentoPorTransicao[transicao];
    
    if (movimento === "AVANCOU") {
      // Verdes para avanços
      const verdes = ["#22c55e", "#16a34a", "#15803d", "#166534"];
      return verdes[Object.keys(tipoMovimentoPorTransicao).filter(t => tipoMovimentoPorTransicao[t] === "AVANCOU").indexOf(transicao) % verdes.length];
    } else if (movimento === "REGREDIU") {
      // Vermelhos para retrocessos
      const vermelhos = ["#ef4444", "#dc2626", "#b91c1c", "#7f1d1d"];
      return vermelhos[Object.keys(tipoMovimentoPorTransicao).filter(t => tipoMovimentoPorTransicao[t] === "REGREDIU").indexOf(transicao) % vermelhos.length];
    }
    
    return "#9ca3af"; // cinza padrão
  };

  const formatarData = (dataIso: string) => {
    const d = new Date(dataIso);
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <BarChart
          data={dadosFormatados}
          margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
          onClick={(e: any) => {
            if (e && e.activeLabel && onPontoClick) {
              const dataClicada = e.activeLabel;
              const items = mapaDataItems[dataClicada] || [];
              onPontoClick({
                periodo: formatarData(dataClicada),
                data: dataClicada,
                items: items,
              });
            }
          }}
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

          {transicoesArray.map((transicao) => (
            <Bar
              key={transicao}
              dataKey={transicao}
              stackId="transicoes"
              fill={obterCorTransicao(transicao)}
              cursor="pointer"
              barSize={26}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
