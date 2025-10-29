import { useState, useEffect } from 'react';
import { useEtapasData } from './hooks/useEtapasData';
import { useMondayContext } from './hooks/useMondayContext';
import { useMondayData } from './hooks/useMondayData';
import CardEtapa from './components/CardEtapa';
import './App.css'

function App() {
  const { boardId, theme, isLoading: isContextLoading } = useMondayContext();
  const { items, isLoading} = useMondayData(boardId);
  const [vendedor, setVendedor] = useState<string | undefined>();
  const etapas = useEtapasData(items)
  
  // console.log("Etapas carregadas:", etapas);

  const vendedoresUnicos = Array.from(new Set(items.map((i) => i.column_values.find((c: {id: string, text:string}) => c.id === "dropdown_mksy1g2t")?.text).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const etapasPorVendedor = useEtapasData(vendedoresUnicos);
  return (
    <>
      <div className="flex flex-col items-center border-2 w-full h-full overflow-auto bg-white m-4">
        <h1 className="text-5xl font-bold underline p-4">Dashboard CRM</h1>

        <div className="flex flex-col gap-10 w-4/5 justify-center border-2 m-4">
          <h2 className="font-bold ml-4 mt-2">Visão Geral</h2>

          {/* Filtro por vendedor */}
          <select className="border rounded-md p-2 text-sm" value={vendedor || ''} onChange={(e) => setVendedor(e.target.value || undefined)}>
            <option value="">Geral (todos os vendedores)</option>
            {vendedoresUnicos.map((v) => (<option key={v} value={v}>{v}</option>))}
          </select>

          {isLoading ? (
            <p className="text-center text-gray-500">Carregando dados...</p>
          ) : (
            <div className="flex gap-20 justify-center flex-wrap m-4">
              {(vendedor ? vendedoresUnicos : etapas).map((etapa) => (
                <CardEtapa
                  key={etapa.title}
                  title={etapa.title}
                  total={etapa.total}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default App
