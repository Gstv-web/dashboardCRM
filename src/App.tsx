import { useState, useMemo } from 'react';
import { useEtapasData } from './hooks/useEtapasData';
import { useMondayContext } from './hooks/useMondayContext';
import { useMondayData } from './hooks/useMondayData';
import { useEvolucaoData } from './hooks/useEvolucaoData';
import CardEtapa from './components/CardEtapa';
import GraficoEvolucao from './components/GraficoEvolucao';
import './App.css';

function App() {
  const { boardId } = useMondayContext();
  const { items, isLoading } = useMondayData(boardId);
  const [vendedorVisaoGeral, setVendedorVisaoGeral] = useState<string | undefined>();
  const [vendedorGrafico, setVendedorGrafico] = useState<string | undefined>();
  const [abaAtiva, setAbaAtiva] = useState<string>('Evolução 90d'); // 🔹 nova aba ativa

  // cores para os cards
  const cores = [
    "#2563eb",
    "#d8ca08ff",
    "#17d45c",
    "#135c25ff",
    "#dc2626",
    "#da810cff",
    "#64748b",
  ];

  // 🔹 Vendedores únicos (ordenados)
  const vendedoresUnicos = Array.from(
    new Set(items.map((i) => i.vendedor).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  // 🔹 Visão geral
  const visaoGeralFiltro = useEtapasData(items, vendedorVisaoGeral);

  // 🔹 Gráfico
  const itensFiltrados = useMemo(() => {
    if (!items) return [];
    return vendedorGrafico ? items.filter((i) => i.vendedor === vendedorGrafico) : items;
  }, [items, vendedorGrafico]);

  const dadosGrafico = useEvolucaoData(itensFiltrados);

  return (
    <div className="main flex flex-col items-center w-full h-full overflow-auto bg-white">
      <h1 className="text-5xl font-bold underline p-4">Dashboard CRM</h1>

      <div className="dashboard wrapper flex flex-col gap-10 w-300 justify-center m-4">
        {/* 🔹 VISÃO GERAL */}
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
                  <option key={v} value={v}>
                    {v}
                  </option>
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
                  titleColor={cores[index % cores.length]} // 🔹 aplica cores
                />
              ))}
            </div>
          )}
        </div>

        {/* 🔹 GRÁFICO DE EVOLUÇÃO COM ABAS */}
        <div className="dashboard-grafico-area border-2 border-opacity-25 border-gray-300 rounded-2xl">
          {/* Abas */}
          <div className="flex border-b border-gray-300">
            {["Evolução 90d", "Comparativo"].map((aba, i) => (
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
            {abaAtiva === "Evolução 90d" && (
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
                  <GraficoEvolucao dados={dadosGrafico} />
                </div>
              </>
            )}

            {abaAtiva === "Comparativo" && (
              <div className="flex justify-center items-center h-64 text-gray-500">
                <p>🚧 Aqui entrará outros gráficos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
