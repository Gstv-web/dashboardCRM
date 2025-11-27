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

  // cores para os cards
  const cores = [
    "#2563eb",
    "#d8ca08ff",
    "#17d45c",
    "#135c25ff",
    "#00a84cff",
    "#da810cff",
    "#64748b",
  ];

  // Vendedores únicos
  const vendedoresUnicos = Array.from(
    new Set(items.map((i) => i.vendedor).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  // Visão Geral
  const visaoGeralFiltro = useEtapasData(items, vendedorVisaoGeral);

  // Filtrar vendedores no gráfico
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

        {/* 🔹 VISÃO GERAL COM CARDS (NÃO FOI REMOVIDO!) */}
        <div className="dashboard-visao-geral flex flex-col p-4 border-2 border-gray-300 border-opacity-25 rounded-2xl bg-white">

          <div className="filtro flex justify-between items-center">
            <h2 className="font-bold">Visão Geral</h2>

            <div>
              <span className="mr-3">Filtrar por vendedor:</span>
              <select
                className="border p-2 rounded bg-white"
                value={vendedorVisaoGeral || ''}
                onChange={(e) => setVendedorVisaoGeral(e.target.value || undefined)}
              >
                <option value="">Todos os vendedores</option>
                {vendedoresUnicos.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <p className="text-center text-gray-500">Carregando dados...</p>
          ) : (
            <div className="flex gap-20 justify-center flex-wrap m-4">
              {visaoGeralFiltro.map((etapa, index) => (
                <CardEtapa
                  key={etapa.title}
                  title={etapa.title}
                  total={etapa.total}
                  titleColor={cores[index % cores.length]}
                />
              ))}
            </div>
          )}
        </div>

        {/* 🔹 GRÁFICO COM ABAS */}
        <div className="dashboard-grafico-area border-2 border-opacity-25 border-gray-300 rounded-2xl">

          <div className="flex border-b border-gray-300">
            {["Evolução Mês Atual", "Evolução 90 dias"].map((aba, i) => (
              <button
                key={i}
                onClick={() => setAbaAtiva(aba)}
                className={`px-6 py-3 font-semibold transition-colors duration-200 ${
                  abaAtiva === aba
                    ? "border-b-4 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {aba}
              </button>
            ))}
          </div>

          {/* Conteúdo das abas */}
          <div className="p-4">
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
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="dashboard-grafico m-2 p-2">
                  <GraficoEvolucao
                    dados={dadosGrafico}

                    // ⭐ ADIÇÃO — recebendo clique do ponto
                    onPontoClick={(p) => setPontoSelecionado(p)}
                  />
                </div>

                {/* ⭐ ADIÇÃO — lista do ponto clicado */}
                {pontoSelecionado && (
                  <div className="mt-4 p-4 border rounded-xl bg-gray-50 shadow-sm">
                    <h3 className="font-bold text-lg mb-3">
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

            {abaAtiva === "Evolução Mês Atual" && (
              <>
                <div className="dashboard-filtro flex justify-between items-center p-4">
                  <h2 className="font-bold">Evolução no mês atual</h2>

                  <div>
                    <span className="mr-3">Filtrar por vendedor:</span>
                    <select
                      className="border p-2 rounded bg-white"
                      value={vendedorGrafico || ""}
                      onChange={(e) => setVendedorGrafico(e.target.value || undefined)}
                    >
                      <option value="">Todos os vendedores</option>
                      {vendedoresUnicos.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="dashboard-grafico m-2 p-2">
                  <GraficoEvolucaoMes dados={dadosGraficoMes} />
                </div>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
