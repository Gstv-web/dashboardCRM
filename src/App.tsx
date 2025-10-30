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
  const [vendedor, setVendedor] = useState<string | undefined>();

  // 🔹 Vendedores únicos (ordenados)
  const vendedoresUnicos = Array.from(
    new Set(items.map((i) => i.vendedor).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  // 🔹 Etapas (filtradas pelo vendedor selecionado)
  const etapas = useEtapasData(items, vendedor);

  // 🔹 Evolução (filtrada também)
  const dadosGrafico = useMemo(() => {
    if (!items) return [];
    const filtrados = vendedor
      ? items.filter((i) => i.vendedor === vendedor)
      : items;
    return useEvolucaoData(filtrados);
  }, [items, vendedor, useEvolucaoData]);

  return (
    <div className="main flex flex-col items-center border-2 w-full h-full overflow-auto bg-white">
      <h1 className="text-5xl font-bold underline p-4">Dashboard CRM</h1>

      <div className="dashboard flex flex-col gap-10 w-300 justify-center border-2 m-4">
        {/* 🔹 VISÃO GERAL */}
        <div className="dashboard-visao-geral flex flex-col p-4 border-2 bg-green-300">
          <div className="filtro flex justify-between items-center">
            <h2 className="font-bold">Visão Geral</h2>
            <select
              className="border p-2 rounded bg-white"
              value={vendedor || ''}
              onChange={(e) => setVendedor(e.target.value || undefined)}
            >
              <option value="">Todos os vendedores</option>
              {vendedoresUnicos.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <p className="text-center text-gray-500">Carregando dados...</p>
          ) : (
            <div className="flex gap-20 justify-center flex-wrap m-4">
              {etapas.map((etapa) => (
                <CardEtapa key={etapa.title} title={etapa.title} total={etapa.total} />
              ))}
            </div>
          )}
        </div>

        {/* 🔹 GRÁFICO DE EVOLUÇÃO */}
        <div className="dashboard-grafico-area">
          <div className="dashboard-filtro flex justify-between items-center p-4">
            <h2 className="font-bold">Evolução por Etapa</h2>
            <select
              className="border p-2 rounded bg-white"
              value={vendedor || ''}
              onChange={(e) => setVendedor(e.target.value || undefined)}
            >
              <option value="">Todos os vendedores</option>
              {vendedoresUnicos.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="dashboard-grafico border-2 p-2">
            <GraficoEvolucao dados={dadosGrafico} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
