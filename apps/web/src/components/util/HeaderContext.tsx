import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

const HeaderContentContext = createContext<{
  content: ReactNode;
  setContent: (node: ReactNode) => void;
}>({ content: null, setContent: () => null });

export function HeaderContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode>(null);
  return (
    <HeaderContentContext.Provider value={{ content, setContent }}>
      {children}
    </HeaderContentContext.Provider>
  );
}

export function useHeaderContent() {
  return useContext(HeaderContentContext);
}
