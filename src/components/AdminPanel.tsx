import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Activity, Shield, ArrowLeft, Loader2, Search, Calendar, Mail, Trash2, PlusCircle, Edit, Award, MapPin, AlertCircle, Sparkles, Globe } from 'lucide-react';
import { CountryComparison } from '../types';

const ExpandableList = ({ items, type }: { items: string[], type: 'pros' | 'cons' }) => {
  const [expanded, setExpanded] = useState(false);
  if (!items || items.length === 0) return <span className="text-xs text-slate-400">-</span>;
  const showAll = expanded || items.length <= 2;
  const displayedItems = showAll ? items : items.slice(0, 2);
  
  return (
    <div className="flex flex-col items-start gap-1">
      <ul className="list-disc pl-3 m-0 space-y-0.5">
        {displayedItems.map((item, idx) => (
          <li key={idx} className="text-xs text-slate-600 leading-tight">{item}</li>
        ))}
      </ul>
      {items.length > 2 && (
        <button 
          onClick={() => setExpanded(!expanded)} 
          className={`text-[10px] font-bold uppercase tracking-wider mt-1 hover:underline ${type === 'pros' ? 'text-emerald-600' : 'text-rose-600'}`}
        >
          {expanded ? 'Show Less' : `+ ${items.length - 2} More`}
        </button>
      )}
    </div>
  );
};

interface Scholarship {
  id: number;
  scholarshipName: string;
  university: string;
  country: string;
  degreeLevel: string; /* Added for filtering */
  fundingCoverage: string;
  eligibility: string;
  requiredDocuments: string | string[];
  ieltsRequirement: string;
  ieltsWaiverInfo?: string;
  applicationLink: string;
  openingDate: string;
  closingDate: string;
  competitivenessLevel: string;
  matchScore: number;
  successProbability: number;
  rankingReason: string;
  status: string;
  isAnnual: boolean;
  tags: string[];
}

interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
}

interface VisaGuidance {
  id: number;
  country: string;
  visaType: string;
  requirements: string;
  processingTime: string;
  fees: string;
  applicationLink: string;
  notes?: string;
}

interface Log {
  id: number;
  email: string;
  action: string;
  details: string;
  timestamp: string;
}

