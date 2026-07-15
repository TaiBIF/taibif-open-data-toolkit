import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import StepProvider from './contexts/step';
import { ProjectProvider } from './contexts/project';
import ProjectPage from './pages/ProjectPage';
import TemplatePage from './pages/TemplatePage';
import EditPage from './pages/EditPage';
import ValidatePage from './pages/ValidatePage';
import CleanPage from './pages/CleanPage';
import MappingPage from './pages/MappingPage';
import { I18nProvider } from './contexts/i18n';

export default function App() {
  return (
    <Router>
      <I18nProvider>
        <ProjectProvider>
          <StepProvider>
            <Routes>
              <Route path="/" element={<ProjectPage />} />
              <Route path="/data-template" element={<TemplatePage />} />
              <Route path="/data-edit" element={<EditPage />} />
              <Route path="/data-validate" element={<ValidatePage />} />
              <Route path="/data-clean" element={<CleanPage />} />
              <Route path="/data-mapping" element={<MappingPage />} />
            </Routes>
          </StepProvider>
        </ProjectProvider>
      </I18nProvider>
    </Router>
  );
}
