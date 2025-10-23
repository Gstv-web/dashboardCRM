import { useState, useEffect } from 'react';
import { useEtapasData } from './hooks/useEtapasData';
import { useMondayContext } from './hooks/useMondayContext';
import CardEtapa from './components/CardEtapa';
import './App.css'

function App() {
  const { boardId, theme, isLoading: isContextLoading } = useMondayContext();
  const { etapas, isLoading: isEtapasLoading } = useEtapasData(boardId);
  const isLoading = isContextLoading || isEtapasLoading;
  
  return (
    <>
      <div className="flex flex-col items-center border-2 w-full h-full overflow-auto bg-white">
        <h1 className="text-5xl font-bold underline p-4">Dashboard CRM</h1>

        <div className="flex flex-col gap-10 w-4/5 justify-center border-2">
          <h2 className="font-bold ml-4 mt-2">Visão Geral</h2>

          {isLoading ? (
            <p className="text-center text-gray-500">Carregando dados...</p>
          ) : (
            <div className="flex gap-20 justify-center flex-wrap">
              {etapas.map((etapa) => (
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
