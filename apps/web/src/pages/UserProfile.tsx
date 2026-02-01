import { UserProfile } from "@clerk/clerk-react";

const UserProfilePage = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Your Profile</h1>
          <p className="text-slate-600 mt-2">
            Manage your account settings, security, and preferences.
          </p>
        </div>
        <div className="flex justify-center">
          <UserProfile
            path="/profile"
            routing="path"
            appearance={{
              elements: {
                rootBox: "w-full shadow-xl rounded-xl overflow-hidden",
                card: "w-full shadow-none rounded-none",
                navbar: "hidden md:flex",
                navbarButton:
                  "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                navbarButtonActive:
                  "text-blue-600 bg-blue-50 hover:bg-blue-100 font-bold",
                headerTitle: "text-xl font-bold text-slate-900",
                headerSubtitle: "text-slate-500",
                formButtonPrimary: "bg-slate-900 hover:bg-slate-800 text-white",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
