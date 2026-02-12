import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider, SignIn, SignUp } from "@clerk/clerk-react";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer";
import Loading from "./components/Loading";

// Lazy Load Pages
const HomePage = lazy(() => import("./pages/HomePage"));
const PublicResume = lazy(() => import("./pages/PublicResume"));
const UserProfilePage = lazy(() => import("./pages/UserProfile"));
const CreateResume = lazy(() => import("./pages/CreateResume"));
const ResumeList = lazy(() => import("./pages/ResumeList"));
const EditResume = lazy(() => import("./pages/EditResume"));
const Templates = lazy(() => import("./pages/Templates"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CoverLetter = lazy(() => import("./pages/CoverLetter"));
const Pricing = lazy(() => import("./pages/Pricing"));

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
                <Suspense fallback={<Loading fullScreen />}>
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

                    <Route element={<ProtectedRoute />}>
                      <Route path="/create" element={<CreateResume />} />
                      <Route path="/resumes" element={<ResumeList />} />
                      <Route path="/edit/:id" element={<EditResume />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/cover-letter" element={<CoverLetter />} />
                    </Route>
                    <Route path="/templates" element={<Templates />} />
                    <Route path="/pricing" element={<Pricing />} />
                  </Routes>
                </Suspense>
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
