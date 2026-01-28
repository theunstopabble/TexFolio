import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import CreateResume from './pages/CreateResume';
import ResumeList from './pages/ResumeList';
import EditResume from './pages/EditResume';
import Templates from './pages/Templates';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

// Home Page
const HomePage = () => (
  <div className="max-w-7xl mx-auto px-6 py-12">
    <div className="text-center">
      <h1 className="text-5xl font-bold text-slate-900 mb-6">
        Create Professional Resumes with{' '}
        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          LaTeX
        </span>
      </h1>
      <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
        Build stunning, ATS-friendly resumes using LaTeX templates. 
        Export to PDF with one click.
      </p>
      <a href="/create" className="btn btn-primary text-lg px-8 py-3">
        🚀 Create Your Resume
      </a>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/create" element={<CreateResume />} />
              <Route path="/resumes" element={<ResumeList />} />
              <Route path="/edit/:id" element={<EditResume />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;