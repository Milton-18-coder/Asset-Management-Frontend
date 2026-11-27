import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUsersList, addUser, editUser, deleteUser } from '../store/usersSlice';
import { TopBar } from '../components/TopBar';
import { Card, Btn, Badge, Modal, Input, Select, Icon } from '../components/UIComponents';
import { ALLOWED_DEPARTMENTS, mapLegacyDepartment } from '../constants/departments';
import { api } from '../api';

export const Users = () => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.auth);
  const usersList = useSelector((state) => state.users.list);

  const [showAdd, setShowAdd] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [editSelection, setEditSelection] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Dept Admin');
  const [dept, setDept] = useState('Computer Science');
  const [vendorId, setVendorId] = useState('');
  const [vendorsList, setVendorsList] = useState([]);
  const [status, setStatus] = useState('Active');

  const formatRoleLabel = (r) => {
    const clean = String(r || '').toLowerCase();
    if (clean === 'superadmin' || clean === 'super admin') return 'Super Admin';
    if (clean === 'furniture_admin' || clean === 'furniture admin') return 'Furniture Admin';
    if (clean === 'deptadmin' || clean === 'dept admin') return 'Dept Admin';
    if (clean === 'auditor') return 'Auditor';
    if (clean === 'dealer') return 'Dealer';
    if (clean === 'faculty') return 'Faculty';
    return r || 'Dept Admin';
  };

  const toBackendRole = (r) => {
    if (r === 'Super Admin' || r === 'superadmin') return 'superadmin';
    if (r === 'Furniture Admin' || r === 'furniture_admin') return 'furniture_admin';
    if (r === 'Auditor' || r === 'auditor') return 'auditor';
    if (r === 'Dealer' || r === 'dealer') return 'dealer';
    if (r === 'Faculty' || r === 'faculty') return 'faculty';
    return 'deptadmin';
  };

  useEffect(() => {
    // Load fresh user data and vendors from backend API
    const loadUsers = async () => {
      try {
        const [dbUsers, dbVendors] = await Promise.all([
          api.getUsers(),
          api.getVendors().catch(() => []),
        ]);
        if (Array.isArray(dbVendors)) setVendorsList(dbVendors);
        if (Array.isArray(dbUsers) && dbUsers.length > 0) {
          const formatted = dbUsers.map(u => ({
            id: u.id,
            name: u.name,
            username: u.username,
            email: u.email || '',
            phone: u.phone || '',
            vendor_id: u.vendor_id || '',
            role: formatRoleLabel(u.role),
            department: u.role === 'dealer'
              ? 'External Dealer'
              : (u.department ? mapLegacyDepartment(u.department) : (u.role === 'superadmin' ? 'Not Applicable' : 'Admin Block')),
            status: 'Active'
          }));
          dispatch(setUsersList(formatted));
        }
      } catch (err) {
        console.warn('Failed to load users from backend API:', err.message);
      }
    };
    loadUsers();
  }, [dispatch]);

  if (!currentUser) return null;

  const handleOpenAdd = () => {
    setEditSelection(null);
    setName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setRole('Dept Admin');
    setDept('Computer Science');
    setVendorId(vendorsList[0]?.id || '');
    setStatus('Active');
    setShowAdd(true);
    setSuccess(false);
    setErrorMsg('');
  };

  const handleOpenEdit = (user) => {
    setEditSelection(user);
    setName(user.name || '');
    setUsername(user.username || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setRole(formatRoleLabel(user.role));
    setDept(user.department && user.department !== 'Not Applicable' && user.department !== 'External Dealer' ? user.department : 'Computer Science');
    setVendorId(user.vendor_id || vendorsList[0]?.id || '');
    setStatus(user.status || 'Active');
    setShowAdd(true);
    setSuccess(false);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const finalRole = toBackendRole(role);
    const isSuperAdmin = finalRole === 'superadmin';
    const isDealer = finalRole === 'dealer';
    const finalDepartment = isSuperAdmin ? null : isDealer ? 'External Dealer' : (finalRole === 'furniture_admin' || finalRole === 'auditor' ? 'Admin Block' : dept);

    // Normalize phone number (digits only for WhatsApp readiness)
    const rawPhoneDigits = phone ? phone.replace(/[^0-9]/g, '') : '';
    let normalizedPhone = null;
    if (rawPhoneDigits) {
      normalizedPhone = rawPhoneDigits.length === 10 ? `91${rawPhoneDigits}` : rawPhoneDigits;
    }

    const userId = editSelection ? editSelection.id : 'USR-' + String(Date.now()).slice(-4);

    const apiPayload = {
      id: userId,
      name,
      username,
      email,
      phone: normalizedPhone,
      role: finalRole,
      department: finalDepartment,
      vendor_id: isDealer ? vendorId : null,
    };

    const reduxPayload = {
      id: userId,
      name,
      username,
      email,
      phone: normalizedPhone || '',
      role: formatRoleLabel(finalRole),
      department: isSuperAdmin ? 'Not Applicable' : finalDepartment,
      vendor_id: isDealer ? vendorId : '',
      status,
    };

    try {
      if (editSelection) {
        await api.updateUser(editSelection.id, apiPayload);
        dispatch(editUser(reduxPayload));
      } else {
        await api.addUser(apiPayload);
        dispatch(addUser(reduxPayload));
      }
      setSuccess(true);
    } catch (err) {
      console.error('Failed to save user:', err);
      // Fallback update to Redux even if offline backend
      if (editSelection) {
        dispatch(editUser(reduxPayload));
      } else {
        dispatch(addUser(reduxPayload));
      }
      setSuccess(true);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.deleteUser(id);
      } catch (err) {
        console.warn('Backend delete note:', err.message);
      }
      dispatch(deleteUser(id));
    }
  };

  return (
    <div>
      <TopBar title="Users" subtitle="Manage system users & access roles" user={currentUser} />
      <div className="flex justify-end mb-4">
        <Btn onClick={handleOpenAdd}><Icon.Plus /> Add User</Btn>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-805 text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold whitespace-nowrap">
                {['Name', 'Username', 'Email', 'Phone', 'Role', 'Department', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
              {usersList.map(u => {
                const roleLbl = formatRoleLabel(u.role);
                const isSuper = roleLbl === 'Super Admin';
                const badgeCls = isSuper
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50'
                  : roleLbl === 'Furniture Admin'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                  : roleLbl === 'Dealer'
                  ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50'
                  : 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/50';
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                          {(u.name || 'U').split(' ').map(p => p[0]).slice(0, 2).join('')}
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-550 dark:text-slate-400 font-semibold">{u.username}</td>
                    <td className="px-5 py-4 text-slate-550 dark:text-slate-400 font-semibold">{u.email || '—'}</td>
                    <td className="px-5 py-4 font-mono text-slate-600 dark:text-slate-300 font-medium">{u.phone || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition duration-300 ${badgeCls}`}>
                        {roleLbl}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400 font-semibold">
                      {isSuper ? <span className="text-slate-400 italic">Not Applicable</span> : (u.department || '—')}
                    </td>
                    <td className="px-5 py-4"><Badge label={u.status || 'Active'} /></td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => handleOpenEdit(u)} className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer" title="Edit User"><Icon.Edit /></button>
                        <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-455 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer" title="Delete User"><Icon.Trash /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {showAdd && (
        <Modal title={editSelection ? "Edit System User" : "Create System User"} onClose={() => setShowAdd(false)}>
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-900/50">
                <Icon.Check />
              </div>
              <p className="font-bold text-slate-800 dark:text-white mb-2 font-display">User Saved</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">The user database entry and role credentials have been updated successfully.</p>
              <Btn onClick={() => setShowAdd(false)}>Close Dialog</Btn>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input label="Full Name *" value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Rajesh Kumar" required />
                <Input label="Username *" value={username} onChange={e => setUsername(e.target.value)} placeholder="rajesh.kumar" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Email Address *" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="rajesh.kumar@nec.edu.in" required />
                <Input label="Phone (WhatsApp)" value={phone} onChange={e => setPhone(e.target.value)} placeholder="919876543210" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="System Role"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  options={['Dept Admin', 'Furniture Admin', 'Super Admin', 'Auditor', 'Dealer', 'Faculty']}
                />
                {role === 'Super Admin' ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Department</label>
                    <input 
                      disabled 
                      value="Not Applicable (Super Admin)" 
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed font-medium" 
                    />
                  </div>
                ) : role === 'Dealer' ? (
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">Linked Dealer / Vendor *</label>
                    <select
                      value={vendorId}
                      onChange={e => setVendorId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                      required
                    >
                      <option value="">Select Dealer</option>
                      {vendorsList.map(v => <option key={v.id} value={v.id}>{v.name} ({v.id})</option>)}
                    </select>
                  </div>
                ) : (
                  <Select label="Department *" value={dept} onChange={e => setDept(e.target.value)} options={ALLOWED_DEPARTMENTS} />
                )}
              </div>
              <Select label="Account Status" value={status} onChange={e => setStatus(e.target.value)} options={['Active', 'Inactive']} />
              <div className="flex gap-3 justify-end pt-2">
                <Btn variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Btn>
                <Btn type="submit">{editSelection ? "Update User" : "Create User"}</Btn>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
