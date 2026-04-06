import { Suspense, lazy, Component, type ReactNode, type ErrorInfo } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider, SignIn, SignUp } from "@clerk/clerk-react";
import { Analytics } from "@vercel/analytics/react";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer";
import Loading from "./components/Loading";

// Eagerly import HomePage — landing page must not use Suspense to prevent CLS
import HomePage from "./pages/HomePage";

// Lazy Load other Pages
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

// ============================================
// Error Boundary — prevents white screen crashes
// ============================================
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-slate-600 mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn btn-primary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <AuthProvider>
            <BrowserRouter>
              <Toaster position="top-right" />
              <Analytics />
              <div className="min-h-screen bg-slate-50">
                <Header />
                <main className="min-h-screen">
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
    </ErrorBoundary>
  );
}

export default App;
