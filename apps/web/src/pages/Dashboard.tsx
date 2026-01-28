import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resumeApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface Resume {
  _id: string;
  title: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await resumeApi.getAll();
        setResumes(response.data.data || []);
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const recentResumes = resumes.slice(0, 3);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 text-center">
        <div className="text-4xl animate-spin mb-4">⏳</div>
        <p className="text-slate-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back, {user?.name || 'User'}! 👋
        </h1>
        <p className="text-slate-600">Here's an overview of your resume portfolio.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="text-4xl mb-2">📄</div>
          <div className="text-3xl font-bold">{resumes.length}</div>
          <div className="text-blue-100">Total Resumes</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="text-4xl mb-2">🎨</div>
          <div className="text-3xl font-bold">2</div>
          <div className="text-purple-100">Templates Available</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="text-4xl mb-2">📥</div>
          <div className="text-3xl font-bold">{resumes.length}</div>
          <div className="text-green-100">PDFs Generated</div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="text-4xl mb-2">⚡</div>
          <div className="text-3xl font-bold">∞</div>
          <div className="text-orange-100">LaTeX Power</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Link to="/create" className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all group">
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">➕</div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Create New Resume</h3>
          <p className="text-slate-600 text-sm">Start building a new professional resume</p>
        </Link>
        
        <Link to="/templates" className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all group">
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🎨</div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Browse Templates</h3>
          <p className="text-slate-600 text-sm">Explore our collection of LaTeX templates</p>
        </Link>
        
        <Link to="/resumes" className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all group">
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📋</div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">View All Resumes</h3>
          <p className="text-slate-600 text-sm">Manage and edit your existing resumes</p>
        </Link>
      </div>

      {/* Recent Resumes */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">Recent Resumes</h2>
          <Link to="/resumes" className="text-blue-600 font-medium hover:underline text-sm">
            View All →
          </Link>
        </div>
        
        {recentResumes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📄</div>
            <p className="text-slate-600 mb-4">No resumes yet. Create your first one!</p>
            <Link to="/create" className="btn btn-primary">
              🚀 Create Resume
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentResumes.map((resume) => (
              <div key={resume._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <h3 className="font-semibold text-slate-900">{resume.title}</h3>
                  <p className="text-sm text-slate-500">
                    Updated {new Date(resume.updatedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/edit/${resume._id}`} className="btn btn-secondary text-sm px-3 py-1">
                    ✏️ Edit
                  </Link>
                  <button 
                    onClick={() => window.open(`http://localhost:5000/api/resumes/${resume._id}/pdf`, '_blank')}
                    className="btn btn-primary text-sm px-3 py-1"
                  >
                    📥 PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;