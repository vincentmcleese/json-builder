import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import WorkflowBuilder from './pages/WorkflowBuilder';
import WorkflowPage from './pages/WorkflowPage';
import CreatingWorkflow from './pages/CreatingWorkflow';
import AdminPanel from './pages/AdminPanel';
import AuthenticatePage from './pages/AuthenticatePage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Routes>
        <Route path="/" element={<WorkflowBuilder />} />
        <Route path="/workflow/:slug" element={<WorkflowPage />} />
        <Route path="/creating-workflow" element={<CreatingWorkflow />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/authenticate" element={<AuthenticatePage />} />
      </Routes>
    </div>
  );
}

export default App;