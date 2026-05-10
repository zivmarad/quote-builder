'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import RequireAuth from '../components/RequireAuth';
import { useCustomers, type Customer, type CustomerInput } from '../contexts/CustomersContext';
import { useLanguage } from '../contexts/LanguageContext';
import ConfirmDialog from '../components/ConfirmDialog';

function emptyForm(): CustomerInput {
  return { full_name: '', phone: '', email: '', address: '', city: '', notes: '' };
}

export default function CustomersPage() {
  return (
    <RequireAuth>
      <CustomersPageInner />
    </RequireAuth>
  );
}

function CustomersPageInner() {
  const { t, dir } = useLanguage();
  const { customers, isLoaded, saveCustomer, deleteCustomer } = useCustomers();
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerInput>(() => emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const hay = [c.full_name, c.phone, c.email, c.address, c.city, c.notes].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [customers, search]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setEditorOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingId(c.id);
    setForm({
      id: c.id,
      full_name: c.full_name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      city: c.city,
      notes: c.notes,
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      setToast(t('customers.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload: CustomerInput = {
        ...form,
        id: editingId ?? undefined,
        full_name: form.full_name.trim(),
      };
      const ok = await saveCustomer(payload);
      setToast(ok ? t('customers.saved') : t('customers.error'));
      if (ok) closeEditor();
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteId) return;
    const ok = await deleteCustomer(deleteId);
    setToast(ok ? t('customers.deleted') : t('customers.error'));
    setDeleteId(null);
  }, [deleteId, deleteCustomer, t]);

  return (
    <main className="min-h-screen bg-[#F8FAFC]" dir={dir}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-slate-900 truncate">{t('customers.title')}</h1>
              <p className="text-slate-500 text-sm">{t('customers.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-white border border-slate-200"
            >
              <ArrowRight size={18} className="rotate-180" />
              {t('common.backHome')}
            </Link>
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-1.5 text-sm font-bold bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700"
            >
              <Plus size={18} />
              {t('customers.add')}
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('customers.searchPlaceholder')}
            className="w-full pr-11 pl-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {!isLoaded ? (
          <p className="text-slate-500 text-center py-12">{t('common.loading')}</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-600 font-medium">{customers.length === 0 ? t('customers.empty') : t('customers.noResults')}</p>
            {customers.length === 0 && (
              <button type="button" onClick={openNew} className="mt-4 text-blue-600 font-bold hover:underline">
                {t('customers.addFirst')}
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((c) => (
              <li
                key={c.id}
                className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm"
              >
                <div className="min-w-0 text-right">
                  <p className="font-black text-slate-900 truncate">{c.full_name}</p>
                  <p className="text-sm text-slate-600 truncate">
                    {[c.phone, c.email].filter(Boolean).join(' · ') || '—'}
                  </p>
                  {(c.address || c.city) && (
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {[c.address, c.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100"
                    aria-label={t('customers.edit')}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(c.id)}
                    className="p-2.5 rounded-xl text-red-600 hover:bg-red-50"
                    aria-label={t('customers.delete')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" role="dialog" aria-modal>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4" dir={dir}>
            <h2 className="text-xl font-black text-slate-900">{editingId ? t('customers.edit') : t('customers.add')}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{t('customers.fullName')} *</label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-right"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">{t('customers.phone')}</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">{t('customers.email')}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-right"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{t('customers.address')}</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{t('customers.city')}</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{t('customers.notes')}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-right resize-y"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={closeEditor} className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">
                {t('common.close')}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="px-4 py-2 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? t('common.loading') : t('customers.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title={t('customers.delete')}
        message={t('customers.deleteConfirm')}
        confirmLabel={t('customers.delete')}
        cancelLabel={t('common.close')}
        danger
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void handleConfirmDelete()}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium shadow-lg">
          {toast}
          <button type="button" className="mr-2 text-slate-300" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}
    </main>
  );
}
