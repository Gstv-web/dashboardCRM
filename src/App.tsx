import { useState } from 'react';
import { useEtapasData } from './hooks/useEtapasData';
import { useMondayContext } from './hooks/useMondayContext';
import { useMondayData } from './hooks/useMondayData';
import CardEtapa from './components/CardEtapa';
import './App.css';

function App() {
  const { boardId } = useMondayContext();
  const { items, isLoading } = useMondayData(boardId);
  const [vendedor, setVendedor] = useState<string | undefined>();

  // Gera etapas gerais
  const etapasGerais = useEtapasData(items);

  // Filtro de vendedores únicos (ordenados)
  const vendedoresUnicos = Array.from(
    new Set(
      items
        .map((i) =>
          i.column_values.find(
            (c: { id: string; text: string }) => c.id === 'dropdown_mksy1g2t'
          )?.text
        )
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  // 🔍 Filtra os itens pelo vendedor selecionado (caso exista)
  const itensFiltrados = vendedor
    ? items.filter((item) => {
      const vendedorCol = item.column_values.find(
        (c: { id: string; text: string }) => c.id === 'dropdown_mksy1g2t'
      )?.text;
      return vendedorCol === vendedor;
    })
    : items;

  // 🔢 Recalcula as etapas com base no filtro
  const etapasFiltradas = useEtapasData(itensFiltrados);

  return (
    <div className="main flex flex-col items-center border-2 w-full h-full overflow-auto bg-white">
      <h1 className="text-5xl font-bold underline p-4">Dashboard CRM</h1>

      <div className="dashboard flex flex-col gap-10 w-4/5 justify-center border-2 m-4 bg-blue-300">
        <div className="dashboard-visao-geral flex justify-between items-center p-4 border-2 bg-green-300">
          <h2 className="font-bold">Visão Geral</h2>
          <select
            className="border p-2 rounded bg-white"
            value={vendedor || ''}
            onChange={(e) =>
              setVendedor(e.target.value || undefined)
            }
          >
            <option value="">Todos os vendedores</option>
            {vendedoresUnicos.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          {isLoading ? (
            <p className="text-center text-gray-500">Carregando dados...</p>
          ) : (
            <div className="flex gap-20 justify-center flex-wrap m-4">
              {(vendedor ? etapasFiltradas : etapasGerais).map((etapa) => (
                <CardEtapa key={etapa.title} title={etapa.title} total={etapa.total} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
