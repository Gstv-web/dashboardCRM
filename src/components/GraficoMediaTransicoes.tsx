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

export interface MediaTransicaoTipo {
  tipo: string;
  contagem: number;
  mediaPorDia: number;
  mediaPorMes?: number;
  diasEntreOcorrencias: number;
}

interface GraficoMediaTransicoesProps {
  dados: MediaTransicaoTipo[];
  diasPeriodo: number;
}

export default function GraficoMediaTransicoes({ 
  dados, 
  diasPeriodo 
}: GraficoMediaTransicoesProps) {
  if (!dados?.length) {
    return (
      <div className="text-center text-gray-500 p-8">
        <p className="text-lg mb-2">Sem dados para o período selecionado</p>
        <p className="text-sm">Ajuste os filtros ou selecione outro período</p>
      </div>
    );
  }

  // Ordenar por contagem decrescente
  const dadosOrdenados = [...dados].sort((a, b) => b.contagem - a.contagem);

  const formatarMedia = (valor: number) => {
    return valor.toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Indicador de período */}
      <div className="bg-blue-50 p-3 rounded-lg text-center">
        <span className="text-sm text-gray-600">
          Período analisado: <strong>{diasPeriodo} dias</strong>
        </span>
      </div>

      {/* Gráfico */}
      <div className="w-full h-[400px]">
        <ResponsiveContainer>
          <BarChart
            data={dadosOrdenados}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="tipo"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              label={{ value: 'Frequência', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number) => formatarMedia(value)}
              labelStyle={{ fontSize: 12 }}
            />
            <Legend />
            <Bar
              dataKey="mediaPorDia"
              name="Média/dia"
              fill="#3b82f6"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="mediaPorMes"
              name="Média/mês"
              fill="#8b5cf6"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela detalhada */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="p-3 text-left font-semibold">Tipo de Transição</th>
              <th className="p-3 text-center font-semibold">Contagem Total</th>
              <th className="p-3 text-center font-semibold">Média/dia</th>
              <th className="p-3 text-center font-semibold">Média/mês</th>
              <th className="p-3 text-center font-semibold">Dias entre ocorrências</th>
            </tr>
          </thead>
          <tbody>
            {dadosOrdenados.map((item, idx) => (
              <tr 
                key={item.tipo} 
                className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
              >
                <td className="p-3 font-medium">{item.tipo}</td>
                <td className="p-3 text-center">{item.contagem}</td>
                <td className="p-3 text-center font-semibold text-blue-600">
                  {formatarMedia(item.mediaPorDia)}
                </td>
                <td className="p-3 text-center font-semibold text-purple-600">
                  {formatarMedia(item.mediaPorMes || 0)}
                </td>
                <td className="p-3 text-center text-gray-600">
                  {formatarMedia(item.diasEntreOcorrencias)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legenda explicativa */}
      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 space-y-2">
        <p><strong>Média/dia:</strong> Quantidade média de vezes que esta transição ocorre por dia no período</p>
        <p><strong>Média/mês:</strong> Projeção mensal: quantas vezes espera-se que ocorra em 30 dias (média/dia × 30)</p>
        <p><strong>Dias entre ocorrências:</strong> Intervalo médio em dias entre cada ocorrência desta transição</p>
      </div>
    </div>
  );
}
