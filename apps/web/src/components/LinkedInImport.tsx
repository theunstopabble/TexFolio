import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

interface LinkedInImportProps {
  onImportSuccess: (data: any) => void;
}

const LinkedInImport = ({ onImportSuccess }: LinkedInImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const token = await getToken();

    if (!token) {
      toast.error("Please log in to import your profile");
      setIsLoading(false);
      return;
    }

    try {
      const loadingToast = toast.loading(
        "Analyzing your LinkedIn PDF... (This may take a minute)",
      );

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/agents/import/linkedin`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.dismiss(loadingToast);

      if (response.data.success) {
        toast.success("Profile imported successfully! 🎉");
        onImportSuccess(response.data.data);
      }
    } catch (error: any) {
      toast.dismiss();
      console.error("Import error:", error);
      toast.error(error.response?.data?.error || "Failed to import profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center text-center hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
        <span className="text-3xl">📥</span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">
        Import from LinkedIn
      </h3>
      <p className="text-slate-500 text-sm mb-6 max-w-xs">
        Export your LinkedIn profile as PDF and upload it here. AI will build
        your resume instantly.
      </p>

      {!file ? (
        <label className="btn btn-secondary w-full relative cursor-pointer">
          <span>select PDF</span>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      ) : (
        <div className="w-full">
          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3 text-sm text-slate-700">
            <span className="truncate flex-1">{file.name}</span>
            <button
              onClick={() => setFile(null)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
          <button
            onClick={handleImport}
            disabled={isLoading}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing...
              </>
            ) : (
              "✨ Import & Create"
            )}
          </button>
        </div>
      )}

      <p className="text-xs text-slate-400 mt-4">
        Go to LinkedIn Profile {">"} More {">"} Save to PDF
      </p>
    </div>
  );
};

export default LinkedInImport;
