import React, { createContext, useContext, useState } from 'react';

interface ProjectContextType {
  selectedProject: number | null;
  setSelectedProject: (id: number | null) => void;

  tables: Table[];
  setTables: (tables: Table[]) => void;
}

type TableCategory = 'core' | 'extension';
export type Table = {
  name: string;
  kind: TableCategory;
  displayName: string;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [tables, setTables] = useState<Table[]>([]);

  return (
    <ProjectContext.Provider
      value={{ selectedProject, setSelectedProject, tables, setTables }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject 必須在 <ProjectProvider> 中使用');
  return context;
};
