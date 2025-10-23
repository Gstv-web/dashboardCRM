import { useState, useEffect } from 'react'
import CardEtapa from './components/CardEtapa';
import './App.css'
import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();
interface MondayContext {
  boardId?: number,
  theme?: string,
  [key: string]: any // permite eu escolher outras propriedades dinamicamente
}

function App() {
  const [boardId, setBoardId] = useState<number | null>(null);
  const [theme, setTheme] = useState<string>("light");
  // useEffect será usado aqui pra levantar os dados. Talvez dê pra usar um arquivo separado para ter menos linhas aqui.
  useEffect(() => {
    async function fetchContext() {
      try {
        const res = await monday.get("context");
        const context: MondayContext = res?.data || {}; // garante que é um objeto, mesmo se undefined
        console.log("Contexto retornado:", context);

        // Board ID: usa o do contexto, senão fallback manual
        const id = context.boardId || 3591217049;
        setBoardId(id);
        console.log("Board ID definido:", id);

        // Tema: usa o do contexto se existir, senão 'light'
        const currentTheme = context.theme || "light";
        setTheme(currentTheme);
        console.log(`Tema definido: ${currentTheme}`);

      } catch (err) {
        console.error("Erro ao obter contexto do Monday:", err);
        // fallback seguro mesmo em caso de erro
        setBoardId(3591217049);
        setTheme("light");
      }
    }

    fetchContext();
  }, []);
  const [totalProspects, setTotalProspects] = useState(0)
  return (
    <>
      <div className="flex flex-col items-center border-2 w-full h-full overflow-auto">
        <h1 className="text-5xl font-bold underline p-4">Dashboard CRM</h1>
        <div className="flex flex-col gap-10 w-4/5 justify-center border-2">
          <h2 className="font-bold ml-4 mt-2">Visão Geral</h2>
          <div className="flex gap-20 justify-center">
            <CardEtapa title="Prospects" total={totalProspects} />
            <CardEtapa title="Oportunidades" total={totalProspects} />
            <CardEtapa title="Forecasts" total={totalProspects} />
            <CardEtapa title="Contratos Firmados" total={totalProspects} />
            <CardEtapa title="Stand-by" total={totalProspects} />
          </div>
        </div>
      </div>
    </>
  )
}

export default App
