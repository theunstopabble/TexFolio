import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider, SignIn, SignUp } from "@clerk/clerk-react";
import Header from "./components/Header";
import CreateResume from "./pages/CreateResume";
import ResumeList from "./pages/ResumeList";
import EditResume from "./pages/EditResume";
import Templates from "./pages/Templates";
import Dashboard from "./pages/Dashboard";
import CoverLetter from "./pages/CoverLetter";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

// Home Page
const HomePage = () => (
  <div className="max-w-7xl mx-auto px-6 py-12">
    <div className="text-center">
      <h1 className="text-5xl font-bold text-slate-900 mb-6">
        Create Professional Resumes with{" "}
        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          LaTeX
        </span>
      </h1>
      <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
        Build stunning, ATS-friendly resumes using LaTeX templates. Export to
        PDF with one click.
      </p>
      <a href="/create" className="btn btn-primary text-lg px-8 py-3">
        🚀 Create Your Resume
      </a>
    </div>
  </div>
);

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />

                {/* Clerk Auth Routes */}
                <Route
                  path="/login/*"
                  element={
                    <div className="flex justify-center py-20">
                      <SignIn
                        routing="path"
                        path="/login"
                        forceRedirectUrl="/dashboard"
                      />
                    </div>
                  }
                />
                <Route
                  path="/register/*"
                  element={
                    <div className="flex justify-center py-20">
                      <SignUp
                        routing="path"
                        path="/register"
                        forceRedirectUrl="/dashboard"
                      />
                    </div>
                  }
                />

                <Route path="/create" element={<CreateResume />} />
                <Route path="/resumes" element={<ResumeList />} />
                <Route path="/edit/:id" element={<EditResume />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/cover-letter" element={<CoverLetter />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ClerkProvider>
  );
}

export default App;
