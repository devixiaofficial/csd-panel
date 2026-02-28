import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import { Building2, User, Hash, Phone, Mail, Briefcase, UserPlus, Save, Trash2, Plus } from 'lucide-react';

interface FormData {
  company_name: string;
  contact_name: string;
  ntn: string;
  contact_number: string;
  email: string;
  business: string;
  added_by: string;
}

const initialFormData: FormData = {
  company_name: '',
  contact_name: '',
  ntn: '',
  contact_number: '',
  email: '',
  business: '',
  added_by: '',
};

export default function CSDForm() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FormData[]>([{ ...initialFormData }]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ [key: number]: { [key: string]: string } }>({});

  const validateEmail = (email: string) => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (index: number, entry: FormData) => {
    const newErrors: { [key: string]: string } = {};

    if (!entry.company_name.trim()) newErrors.company_name = 'Company name is required';
    if (!entry.contact_name.trim()) newErrors.contact_name = 'Contact name is required';
    if (!entry.business.trim()) newErrors.business = 'Business is required';
    if (!entry.added_by.trim()) newErrors.added_by = 'Added by is required';
    if (entry.email && !validateEmail(entry.email)) newErrors.email = 'Invalid email format';

    return newErrors;
  };

  const handleInputChange = (index: number, field: keyof FormData, value: string) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);

    if (errors[index]?.[field]) {
      const newErrors = { ...errors };
      delete newErrors[index][field];
      setErrors(newErrors);
    }
  };

  const addNewEntry = () => {
    setEntries([...entries, { ...initialFormData }]);
    
    // Show success toast for new entry added
    Swal.fire({
      icon: 'success',
      title: 'New Entry Added',
      text: 'You can now fill in the details for this entry',
      timer: 1500,
      showConfirmButton: false,
      position: 'top-end',
      toast: true,
    });

    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const removeEntry = async (index: number) => {
    if (entries.length === 1) return;

    const result = await Swal.fire({
      title: 'Remove Entry?',
      text: 'Are you sure you want to remove this entry?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#7B2BBE',
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'Cancel',
      background: '#fff',
    });

    if (result.isConfirmed) {
      const newEntries = entries.filter((_, i) => i !== index);
      setEntries(newEntries);
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);

      await Swal.fire({
        icon: 'success',
        title: 'Removed!',
        text: 'Entry has been removed.',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    // Check if user is logged in
    if (!user) {
      await Swal.fire({
        icon: 'error',
        title: 'Not Logged In',
        text: 'Please log in to save entries.',
        confirmButtonColor: '#7B2BBE',
      });
      return;
    }

    const newErrors: { [key: number]: { [key: string]: string } } = {};
    let hasErrors = false;

    entries.forEach((entry, index) => {
      const entryErrors = validateForm(index, entry);
      if (Object.keys(entryErrors).length > 0) {
        newErrors[index] = entryErrors;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      
      // Show validation error alert
      await Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields correctly.',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    setLoading(true);

    try {
      const entriesToInsert = entries.map(entry => ({
        ...entry,
        user_id: user!.id,
        ntn: entry.ntn || null,
        contact_number: entry.contact_number || null,
        email: entry.email || null,
      }));

      const { error } = await supabase.from('csd_entries').insert(entriesToInsert);

      if (error) throw error;

      setSuccess(true);
      setEntries([{ ...initialFormData }]);
      
      // Show success alert with count
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        html: `
          <div class="text-center">
            <span class="inline-flex items-center justify-center bg-green-100 text-green-700 px-4 py-2 rounded-full text-xl font-bold mb-2">
              ${entries.length}
            </span>
            <p>${entries.length === 1 ? 'Entry' : 'Entries'} saved successfully!</p>
          </div>
        `,
        timer: 2000,
        showConfirmButton: false,
      });

      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Error saving entries:', error);
      
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to save entries. Please try again.',
        confirmButtonColor: '#7B2BBE',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-[#7B2BBE] p-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Plus size={28} />
            Add New CSD Entries
          </h2>
          <p className="text-purple-100 mt-1">Create and manage your client database</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg animate-slideDown">
              ✓ Entries saved successfully!
            </div>
          )}

          {entries.map((entry, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 animate-slideDown"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Building2 size={20} className="text-[#7B2BBE]" />
                  Entry #{index + 1}
                </h3>
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEntry(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-300 transform hover:scale-110"
                    title="Remove this entry"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="transform transition-all duration-300 hover:translate-x-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={entry.company_name}
                      onChange={(e) => handleInputChange(index, 'company_name', e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#7B2BBE] focus:border-transparent transition-all duration-300 ${
                        errors[index]?.company_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="ABC Corporation"
                    />
                  </div>
                  {errors[index]?.company_name && (
                    <p className="text-red-500 text-sm mt-1">{errors[index].company_name}</p>
                  )}
                </div>

                <div className="transform transition-all duration-300 hover:translate-x-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={entry.contact_name}
                      onChange={(e) => handleInputChange(index, 'contact_name', e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#7B2BBE] focus:border-transparent transition-all duration-300 ${
                        errors[index]?.contact_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors[index]?.contact_name && (
                    <p className="text-red-500 text-sm mt-1">{errors[index].contact_name}</p>
                  )}
                </div>

                <div className="transform transition-all duration-300 hover:translate-x-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NTN <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={entry.ntn}
                      onChange={(e) => handleInputChange(index, 'ntn', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7B2BBE] focus:border-transparent transition-all duration-300"
                      placeholder="1234567-8"
                    />
                  </div>
                </div>

                <div className="transform transition-all duration-300 hover:translate-x-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="tel"
                      value={entry.contact_number}
                      onChange={(e) => handleInputChange(index, 'contact_number', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7B2BBE] focus:border-transparent transition-all duration-300"
                      placeholder="03001234567"
                    />
                  </div>
                </div>

                <div className="transform transition-all duration-300 hover:translate-x-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={entry.email}
                      onChange={(e) => handleInputChange(index, 'email', e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#7B2BBE] focus:border-transparent transition-all duration-300 ${
                        errors[index]?.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="contact@example.com"
                    />
                  </div>
                  {errors[index]?.email && (
                    <p className="text-red-500 text-sm mt-1">{errors[index].email}</p>
                  )}
                </div>

                <div className="transform transition-all duration-300 hover:translate-x-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={entry.business}
                      onChange={(e) => handleInputChange(index, 'business', e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#7B2BBE] focus:border-transparent transition-all duration-300 ${
                        errors[index]?.business ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="E-commerce, Manufacturing, etc."
                    />
                  </div>
                  {errors[index]?.business && (
                    <p className="text-red-500 text-sm mt-1">{errors[index].business}</p>
                  )}
                </div>

                <div className="md:col-span-2 transform transition-all duration-300 hover:translate-x-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Added By <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={entry.added_by}
                      onChange={(e) => handleInputChange(index, 'added_by', e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#7B2BBE] focus:border-transparent transition-all duration-300 ${
                        errors[index]?.added_by ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Your Name"
                    />
                  </div>
                  {errors[index]?.added_by && (
                    <p className="text-red-500 text-sm mt-1">{errors[index].added_by}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={addNewEntry}
              className="flex-1 bg-gradient-to-r from-[#7B2BBE] to-[#9f4fe0] text-white py-3 px-6 rounded-lg font-medium hover:from-[#6524a0] hover:to-[#7B2BBE] transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              Add Another Entry
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#7B2BBE] to-[#9f4fe0] text-white py-3 px-6 rounded-lg font-medium hover:from-[#6524a0] hover:to-[#7B2BBE] transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={20} />
                  Save All Entries
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}