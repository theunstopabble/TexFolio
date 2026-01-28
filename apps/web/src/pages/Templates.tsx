import { Link } from 'react-router-dom';

const templates = [
  {
    id: 'premium',
    name: 'Premium',
    description: 'Clean, professional design with modern typography. Perfect for tech, business, and finance roles.',
    features: ['ATS-Friendly', 'Clean Layout', 'Clickable Links', 'Modern Typography'],
    color: 'from-blue-500 to-purple-600',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional resume format with timeless appeal. Great for academic, legal, and government positions.',
    features: ['Traditional Format', 'Conservative Style', 'Easy to Read', 'Widely Accepted'],
    color: 'from-slate-600 to-slate-800',
  },
];

const Templates = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Choose Your Template</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Select a professional LaTeX template for your resume. Each template is ATS-friendly and fully customizable.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            {/* Preview Header */}
            <div className={`h-48 bg-gradient-to-br ${template.color} flex items-center justify-center relative overflow-hidden`}>
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="relative z-10 text-center">
                <div className="w-24 h-32 bg-white rounded-lg shadow-2xl mx-auto mb-3 flex items-center justify-center overflow-hidden">
                  <div className="w-20 h-28 bg-slate-50 rounded p-2">
                    <div className="w-full h-2 bg-slate-300 rounded mb-1"></div>
                    <div className="w-3/4 h-1 bg-slate-200 rounded mb-2"></div>
                    <div className="w-full h-1 bg-slate-200 rounded mb-1"></div>
                    <div className="w-full h-1 bg-slate-200 rounded mb-1"></div>
                    <div className="w-2/3 h-1 bg-slate-200 rounded mb-2"></div>
                    <div className="w-full h-1 bg-slate-200 rounded mb-1"></div>
                    <div className="w-full h-1 bg-slate-200 rounded mb-1"></div>
                  </div>
                </div>
                <span className="text-white font-semibold text-lg drop-shadow-md">{template.name}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{template.name} Template</h3>
              <p className="text-slate-600 mb-4">{template.description}</p>
              
              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-6">
                {template.features.map((feature) => (
                  <span key={feature} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                    ✓ {feature}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Link 
                  to={`/create?template=${template.id}`}
                  className="flex-1 btn btn-primary text-center"
                >
                  🚀 Use This Template
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon */}
      <div className="mt-12 text-center">
        <div className="inline-block bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl px-8 py-6 border border-amber-200">
          <h3 className="text-xl font-semibold text-amber-800 mb-2">🎨 More Templates Coming Soon!</h3>
          <p className="text-amber-700">We're working on Modern, Minimal, Creative, and Academic templates.</p>
        </div>
      </div>
    </div>
  );
};

export default Templates;