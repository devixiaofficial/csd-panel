import { useState, useEffect } from 'react';
import { supabase, CSDEntry } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import {
  Eye,
  Edit2,
  Trash2,
  Send,
  X,
  Building2,
  User,
  Hash,
  Phone,
  Mail,
  Briefcase,
  UserPlus,
  Calendar,
  CheckSquare,
  Square,
  Filter,
  Search,
  XCircle,
} from 'lucide-react';

export default function EntriesPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CSDEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<CSDEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [viewModal, setViewModal] = useState<CSDEntry | null>(null);
  const [editModal, setEditModal] = useState<CSDEntry | null>(null);
  const [editForm, setEditForm] = useState<Partial<CSDEntry>>({});
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [addedByFilter, setAddedByFilter] = useState<string>('');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [uniqueAddedBy, setUniqueAddedBy] = useState<string[]>([]);

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, addedByFilter, dateFromFilter, dateToFilter]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('csd_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
      setFilteredEntries(data || []);
      
      // Extract unique added_by values for filter dropdown
      const uniqueValues = [...new Set(data?.map(entry => entry.added_by) || [])];
      setUniqueAddedBy(uniqueValues);
    } catch (error) {
      console.error('Error loading entries:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Failed to load entries!',
        timer: 2000,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...entries];

    // Filter by added_by
    if (addedByFilter) {
      filtered = filtered.filter(entry => 
        entry.added_by.toLowerCase().includes(addedByFilter.toLowerCase())
      );
    }

    // Filter by date from
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.created_at);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate >= fromDate;
      });
    }

    // Filter by date to
    if (dateToFilter) {
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.created_at);
        return entryDate <= toDate;
      });
    }

    setFilteredEntries(filtered);
    // Clear selection when filters change
    setSelectedEntries(new Set());
  };

  const clearFilters = () => {
    setAddedByFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setFilteredEntries(entries);
    setSelectedEntries(new Set());
    
    Swal.fire({
      icon: 'success',
      title: 'Filters Cleared',
      text: 'All filters have been reset',
      timer: 1500,
      showConfirmButton: false,
      position: 'top-end',
      toast: true,
    });
  };

  const toggleSelectAll = () => {
    if (selectedEntries.size === filteredEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(filteredEntries.map(e => e.id)));
    }
  };

  const toggleSelectEntry = (id: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEntries(newSelected);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#7B2BBE',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: '#fff',
      backdrop: `
        rgba(123, 43, 190, 0.2)
        left top
        no-repeat
      `,
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase.from('csd_entries').delete().eq('id', id);
      if (error) throw error;
      
      await loadEntries();
      setSelectedEntries(new Set());
      
      await Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Entry has been deleted successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to delete entry. Please try again.',
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEntries.size === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'No Selection',
        text: 'Please select at least one entry to delete',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    const selectedCount = selectedEntries.size;
    const result = await Swal.fire({
      title: 'Delete Multiple Entries?',
      html: `
        <div class="text-center">
          <p class="mb-2">You are about to delete</p>
          <span class="inline-flex items-center justify-center bg-red-100 text-red-700 px-4 py-2 rounded-full text-xl font-bold">
            ${selectedCount} ${selectedCount === 1 ? 'entry' : 'entries'}
          </span>
          <p class="mt-2 text-sm text-gray-500">This action cannot be undone!</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#7B2BBE',
      confirmButtonText: `Yes, delete ${selectedCount} items`,
      cancelButtonText: 'Cancel',
      background: '#fff',
    });

    if (!result.isConfirmed) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('csd_entries')
        .delete()
        .in('id', Array.from(selectedEntries));

      if (error) throw error;
      
      await loadEntries();
      setSelectedEntries(new Set());
      
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        html: `
          <div class="text-center">
            <span class="inline-flex items-center justify-center bg-green-100 text-green-700 px-4 py-2 rounded-full text-xl font-bold">
              ${selectedCount}
            </span>
            <p class="mt-2">${selectedCount === 1 ? 'entry' : 'entries'} deleted successfully!</p>
          </div>
        `,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error deleting entries:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to delete entries. Please try again.',
        timer: 2000,
        showConfirmButton: false,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (entry: CSDEntry) => {
    setEditModal(entry);
    setEditForm(entry);
  };

  const handleUpdate = async () => {
    if (!editModal) return;

    try {
      const { error } = await supabase
        .from('csd_entries')
        .update({
          company_name: editForm.company_name,
          contact_name: editForm.contact_name,
          ntn: editForm.ntn || null,
          contact_number: editForm.contact_number || null,
          email: editForm.email || null,
          business: editForm.business,
          added_by: editForm.added_by,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editModal.id);

      if (error) throw error;
      await loadEntries();
      setEditModal(null);
      
      await Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Entry has been updated successfully.',
        timer: 1500,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });
    } catch (error) {
      console.error('Error updating entry:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to update entry. Please try again.',
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const handleSendMessages = async () => {
    if (selectedEntries.size === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'No Selection',
        text: 'Please select at least one entry to send messages',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    const selectedData = entries.filter(e => selectedEntries.has(e.id));
    const result = await Swal.fire({
      title: 'Send Messages?',
      html: `
        <div class="text-center">
          <p class="mb-3">You are about to send messages to</p>
          <span class="inline-flex items-center justify-center bg-[#7B2BBE] text-white px-4 py-2 rounded-full text-xl font-bold">
            ${selectedData.length} ${selectedData.length === 1 ? 'recipient' : 'recipients'}
          </span>
          <div class="mt-4 text-left bg-purple-50 p-3 rounded-lg">
            <p class="text-sm font-medium text-[#7B2BBE] mb-2">Preview:</p>
            <ul class="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
              ${selectedData.slice(0, 5).map(entry => `
                <li class="flex items-center gap-2">
                  <span class="w-2 h-2 bg-[#7B2BBE] rounded-full"></span>
                  ${entry.company_name} (${entry.email || entry.contact_number || 'No contact'})
                </li>
              `).join('')}
              ${selectedData.length > 5 ? `<li class="text-gray-400">...and ${selectedData.length - 5} more</li>` : ''}
            </ul>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7B2BBE',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, send messages!',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setSending(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ entries: selectedData }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Messages Sent!',
          html: `
            <div class="text-center space-y-2">
              <div class="flex justify-center gap-4">
                <div class="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg">
                  <span class="block text-2xl font-bold">${result.emailsSent}</span>
                  <span class="text-xs">Emails</span>
                </div>
                <div class="bg-green-100 text-green-700 px-4 py-2 rounded-lg">
                  <span class="block text-2xl font-bold">${result.whatsappSent}</span>
                  <span class="text-xs">WhatsApp</span>
                </div>
              </div>
              <p class="text-sm text-gray-600">Messages sent successfully!</p>
            </div>
          `,
          timer: 3000,
          showConfirmButton: false,
        });
        setSelectedEntries(new Set());
      } else {
        throw new Error(result.error || 'Failed to send messages');
      }
    } catch (error) {
      console.error('Error sending messages:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to send messages. Please try again.',
        timer: 2000,
        showConfirmButton: false,
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[#7B2BBE] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-[#7B2BBE] p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Building2 size={28} />
                CSD Entries
              </h2>
              <p className="text-purple-100 mt-1">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} 
                {filteredEntries.length !== entries.length && ` (filtered from ${entries.length})`}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  showFilters 
                    ? 'bg-white text-[#7B2BBE]' 
                    : 'bg-purple-500 text-white hover:bg-purple-400'
                }`}
                title="Toggle filters"
              >
                <Filter size={20} />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              {selectedEntries.size > 0 && (
                <>
                  <button
                    onClick={handleSendMessages}
                    disabled={sending}
                    className="bg-white text-[#7B2BBE] px-6 py-3 rounded-lg font-medium hover:bg-purple-50 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg disabled:opacity-50"
                    title="Send messages to selected entries"
                  >
                    {sending ? (
                      <div className="w-5 h-5 border-3 border-[#7B2BBE] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={20} />
                        Send to {selectedEntries.size}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={deleting}
                    className="bg-white text-red-600 px-6 py-3 rounded-lg font-medium hover:bg-red-50 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg disabled:opacity-50"
                    title="Delete selected entries"
                  >
                    {deleting ? (
                      <div className="w-5 h-5 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={20} />
                        Delete {selectedEntries.size}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filter Section */}
          {showFilters && (
            <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 animate-slideDown">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Filter size={18} />
                  Filter Entries
                </h3>
                {(addedByFilter || dateFromFilter || dateToFilter) && (
                  <button
                    onClick={clearFilters}
                    className="text-white hover:text-purple-200 flex items-center gap-1 text-sm transition-colors"
                  >
                    <XCircle size={16} />
                    Clear Filters
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Added By Filter */}
                <div>
                  <label className="block text-sm font-medium text-purple-100 mb-2">
                    <User size={16} className="inline mr-1" />
                    Added By
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={addedByFilter}
                      onChange={(e) => setAddedByFilter(e.target.value)}
                      placeholder="Search by name..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-transparent focus:ring-2 focus:ring-white focus:border-transparent bg-white/20 text-white placeholder-purple-200"
                      list="addedByOptions"
                    />
                    <datalist id="addedByOptions">
                      {uniqueAddedBy.map((name, index) => (
                        <option key={index} value={name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Date From Filter */}
                <div>
                  <label className="block text-sm font-medium text-purple-100 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-transparent focus:ring-2 focus:ring-white focus:border-transparent bg-white/20 text-white"
                  />
                </div>

                {/* Date To Filter */}
                <div>
                  <label className="block text-sm font-medium text-purple-100 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-transparent focus:ring-2 focus:ring-white focus:border-transparent bg-white/20 text-white"
                  />
                </div>
              </div>

              {/* Active Filters Display */}
              {(addedByFilter || dateFromFilter || dateToFilter) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {addedByFilter && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-sm text-white">
                      <User size={14} />
                      Added by: {addedByFilter}
                      <button
                        onClick={() => setAddedByFilter('')}
                        className="hover:text-purple-200 ml-1"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {dateFromFilter && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-sm text-white">
                      <Calendar size={14} />
                      From: {new Date(dateFromFilter).toLocaleDateString()}
                      <button
                        onClick={() => setDateFromFilter('')}
                        className="hover:text-purple-200 ml-1"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {dateToFilter && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-sm text-white">
                      <Calendar size={14} />
                      To: {new Date(dateToFilter).toLocaleDateString()}
                      <button
                        onClick={() => setDateToFilter('')}
                        className="hover:text-purple-200 ml-1"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Building2 size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Entries Found</h3>
            <p className="text-gray-500">
              {entries.length === 0 
                ? 'Start by adding your first CSD entry'
                : 'No entries match your filter criteria'}
            </p>
            {entries.length > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 text-[#7B2BBE] hover:text-[#6524a0] font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#7B2BBE] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="text-white hover:text-gray-200 transition-colors"
                      title={selectedEntries.size === filteredEntries.length ? 'Deselect all' : 'Select all'}
                    >
                      {selectedEntries.size === filteredEntries.length ? (
                        <CheckSquare size={20} />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Company</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Business</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Contact Info</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Added By</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Date</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntries.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-purple-50 transition-all duration-300 animate-slideDown"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleSelectEntry(entry.id)}
                        className="text-gray-600 hover:text-[#7B2BBE] transition-colors"
                      >
                        {selectedEntries.has(entry.id) ? (
                          <CheckSquare size={20} className="text-[#7B2BBE]" />
                        ) : (
                          <Square size={20} />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{entry.company_name}</div>
                      {entry.ntn && <div className="text-sm text-gray-500">NTN: {entry.ntn}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{entry.contact_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-[#7B2BBE]">
                        {entry.business}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        {entry.email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail size={14} />
                            {entry.email}
                          </div>
                        )}
                        {entry.contact_number && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone size={14} />
                            {entry.contact_number}
                          </div>
                        )}
                        {!entry.email && !entry.contact_number && (
                          <span className="text-gray-400">No contact info</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-700">{entry.added_by}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setViewModal(entry)}
                          className="p-2 text-[#7B2BBE] hover:bg-purple-100 rounded-lg transition-all duration-300 transform hover:scale-110"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-all duration-300 transform hover:scale-110"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-300 transform hover:scale-110"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal - unchanged */}
      {viewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="bg-[#7B2BBE] p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Entry Details</h3>
              <button
                onClick={() => setViewModal(null)}
                className="hover:bg-white/20 p-2 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <DetailRow icon={<Building2 size={20} />} label="Company Name" value={viewModal.company_name} />
              <DetailRow icon={<User size={20} />} label="Contact Name" value={viewModal.contact_name} />
              {viewModal.ntn && <DetailRow icon={<Hash size={20} />} label="NTN" value={viewModal.ntn} />}
              {viewModal.contact_number && <DetailRow icon={<Phone size={20} />} label="Contact Number" value={viewModal.contact_number} />}
              {viewModal.email && <DetailRow icon={<Mail size={20} />} label="Email" value={viewModal.email} />}
              <DetailRow icon={<Briefcase size={20} />} label="Business" value={viewModal.business} />
              <DetailRow icon={<UserPlus size={20} />} label="Added By" value={viewModal.added_by} />
              <DetailRow icon={<Calendar size={20} />} label="Created" value={new Date(viewModal.created_at).toLocaleString()} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - unchanged */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="bg-[#7B2BBE] p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Edit Entry</h3>
              <button
                onClick={() => setEditModal(null)}
                className="hover:bg-white/20 p-2 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  value={editForm.company_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7B2BBE] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name *</label>
                <input
                  type="text"
                  value={editForm.contact_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7B2BBE] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">NTN</label>
                <input
                  type="text"
                  value={editForm.ntn || ''}
                  onChange={(e) => setEditForm({ ...editForm, ntn: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7B2BBE] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                <input
                  type="tel"
                  value={editForm.contact_number || ''}
                  onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7B2BBE] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7B2BBE] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business *</label>
                <input
                  type="text"
                  value={editForm.business || ''}
                  onChange={(e) => setEditForm({ ...editForm, business: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7B2BBE] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Added By *</label>
                <input
                  type="text"
                  value={editForm.added_by || ''}
                  onChange={(e) => setEditForm({ ...editForm, added_by: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7B2BBE] focus:border-transparent"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setEditModal(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 bg-[#7B2BBE] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#6524a0] transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-[#7B2BBE] mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-500">{label}</div>
        <div className="text-gray-900 mt-0.5">{value}</div>
      </div>
    </div>
  );
}