export function AdminPanel({ onBack }: { onBack: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [visaGuidance, setVisaGuidance] = useState<VisaGuidance[]>([]);
  const [logSortColumn, setLogSortColumn] = useState<'timestamp' | 'action'>('timestamp');
  const [logSortOrder, setLogSortOrder] = useState<'asc' | 'desc'>('desc');
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [scholarshipSearchQuery, setScholarshipSearchQuery] = useState('');
  const [scholarshipFilterCountry, setScholarshipFilterCountry] = useState('All');
  const [scholarshipFilterDegree, setScholarshipFilterDegree] = useState('All');
  const [scholarshipFilterFunding, setScholarshipFilterFunding] = useState('All');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'scholarships' | 'visa' | 'comparisons'>('users');
  const [isAddingScholarship, setIsAddingScholarship] = useState(false);
  const [newScholarship, setNewScholarship] = useState<Partial<Scholarship>>({});
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);
  const [isAddingVisa, setIsAddingVisa] = useState(false);
  const [newVisaGuidance, setNewVisaGuidance] = useState<Partial<VisaGuidance>>({});
  const [editingVisaGuidance, setEditingVisaGuidance] = useState<VisaGuidance | null>(null);
  const [visaSearchQuery, setVisaSearchQuery] = useState('');
  const [visaFilterCountry, setVisaFilterCountry] = useState('All');
  const [countryComparisons, setCountryComparisons] = useState<CountryComparison[]>([]);
  const [isAddingCountryComparison, setIsAddingCountryComparison] = useState(false);
  const [newCountryComparison, setNewCountryComparison] = useState<Partial<CountryComparison>>({});
  const [editingCountryComparison, setEditingCountryComparison] = useState<CountryComparison | null>(null);
  const [comparisonSearchQuery, setComparisonSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const [usersRes, logsRes, scholarshipsRes, visaRes, comparisonsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/logs'),
        fetch('/api/admin/scholarships'),
        fetch('/api/admin/visa-guidance'),
        fetch('/api/admin/country-comparisons')
      ]);
      const usersData = await usersRes.json();
      const logsData = await logsRes.json();
      const scholarshipsData = await scholarshipsRes.json();
      setUsers(usersData);
      setLogs(logsData);
      setScholarships(Array.isArray(scholarshipsData) ? scholarshipsData.map((s: any) => ({
        ...s,
        requiredDocuments: typeof s.requiredDocuments === 'string' ? JSON.parse(s.requiredDocuments) : s.requiredDocuments,
        tags: typeof s.tags === 'string' ? JSON.parse(s.tags) : s.tags
      })) : []);
      const visaData = await visaRes.json();
      setVisaGuidance(visaData);
      const comparisonsData = await comparisonsRes.json();
      setCountryComparisons(Array.isArray(comparisonsData) ? comparisonsData.map((c: any) => ({
        ...c,
        pros: typeof c.pros === 'string' ? JSON.parse(c.pros) : c.pros || [],
        cons: typeof c.cons === 'string' ? JSON.parse(c.cons) : c.cons || []
      })) : []);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const handleSubmitScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    const scholarshipToSave = {
      ...(editingScholarship || newScholarship),
      requiredDocuments: JSON.stringify(editingScholarship?.requiredDocuments || newScholarship.requiredDocuments || []),
      tags: JSON.stringify(editingScholarship?.tags || newScholarship.tags || []),
    };
    const method = editingScholarship ? 'PUT' : 'POST';
    const url = editingScholarship ? `/api/admin/scholarships/${editingScholarship.id}` : '/api/admin/scholarships';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scholarshipToSave),
      });
      if (res.ok) {
        setNewScholarship({});
        setEditingScholarship(null);
        setIsAddingScholarship(false);
        fetchData();
      } else {
        console.error('Failed to save scholarship', await res.json());
      }
    } catch (err) {
      console.error('Failed to save scholarship', err);
    }
  };

  const handleDeleteScholarship = async (id: number) => {
    if (!confirm('Are you sure you want to delete this scholarship?')) return;
    try {
      const res = await fetch(`/api/admin/scholarships/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        console.error('Failed to delete scholarship', await res.json());
      }
    } catch (err) {
      console.error('Failed to delete scholarship', err);
    }
  };

  const handleSelectUser = (id: number) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(user => user.id));
    }
  };

  const handleRoleChange = async (id: number, newRole: 'user' | 'admin') => {
    if (!confirm(`Are you sure you want to change the role for user ID ${id} to ${newRole}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        fetchData();
      } else {
        console.error('Failed to update user role', await res.json());
      }
    } catch (err) {
      console.error('Failed to update user role', err);
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedUserIds.length} selected users?`)) return;
    try {
      const res = await fetch('/api/admin/users/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedUserIds }),
      });
      if (res.ok) {
        setSelectedUserIds([]);
        fetchData();
      } else {
        console.error('Failed to bulk delete users', await res.json());
      }
    } catch (err) {
      console.error('Failed to bulk delete users', err);
    }
  };

  const handleLogSort = (column: 'timestamp' | 'action') => {
    if (logSortColumn === column) {
      setLogSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setLogSortColumn(column);
      setLogSortOrder('asc');
    }
  };

  const sortedLogs = [...logs].sort((a, b) => {
    const aValue = a[logSortColumn];
    const bValue = b[logSortColumn];

    if (logSortColumn === 'timestamp') {
      const dateA = new Date(aValue).getTime();
      const dateB = new Date(bValue).getTime();
      return logSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (logSortColumn === 'action') {
      return logSortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return 0;
  });

  const filteredScholarships = scholarships.filter(scholarship => {
    const matchesSearchQuery = scholarship.scholarshipName.toLowerCase().includes(scholarshipSearchQuery.toLowerCase()) ||
                             scholarship.university.toLowerCase().includes(scholarshipSearchQuery.toLowerCase());
    const matchesCountry = scholarshipFilterCountry === 'All' || scholarship.country === scholarshipFilterCountry;
    const matchesDegree = scholarshipFilterDegree === 'All' || scholarship.degreeLevel === scholarshipFilterDegree;
    const matchesFunding = scholarshipFilterFunding === 'All' || scholarship.fundingCoverage === scholarshipFilterFunding;

    return matchesSearchQuery && matchesCountry && matchesDegree && matchesFunding;
  });

  const filteredVisaGuidance = visaGuidance.filter(visa => {
    const matchesSearchQuery = visa.country.toLowerCase().includes(visaSearchQuery.toLowerCase()) ||
                             visa.visaType.toLowerCase().includes(visaSearchQuery.toLowerCase());
    const matchesCountry = visaFilterCountry === 'All' || visa.country === visaFilterCountry;

    return matchesSearchQuery && matchesCountry;
  });

  const countryCodeMap: { [key: string]: string } = {
    'United States': 'US',
    'Canada': 'CA',
    'United Kingdom': 'GB',
    'Australia': 'AU',
    'Germany': 'DE',
    'France': 'FR',
    'Japan': 'JP',
    'China': 'CN',
    'India': 'IN',
    'Brazil': 'BR',
    'South Africa': 'ZA',
    'New Zealand': 'NZ',
    'Ireland': 'IE',
    'Singapore': 'SG',
    'Netherlands': 'NL',
    'Sweden': 'SE',
    'Switzerland': 'CH',
    'Italy': 'IT',
    'Spain': 'ES',
    'Mexico': 'MX',
    'Argentina': 'AR',
    'Egypt': 'EG',
    'Nigeria': 'NG',
    'Kenya': 'KE',
    'Saudi Arabia': 'SA',
    'United Arab Emirates': 'AE',
    'Russia': 'RU',
    'South Korea': 'KR',
    'Indonesia': 'ID',
    'Malaysia': 'MY',
    'Thailand': 'TH',
    'Vietnam': 'VN',
    'Pakistan': 'PK',
    'Bangladesh': 'BD',
    'Philippines': 'PH',
    'Turkey': 'TR',
    'Greece': 'GR',
    'Portugal': 'PT',
    'Belgium': 'BE',
    'Austria': 'AT',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Finland': 'FI',
    'Poland': 'PL',
    'Ukraine': 'UA',
    'Colombia': 'CO',
    'Chile': 'CL',
    'Peru': 'PE',
    'Venezuela': 'VE',
    'Morocco': 'MA',
    'Algeria': 'DZ',
    'Ghana': 'GH',
    'Ethiopia': 'ET',
    'Israel': 'IL',
    'Iran': 'IR',
    'Iraq': 'IQ',
    'Afghanistan': 'AF',
    'Kazakhstan': 'KZ',
    'Uzbekistan': 'UZ',
    'Sri Lanka': 'LK',
    'Nepal': 'NP',
    'Myanmar': 'MM',
    'Cambodia': 'KH',
    'Laos': 'LA',
    'Mongolia': 'MN',
    'Fiji': 'FJ',
    'Papua New Guinea': 'PG',
    'Cuba': 'CU',
    'Jamaica': 'JM',
    'Dominican Republic': 'DO',
    'Haiti': 'HT',
    'Guatemala': 'GT',
    'Honduras': 'HN',
    'El Salvador': 'SV',
    'Nicaragua': 'NI',
    'Costa Rica': 'CR',
    'Panama': 'PA',
    'Ecuador': 'EC',
    'Bolivia': 'BO',
    'Paraguay': 'PY',
    'Uruguay': 'UY',
  };

  const getFlagUrl = (countryName: string) => {
    const countryCode = countryCodeMap[countryName];
    if (countryCode) {
      return `https://flagsapi.com/${countryCode}/flat/64.png`;
    }
    return '';
  };

  const handleSubmitVisaGuidance = async (e: React.FormEvent) => {
    e.preventDefault();
    const visaToSave = editingVisaGuidance || newVisaGuidance;
    const method = editingVisaGuidance ? 'PUT' : 'POST';
    const url = editingVisaGuidance ? `/api/admin/visa-guidance/${editingVisaGuidance.id}` : '/api/admin/visa-guidance';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visaToSave),
      });
      if (res.ok) {
        setNewVisaGuidance({});
        setEditingVisaGuidance(null);
        setIsAddingVisa(false);
        fetchData();
      } else {
        console.error('Failed to save visa guidance', await res.json());
      }
    } catch (err) {
      console.error('Failed to save visa guidance', err);
    }
  };

  const handleDeleteVisaGuidance = async (id: number) => {
    if (!confirm('Are you sure you want to delete this visa guidance entry?')) return;
    try {
      const res = await fetch(`/api/admin/visa-guidance/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        console.error('Failed to delete visa guidance', await res.json());
      }
    } catch (err) {
      console.error('Failed to delete visa guidance', err);
    }
  };

  const handleSubmitCountryComparison = async (e: React.FormEvent) => {
    e.preventDefault();
    const comparisonToSave = {
      ...(editingCountryComparison || newCountryComparison),
      pros: editingCountryComparison?.pros || newCountryComparison.pros || [],
      cons: editingCountryComparison?.cons || newCountryComparison.cons || []
    };
    const method = editingCountryComparison ? 'PUT' : 'POST';
    const url = editingCountryComparison ? `/api/admin/country-comparisons/${editingCountryComparison.id}` : '/api/admin/country-comparisons';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comparisonToSave),
      });
      if (res.ok) {
        setNewCountryComparison({});
        setEditingCountryComparison(null);
        setIsAddingCountryComparison(false);
        fetchData();
      } else {
        console.error('Failed to save country comparison', await res.json());
      }
    } catch (err) {
      console.error('Failed to save country comparison', err);
    }
  };

  const handleDeleteCountryComparison = async (id: number) => {
    if (!confirm('Are you sure you want to delete this country comparison?')) return;
    try {
      const res = await fetch(`/api/admin/country-comparisons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        console.error('Failed to delete country comparison', await res.json());
      }
    } catch (err) {
      console.error('Failed to delete country comparison', err);
    }
  };

  const filteredCountryComparisons = countryComparisons.filter(c => {
    const matchesSearch = c.country.toLowerCase().includes(comparisonSearchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Admin Control Center</h2>
            <p className="text-sm text-slate-500">Manage users and monitor system activity.</p>
            {activeTab === 'users' && selectedUserIds.length > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={handleBulkDeleteUsers}
                className="ml-4 px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedUserIds.length})
              </motion.button>
            )}
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users ({users.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activity Logs ({logs.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('scholarships')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'scholarships' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Scholarships ({scholarships.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('visa')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'visa' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Visa Guidance
            </div>
          </button>
          <button
            onClick={() => setActiveTab('comparisons')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'comparisons' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Country Comparisons ({countryComparisons.length})
            </div>
          </button>
        </div>
      </div>

      <div className="glass-card rounded-[32px] overflow-hidden border border-slate-100 shadow-sm grow">
        <div className="overflow-x-auto">
          {activeTab === 'users' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-4 py-5"><input type="checkbox" className="form-checkbox" onChange={handleSelectAllUsers} checked={users.length > 0 && selectedUserIds.length === users.length} /></th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 py-5">
                      <input 
                        type="checkbox" 
                        className="form-checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                      />
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center font-bold text-brand-600">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                        className={`input-field text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'logs' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
                  <th 
                    className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-500 transition-colors"
                    onClick={() => handleLogSort('action')}
                  >
                    Action {logSortColumn === 'action' && (logSortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Details</th>
                  <th 
                    className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:text-slate-500 transition-colors"
                    onClick={() => handleLogSort('timestamp')}
                  >
                    Time {logSortColumn === 'timestamp' && (logSortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-slate-900">{log.email}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Activity className="w-3.5 h-3.5 text-brand-500" />
                        {log.action}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs text-slate-500 max-w-xs truncate">{log.details}</div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="text-[10px] text-slate-400 font-medium">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'scholarships' && (
            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Scholarship Management</h3>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                  <div className="relative w-full sm:w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search scholarships..." 
                      className="input-field pl-9 pr-3 py-2 rounded-xl text-sm w-full"
                      value={scholarshipSearchQuery}
                      onChange={(e) => setScholarshipSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-4 w-full sm:w-2/3 justify-end">
                    <select
                      value={scholarshipFilterCountry}
                      onChange={(e) => setScholarshipFilterCountry(e.target.value)}
                      className="input-field py-2 text-sm"
                    >
                      <option value="All">All Countries</option>
                      {Array.from(new Set(scholarships.map(s => s.country))).sort().map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                    <select
                      value={scholarshipFilterDegree}
                      onChange={(e) => setScholarshipFilterDegree(e.target.value)}
                      className="input-field py-2 text-sm"
                    >
                      <option value="All">All Degree Levels</option>
                      {Array.from(new Set(scholarships.map(s => s.degreeLevel))).sort().map(degree => (
                        <option key={degree} value={degree}>{degree}</option>
                      ))}
                    </select>
                    <select
                      value={scholarshipFilterFunding}
                      onChange={(e) => setScholarshipFilterFunding(e.target.value)}
                      className="input-field py-2 text-sm"
                    >
                      <option value="All">All Funding Types</option>
                      {Array.from(new Set(scholarships.map(s => s.fundingCoverage))).sort().map(funding => (
                        <option key={funding} value={funding}>{funding}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => setIsAddingScholarship(true)} 
                      className="btn-primary flex items-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      Add New
                    </button>
                  </div>
                </div>
              </div>

              {(isAddingScholarship || editingScholarship) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-slate-100"
                >
                  <h4 className="text-lg font-bold text-slate-900 mb-4">{editingScholarship ? 'Edit Scholarship' : 'Add New Scholarship'}</h4>
                  <form onSubmit={handleSubmitScholarship} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Scholarship Name</label>
                      <input 
                        type="text" 
                        value={editingScholarship?.scholarshipName || newScholarship.scholarshipName || ''}
                        onChange={(e) => (editingScholarship ? setEditingScholarship({ ...editingScholarship, scholarshipName: e.target.value }) : setNewScholarship({ ...newScholarship, scholarshipName: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">University</label>
                      <input 
                        type="text" 
                        value={editingScholarship?.university || newScholarship.university || ''}
                        onChange={(e) => (editingScholarship ? setEditingScholarship({ ...editingScholarship, university: e.target.value }) : setNewScholarship({ ...newScholarship, university: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                      <input 
                        type="text" 
                        value={editingScholarship?.country || newScholarship.country || ''}
                        onChange={(e) => (editingScholarship ? setEditingScholarship({ ...editingScholarship, country: e.target.value }) : setNewScholarship({ ...newScholarship, country: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Degree Level</label>
                      <input 
                        type="text" 
                        value={editingScholarship?.degreeLevel || newScholarship.degreeLevel || ''}
                        onChange={(e) => (editingScholarship ? setEditingScholarship({ ...editingScholarship, degreeLevel: e.target.value }) : setNewScholarship({ ...newScholarship, degreeLevel: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Funding Coverage</label>
                      <input 
                        type="text" 
                        value={editingScholarship?.fundingCoverage || newScholarship.fundingCoverage || ''}
                        onChange={(e) => (editingScholarship ? setEditingScholarship({ ...editingScholarship, fundingCoverage: e.target.value }) : setNewScholarship({ ...newScholarship, fundingCoverage: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Eligibility</label>
                      <textarea 
                        value={editingScholarship?.eligibility || newScholarship.eligibility || ''}
                        onChange={(e) => (editingScholarship ? setEditingScholarship({ ...editingScholarship, eligibility: e.target.value }) : setNewScholarship({ ...newScholarship, eligibility: e.target.value }))}
                        className="input-field h-24"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Required Documents (comma-separated)</label>
                      <textarea 
                        value={(editingScholarship?.requiredDocuments as string[])?.join(', ') || (newScholarship.requiredDocuments as string[])?.join(', ') || ''}
                        onChange={(e) => (editingScholarship ? setEditingScholarship({ ...editingScholarship, requiredDocuments: e.target.value.split(',').map(s => s.trim()) }) : setNewScholarship({ ...newScholarship, requiredDocuments: e.target.value.split(',').map(s => s.trim()) }))}
                        className="input-field h-24"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">IELTS Requirement</label>
                      <input 
                        type="text" 
                        value={editingScholarship?.ieltsRequirement || newScholarship.ieltsRequirement || ''}
                        onChange={(e) => (editingScholarship ? setEditingScholarship({ ...editingScholarship, ieltsRequirement: e.target.value }) : setNewScholarship({ ...newScholarship, ieltsRequirement: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">IELTS Waiver Info</label>
                      <input 
                        type="text" 
                        value={editingScholarship?.ieltsWaiverInfo || newScholarship.ieltsWaiverInfo || ''}
                        onChange={(e) => (editingScholarship ? setEditingScholarship({ ...editingScholarship, ieltsWaiverInfo: e.target.value }) : setNewScholarship({ ...newScholarship, ieltsWaiverInfo: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Application Link</label>
                      <input 
                        type="text" 
                        value={editingScholarship?.applicationLink || newScholarship.applicationLink || ''}
                        onChange={(e) => (editingScholarship ? setEditingScholarship({ ...editingScholarship, applicationLink: e.target.value }) : setNewScholarship({ ...newScholarship, applicationLink: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Opening Date</label>
                      <input 
                        type="date" 
                        value={editingScholarship?.openingDate || newScholarship.openingDate || ''}
                        onChange={(e) => (editingScholarship ? setEditingScholarship({ ...editingScholarship, openingDate: e.target.value }) : setNewScholarship({ ...newScholarship, openingDate: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Closing Date</label>
                      <input 
                        type="date" 
                        value={editingScholarship?.closingDate || newScholarship.closingDate || ''}
                        onChange={(e) => (editingScholarship ? setEditingScholarship({ ...editingScholarship, closingDate: e.target.value }) : setNewScholarship({ ...newScholarship, closingDate: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Competitiveness Level</label>
                      <select 
                        value={editingScholarship?.competitivenessLevel || newScholarship.competitivenessLevel || ''}
                        onChange={(e) => (editingScholarship ? setEditingScholarship({ ...editingScholarship, competitivenessLevel: e.target.value }) : setNewScholarship({ ...newScholarship, competitivenessLevel: e.target.value }))}
                        className="input-field"
                      >
                        <option value="">Select Level</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <select 
                        value={editingScholarship?.status || newScholarship.status || 'Active'}
                        onChange={(e) => (editingScholarship ? setEditingScholarship({ ...editingScholarship, status: e.target.value }) : setNewScholarship({ ...newScholarship, status: e.target.value }))}
                        className="input-field"
                      >
                        <option value="Active">Active</option>
                        <option value="Closed">Closed</option>
                        <option value="Upcoming">Upcoming</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox"
                        checked={editingScholarship?.isAnnual || newScholarship.isAnnual || false}
                        onChange={(e) => (editingScholarship ? setEditingScholarship({ ...editingScholarship, isAnnual: e.target.checked }) : setNewScholarship({ ...newScholarship, isAnnual: e.target.checked }))}
                        className="w-4 h-4 text-brand-600 rounded border-slate-300"
                        id="isAnnual"
                      />
                      <label htmlFor="isAnnual" className="text-sm font-medium text-slate-700">Is Annual Scholarship?</label>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ranking Reason (Optional)</label>
                      <textarea 
                        value={editingScholarship?.rankingReason || newScholarship.rankingReason || ''}
                        onChange={(e) => (editingScholarship ? setEditingScholarship({ ...editingScholarship, rankingReason: e.target.value }) : setNewScholarship({ ...newScholarship, rankingReason: e.target.value }))}
                        className="input-field h-20"
                        placeholder="Why is this a good match?"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma-separated)</label>
                      <textarea 
                        value={(editingScholarship?.tags as string[])?.join(', ') || (newScholarship.tags as string[])?.join(', ') || ''}
                        onChange={(e) => (editingScholarship ? setEditingScholarship({ ...editingScholarship, tags: e.target.value.split(',').map(s => s.trim()) }) : setNewScholarship({ ...newScholarship, tags: e.target.value.split(',').map(s => s.trim()) }))}
                        className="input-field h-24"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                      <button 
                        type="button" 
                        onClick={() => { setNewScholarship({}); setEditingScholarship(null); setIsAddingScholarship(false); }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn-primary"
                      >
                        {editingScholarship ? 'Save Changes' : 'Add Scholarship'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scholarship</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">University</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Funding</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tags</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dates</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredScholarships.map((scholarship) => (
                    <tr key={scholarship.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="text-sm font-bold text-slate-900">{scholarship.scholarshipName}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-xs text-slate-500">{scholarship.university}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5" />
                          {scholarship.country}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                          {scholarship.fundingCoverage}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-wrap gap-1">
                          {scholarship.tags?.map((tag, index) => (
                            <span key={index} className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {scholarship.openingDate} - {scholarship.closingDate}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingScholarship(scholarship)}
                            className="p-2 text-slate-400 hover:text-brand-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteScholarship(scholarship.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'visa' && (
            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Visa Guidance Management</h3>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                  <div className="relative w-full sm:w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search by country or visa type..." 
                      className="input-field pl-9 pr-3 py-2 rounded-xl text-sm w-full"
                      value={visaSearchQuery}
                      onChange={(e) => setVisaSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-4 w-full sm:w-2/3 justify-end">
                    <select
                      value={visaFilterCountry}
                      onChange={(e) => setVisaFilterCountry(e.target.value)}
                      className="input-field py-2 text-sm"
                    >
                      <option value="All">All Countries</option>
                      {Array.from(new Set(visaGuidance.map(v => v.country))).sort().map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => setIsAddingVisa(true)} 
                      className="btn-primary flex items-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      Add New
                    </button>
                  </div>
                </div>
              </div>

              {(isAddingVisa || editingVisaGuidance) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-slate-100"
                >
                  <h4 className="text-lg font-bold text-slate-900 mb-4">{editingVisaGuidance ? 'Edit Visa Guidance' : 'Add New Visa Guidance'}</h4>
                  <form onSubmit={handleSubmitVisaGuidance} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                      <input 
                        type="text" 
                        value={editingVisaGuidance?.country || newVisaGuidance.country || ''}
                        onChange={(e) => (editingVisaGuidance ? setEditingVisaGuidance({ ...editingVisaGuidance, country: e.target.value }) : setNewVisaGuidance({ ...newVisaGuidance, country: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Visa Type</label>
                      <input 
                        type="text" 
                        value={editingVisaGuidance?.visaType || newVisaGuidance.visaType || ''}
                        onChange={(e) => (editingVisaGuidance ? setEditingVisaGuidance({ ...editingVisaGuidance, visaType: e.target.value }) : setNewVisaGuidance({ ...newVisaGuidance, visaType: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Requirements</label>
                      <textarea 
                        value={editingVisaGuidance?.requirements || newVisaGuidance.requirements || ''}
                        onChange={(e) => (editingVisaGuidance ? setEditingVisaGuidance({ ...editingVisaGuidance, requirements: e.target.value }) : setNewVisaGuidance({ ...newVisaGuidance, requirements: e.target.value }))}
                        className="input-field h-24"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Processing Time</label>
                      <input 
                        type="text" 
                        value={editingVisaGuidance?.processingTime || newVisaGuidance.processingTime || ''}
                        onChange={(e) => (editingVisaGuidance ? setEditingVisaGuidance({ ...editingVisaGuidance, processingTime: e.target.value }) : setNewVisaGuidance({ ...newVisaGuidance, processingTime: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Fees</label>
                      <input 
                        type="text" 
                        value={editingVisaGuidance?.fees || newVisaGuidance.fees || ''}
                        onChange={(e) => (editingVisaGuidance ? setEditingVisaGuidance({ ...editingVisaGuidance, fees: e.target.value }) : setNewVisaGuidance({ ...newVisaGuidance, fees: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Application Link</label>
                      <input 
                        type="text" 
                        value={editingVisaGuidance?.applicationLink || newVisaGuidance.applicationLink || ''}
                        onChange={(e) => (editingVisaGuidance ? setEditingVisaGuidance({ ...editingVisaGuidance, applicationLink: e.target.value }) : setNewVisaGuidance({ ...newVisaGuidance, applicationLink: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                      <textarea 
                        value={editingVisaGuidance?.notes || newVisaGuidance.notes || ''}
                        onChange={(e) => (editingVisaGuidance ? setEditingVisaGuidance({ ...editingVisaGuidance, notes: e.target.value }) : setNewVisaGuidance({ ...newVisaGuidance, notes: e.target.value }))}
                        className="input-field h-24"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                      <button 
                        type="button" 
                        onClick={() => { setNewVisaGuidance({}); setEditingVisaGuidance(null); setIsAddingVisa(false); }} 
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn-primary"
                      >
                        {editingVisaGuidance ? 'Save Changes' : 'Add Visa Guidance'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visa Type</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requirements</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processing Time</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fees</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Application Link</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredVisaGuidance.map((visa) => (
                    <tr key={visa.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          {getFlagUrl(visa.country) && (
                            <img src={getFlagUrl(visa.country)} alt={`${visa.country} flag`} className="w-6 h-auto rounded-md" referrerPolicy="no-referrer" />
                          )}
                          <div className="text-sm font-bold text-slate-900">{visa.country}</div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-xs text-slate-500">{visa.visaType}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-xs text-slate-500 max-w-xs truncate">{visa.requirements}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-xs text-slate-500">{visa.processingTime}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-xs text-slate-500">{visa.fees}</div>
                      </td>
                      <td className="px-8 py-5">
                        <a href={visa.applicationLink} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline">Apply</a>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingVisaGuidance(visa)}
                            className="p-2 text-slate-400 hover:text-brand-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteVisaGuidance(visa.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'comparisons' && (
            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Country Comparisons</h3>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                  <div className="relative w-full sm:w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search by country..." 
                      className="input-field pl-9 pr-3 py-2 rounded-xl text-sm w-full"
                      value={comparisonSearchQuery}
                      onChange={(e) => setComparisonSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-4 w-full sm:w-2/3 justify-end">
                    <button 
                      onClick={() => setIsAddingCountryComparison(true)} 
                      className="btn-primary flex items-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      Add New
                    </button>
                  </div>
                </div>
              </div>

              {(isAddingCountryComparison || editingCountryComparison) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-slate-100"
                >
                  <h4 className="text-lg font-bold text-slate-900 mb-4">{editingCountryComparison ? 'Edit Country Comparison' : 'Add New Country Comparison'}</h4>
                  <form onSubmit={handleSubmitCountryComparison} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                      <input 
                        type="text" 
                        value={editingCountryComparison?.country || newCountryComparison.country || ''}
                        onChange={(e) => (editingCountryComparison ? setEditingCountryComparison({ ...editingCountryComparison, country: e.target.value }) : setNewCountryComparison({ ...newCountryComparison, country: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Visa Difficulty</label>
                      <select 
                        value={editingCountryComparison?.visaDifficulty || newCountryComparison.visaDifficulty || 'Moderate'}
                        onChange={(e) => {
                           const val = e.target.value as 'Easy' | 'Moderate' | 'Hard';
                           (editingCountryComparison ? setEditingCountryComparison({ ...editingCountryComparison, visaDifficulty: val }) : setNewCountryComparison({ ...newCountryComparison, visaDifficulty: val }))
                        }}
                        className="input-field"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cost of Living</label>
                      <input 
                        type="text" 
                        value={editingCountryComparison?.costOfLiving || newCountryComparison.costOfLiving || ''}
                        onChange={(e) => (editingCountryComparison ? setEditingCountryComparison({ ...editingCountryComparison, costOfLiving: e.target.value }) : setNewCountryComparison({ ...newCountryComparison, costOfLiving: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">PR Options</label>
                      <input 
                        type="text" 
                        value={editingCountryComparison?.prOptions || newCountryComparison.prOptions || ''}
                        onChange={(e) => (editingCountryComparison ? setEditingCountryComparison({ ...editingCountryComparison, prOptions: e.target.value }) : setNewCountryComparison({ ...newCountryComparison, prOptions: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Acceptance Rate</label>
                      <input 
                        type="text" 
                        value={editingCountryComparison?.acceptanceRate || newCountryComparison.acceptanceRate || ''}
                        onChange={(e) => (editingCountryComparison ? setEditingCountryComparison({ ...editingCountryComparison, acceptanceRate: e.target.value }) : setNewCountryComparison({ ...newCountryComparison, acceptanceRate: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Part-time Work Allowance</label>
                      <input 
                        type="text" 
                        value={editingCountryComparison?.partTimeWorkAllowance || newCountryComparison.partTimeWorkAllowance || ''}
                        onChange={(e) => (editingCountryComparison ? setEditingCountryComparison({ ...editingCountryComparison, partTimeWorkAllowance: e.target.value }) : setNewCountryComparison({ ...newCountryComparison, partTimeWorkAllowance: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Post-study Work Duration</label>
                      <input 
                        type="text" 
                        value={editingCountryComparison?.postStudyWorkDuration || newCountryComparison.postStudyWorkDuration || ''}
                        onChange={(e) => (editingCountryComparison ? setEditingCountryComparison({ ...editingCountryComparison, postStudyWorkDuration: e.target.value }) : setNewCountryComparison({ ...newCountryComparison, postStudyWorkDuration: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Language Requirements</label>
                      <input 
                        type="text" 
                        value={editingCountryComparison?.languageRequirements || newCountryComparison.languageRequirements || ''}
                        onChange={(e) => (editingCountryComparison ? setEditingCountryComparison({ ...editingCountryComparison, languageRequirements: e.target.value }) : setNewCountryComparison({ ...newCountryComparison, languageRequirements: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">English Proficiency Requirements</label>
                      <input 
                        type="text" 
                        value={editingCountryComparison?.englishProficiencyRequirements || newCountryComparison.englishProficiencyRequirements || ''}
                        onChange={(e) => (editingCountryComparison ? setEditingCountryComparison({ ...editingCountryComparison, englishProficiencyRequirements: e.target.value }) : setNewCountryComparison({ ...newCountryComparison, englishProficiencyRequirements: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Average Tuition Fees</label>
                      <input 
                        type="text" 
                        value={editingCountryComparison?.averageTuitionFees || newCountryComparison.averageTuitionFees || ''}
                        onChange={(e) => (editingCountryComparison ? setEditingCountryComparison({ ...editingCountryComparison, averageTuitionFees: e.target.value }) : setNewCountryComparison({ ...newCountryComparison, averageTuitionFees: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Visa Success Probability (0-100)</label>
                      <input 
                        type="number" 
                        min="0" max="100"
                        value={editingCountryComparison?.visaSuccessProbability || newCountryComparison.visaSuccessProbability || ''}
                        onChange={(e) => (editingCountryComparison ? setEditingCountryComparison({ ...editingCountryComparison, visaSuccessProbability: Number(e.target.value) }) : setNewCountryComparison({ ...newCountryComparison, visaSuccessProbability: Number(e.target.value) }))}
                        className="input-field"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Pros (comma separated)</label>
                      <textarea 
                        value={(editingCountryComparison?.pros || newCountryComparison.pros || []).join(', ')}
                        onChange={(e) => {
                           const arr = e.target.value.split(',').map(s=>s.trim()).filter(Boolean);
                           (editingCountryComparison ? setEditingCountryComparison({ ...editingCountryComparison, pros: arr }) : setNewCountryComparison({ ...newCountryComparison, pros: arr }))
                        }}
                        className="input-field h-24"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cons (comma separated)</label>
                      <textarea 
                        value={(editingCountryComparison?.cons || newCountryComparison.cons || []).join(', ')}
                        onChange={(e) => {
                           const arr = e.target.value.split(',').map(s=>s.trim()).filter(Boolean);
                           (editingCountryComparison ? setEditingCountryComparison({ ...editingCountryComparison, cons: arr }) : setNewCountryComparison({ ...newCountryComparison, cons: arr }))
                        }}
                        className="input-field h-24"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                      <button 
                        type="button" 
                        onClick={() => { setNewCountryComparison({}); setEditingCountryComparison(null); setIsAddingCountryComparison(false); }} 
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn-primary"
                      >
                        {editingCountryComparison ? 'Save Changes' : 'Add Comparison'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Difficulty/Cost</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prob %</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pros</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cons</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredCountryComparisons.map((comp) => (
                    <tr key={comp.id || comp.country} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          {getFlagUrl(comp.country) && (
                            <img src={getFlagUrl(comp.country)} alt={`${comp.country} flag`} className="w-6 h-auto rounded-md" referrerPolicy="no-referrer" />
                          )}
                          <div className="text-sm font-bold text-slate-900">{comp.country}</div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase max-w-fit ${
                            comp.visaDifficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700' :
                            comp.visaDifficulty === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {comp.visaDifficulty}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{comp.costOfLiving}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className={`text-xs font-bold ${
                            comp.visaSuccessProbability >= 80 ? 'text-emerald-600' :
                            comp.visaSuccessProbability >= 50 ? 'text-amber-600' :
                            'text-rose-600'
                          }`}>{comp.visaSuccessProbability}%</div>
                      </td>
                      <td className="px-8 py-5 min-w-[200px]">
                        <ExpandableList items={comp.pros} type="pros" />
                      </td>
                      <td className="px-8 py-5 min-w-[200px]">
                        <ExpandableList items={comp.cons} type="cons" />
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingCountryComparison(comp)}
                            className="p-2 text-slate-400 hover:text-brand-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => comp.id && handleDeleteCountryComparison(comp.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>
    </div>
  );
}
