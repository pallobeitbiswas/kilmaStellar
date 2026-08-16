import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Grain } from '@/components/ui/grain';
import { Aurora } from '@/components/ui/aurora';

import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import CreateProject from '@/pages/CreateProject';
import ProjectDetails from '@/pages/ProjectDetails';
import Transfer from '@/pages/Transfer';
import Analytics from '@/pages/Analytics';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { telemetry } from '@/lib/telemetry';

function TelemetryTracker() {
  const location = useLocation();

  useEffect(() => {
    telemetry.log('page_view', `Visited ${location.pathname}`);
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <TelemetryTracker />
      <Grain />
      <Aurora />
      <Navbar />
      <main className="flex-1 pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/projects/create" element={<CreateProject />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
        </Routes>
      </main>
      <Footer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgb(16, 16, 19)',
            color: 'rgb(246, 246, 248)',
            border: '1px solid rgb(33, 33, 39)',
          },
        }}
      />
    </Router>
  );
}

export default App;
