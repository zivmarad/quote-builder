'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Loader2, Sparkles } from 'lucide-react';
import RequireAuth from '../components/RequireAuth';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function WelcomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, setProfile, syncStatus } = useProfile();
  const { t, dir } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goHome = () => router.push('/');

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const input = e.target;
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = async () => {
        const max = 220;
        let w = img.width;
        let h = img.height;
        if (w > max || h > max) {
          if (w > h) {
            h = Math.round((h * max) / w);
            w = max;
          } else {
            w = Math.round((w * max) / h);
            h = max;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        let compressed = dataUrl;
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          try {
            compressed = canvas.toDataURL('image/jpeg', 0.78);
          } catch {
            compressed = dataUrl;
          }
        }

        if (user?.id) {
          setLogoUploading(true);
          try {
            const res = await fetch('/api/upload/profile-logo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ dataUrl: compressed }),
            });
            const j = (await res.json()) as { ok?: boolean; url?: string };
            if (res.ok && j?.ok && typeof j.url === 'string' && j.url.startsWith('http')) {
              setProfile({ logo: j.url });
            } else {
              setProfile({ logo: compressed });
            }
          } catch {
            setProfile({ logo: compressed });
          } finally {
            setLogoUploading(false);
          }
        } else {
          setProfile({ logo: compressed });
        }
        input.value = '';
      };
      img.onerror = () => {
        setProfile({ logo: dataUrl });
        input.value = '';
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!profile.businessName.trim()) {
      setError(t('welcome.businessNameRequired'));
      return;
    }
    goHome();
  };

  return (
    <RequireAuth>
      <main className="min-h-screen bg-[#F8FAFC]" dir={dir}>
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/90 to-transparent pointer-events-none" />
          <div className="relative max-w-lg mx-auto px-5 py-8 sm:py-12">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/25">
                <Sparkles size={32} className="text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">{t('welcome.title')}</h1>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                {t('welcome.subtitle')}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleContinue} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t('profile.logo')}</label>
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 ${logoUploading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                      onClick={() => !logoUploading && fileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && !logoUploading && fileInputRef.current?.click()}
                    >
                      {logoUploading ? (
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" aria-hidden />
                      ) : profile.logo ? (
                        <img
                          src={profile.logo}
                          alt={t('profile.logo')}
                          className="w-full h-full object-contain"
                          {...(profile.logo.startsWith('http') ? { crossOrigin: 'anonymous' as const } : {})}
                        />
                      ) : (
                        <Building2 className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} disabled={logoUploading} className="hidden" />
                    <div>
                      <p className="text-slate-500 text-sm">{t('profile.uploadLogoHint')}</p>
                      {logoUploading && (
                        <p className="text-sm text-blue-600 mt-1 font-medium">{t('profile.logoUploading')}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="welcome-businessName" className="block text-sm font-bold text-slate-700 mb-2">
                    {t('profile.businessName')} *
                  </label>
                  <input
                    id="welcome-businessName"
                    type="text"
                    value={profile.businessName}
                    onChange={(e) => setProfile({ businessName: e.target.value })}
                    placeholder={t('profile.businessNamePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="welcome-companyId" className="block text-sm font-bold text-slate-700 mb-2">
                    {t('welcome.companyId')}
                  </label>
                  <input
                    id="welcome-companyId"
                    type="text"
                    value={profile.companyId ?? ''}
                    onChange={(e) => setProfile({ companyId: e.target.value || undefined })}
                    placeholder={t('welcome.companyIdPlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label htmlFor="welcome-phone" className="block text-sm font-bold text-slate-700 mb-2">
                    {t('profile.phone')}
                  </label>
                  <input
                    id="welcome-phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ phone: e.target.value })}
                    placeholder={t('profile.phonePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    dir="ltr"
                  />
                </div>

                <p className="text-slate-400 text-xs">{t('profile.detailsNote')}</p>
                {syncStatus === 'saving' && (
                  <p className="text-blue-600 text-sm font-medium" role="status">{t('profile.saving')}</p>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors active:scale-[0.98]"
                  >
                    {t('welcome.continue')}
                  </button>
                  <button
                    type="button"
                    onClick={goHome}
                    className="w-full py-3 rounded-xl font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {t('welcome.skip')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
