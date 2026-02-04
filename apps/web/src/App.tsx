import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import PublicResume from "./pages/PublicResume";
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
import Pricing from "./pages/Pricing";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import UserProfilePage from "./pages/UserProfile";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-right" />
            <div className="min-h-screen bg-slate-50">
              <Header />
              <main>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/r/:shareId" element={<PublicResume />} />
                  <Route path="/profile/*" element={<UserProfilePage />} />

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
                  <Route path="/pricing" element={<Pricing />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ClerkProvider>
    </QueryClientProvider>
  );
}

export default App;
