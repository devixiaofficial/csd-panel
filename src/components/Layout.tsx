import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, List, LogOut, Menu, X } from 'lucide-react';
import CSDForm from './CSDForm';
import EntriesPage from './EntriesPage';

export default function Layout() {
  const { user, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<'form' | 'entries'>('entries');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <nav className="bg-black border-b border-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/csd-panel/logo.jpg" 
                alt="Company Logo" 
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
             
            </div>

            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => setCurrentPage('entries')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  currentPage === 'entries'
                    ? 'bg-[#7B2BBE] text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <List size={20} />
                My Entries
              </button>
              <button
                onClick={() => setCurrentPage('form')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  currentPage === 'form'
                    ? 'bg-[#7B2BBE] text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Plus size={20} />
                Add New
              </button>
              <div className="border-l border-gray-700 h-8 mx-2" />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-200">
                    {user?.email?.split('@')[0]}
                  </div>
                  <div className="text-xs text-gray-400">{user?.email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-all duration-300 transform hover:scale-110"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:bg-gray-800 rounded-lg"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-black animate-slideDown">
            <div className="px-4 py-4 space-y-2">
              <button
                onClick={() => {
                  setCurrentPage('entries');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  currentPage === 'entries'
                    ? 'bg-[#7B2BBE] text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <List size={20} />
                My Entries
              </button>
              <button
                onClick={() => {
                  setCurrentPage('form');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  currentPage === 'form'
                    ? 'bg-[#7B2BBE] text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Plus size={20} />
                Add New
              </button>
              <div className="border-t border-gray-800 pt-3 mt-3">
                <div className="px-4 py-2">
                  <div className="text-sm font-medium text-gray-200">{user?.email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-all duration-300"
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'form' ? <CSDForm /> : <EntriesPage />}
      </main>

      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600 text-sm">
            
            <p className="mt-1">
              Powered by <span className="font-semibold text-[#7B2BBE]">Devixia</span> • Professional Web Solutions
            </p>
            <p className="mt-2 text-xs text-gray-500">
              📧 devixia.official@gmail.com | 📞 03215419958
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}