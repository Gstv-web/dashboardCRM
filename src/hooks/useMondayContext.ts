import { useState, useEffect } from "react";
import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();

interface MondayContext {
  boardId?: number;
  theme?: string;
  [key: string]: any;
}

export function useMondayContext() {
  const [boardId, setBoardId] = useState<number | null>(null);
  const [theme, setTheme] = useState<string>("light");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchContext() {
      try {
        const res = await monday.get("context");
        const context: MondayContext = res?.data || {};

        const id = context.boardId || 3591217049; // fallback manual
        const currentTheme = context.theme || "light";

        setBoardId(id);
        setTheme(currentTheme);
        console.log("Contexto Monday:", { id, theme: currentTheme });
      } catch (err) {
        console.error("Erro ao obter contexto do Monday:", err);
        setBoardId(3591217049);
        setTheme("light");
      } finally {
        setIsLoading(false);
      }
    }

    fetchContext();
  }, []);

  return { boardId, theme, isLoading };
}