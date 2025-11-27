import { useState, useMemo } from 'react';
import { useEtapasData } from './hooks/useEtapasData';
import { useMondayContext } from './hooks/useMondayContext';
import { useMondayData } from './hooks/useMondayData';
import { useEvolucaoData } from './hooks/useEvolucaoData';
import { useEvolucaoMesData } from './hooks/useEvolucaoMesData';
import CardEtapa from './components/CardEtapa';
import GraficoEvolucao from './components/GraficoEvolucao';
import GraficoEvolucaoMes from './components/GraficoEvolucaoMes';
import './App.css';

function App() {
  const { boardId } = useMondayContext();
  const { items, isLoading } = useMondayData(boardId);

  const [vendedorVisaoGeral, setVendedorVisaoGeral] = useState<string | undefined>();
  const [vendedorGrafico, setVendedorGrafico] = useState<string | undefined>();
  const [abaAtiva, setAbaAtiva] = useState<string>('Evolução Mês Atual');

  // ⭐ ADIÇÃO — estado do ponto clicado
  const [pontoSelecionado, setPontoSelecionado] = useState<any | null>(null);

  const cores = [
    "#2563eb",
    "#d8ca08ff",
    "#17d45c",
    "#135c25ff",
    "#00a84cff",
    "#da810cff",
    "#64748b",
  ];

  const vendedoresUnicos = Array.from(
    new Set(items.map((i) => i.vendedor).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const visaoGeralFiltro = useEtapasData(items, vendedorVisaoGeral);

  const itensFiltrados = useMemo(() => {
    if (!items) return [];
    return vendedorGrafico ? items.filter((i) => i.vendedor === vendedorGrafico) : items;
  }, [items, vendedorGrafico]);

  const dadosGrafico = useEvolucaoData(itensFiltrados);
  const dadosGraficoMes = useEvolucaoMesData(itensFiltrados);

  return (
    <div className="main flex flex-col items-center w-full h-full overflow-auto bg-white">
      <h1 className="text-5xl font-bold underline p-4">Dashboard CRM</h1>

      <div className="dashboard wrapper flex flex-col gap-10 w-300 justify-center m-4">

        {/* ... (todo o resto igual) */}

        {abaAtiva === "Evolução 90 dias" && (
          <>
            <div className="dashboard-filtro flex justify-between items-center p-4">
              <h2 className="font-bold">Evolução por período</h2>
              <div>
                <span className="mr-3">Filtrar por vendedor:</span>
                <select
                  className="border p-2 rounded bg-white"
                  value={vendedorGrafico || ""}
                  onChange={(e) => setVendedorGrafico(e.target.value || undefined)}
                >
                  <option value="">Todos os vendedores</option>
                  {vendedoresUnicos.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="dashboard-grafico m-2 p-2">

              {/* ⭐ ADIÇÃO — enviando callback para o gráfico */}
              <GraficoEvolucao
                dados={dadosGrafico}
                onPontoClick={(ponto) => setPontoSelecionado(ponto)}
              />

            </div>

            {/* ⭐ ADIÇÃO — renderização da lista do ponto clicado */}
            {pontoSelecionado && (
              <div className="mt-4 p-4 border rounded-xl bg-gray-50 shadow-sm">
                <h3 className="font-bold text-lg mb-2">
                  {pontoSelecionado.etapa} — {pontoSelecionado.periodo}
                </h3>

                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-100">
                      <th className="p-2 text-left">Nome</th>
                      <th className="p-2 text-left">Fechamento</th>
                      <th className="p-2 text-left">Valor</th>
                      <th className="p-2 text-left">Vendedor</th>
                      <th className="p-2 text-left">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pontoSelecionado.items?.map((item: any) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2">{item.fechamento_vendas}</td>
                        <td className="p-2">R$ {item.valor_contrato}</td>
                        <td className="p-2">{item.vendedor}</td>
                        <td className="p-2">{item.performance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </>
        )}

        {/* Evolução Mês Atual — sem mudanças */}
        {abaAtiva === "Evolução Mês Atual" && (
          <>
            {/* ... permanece igual ... */}
            <GraficoEvolucaoMes dados={dadosGraficoMes} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
