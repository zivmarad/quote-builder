function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

function downloadWithAnchor(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function openSaveSheet(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.dir = 'rtl';
    root.setAttribute('role', 'dialog');
    root.style.cssText =
      'position:fixed;inset:0;z-index:400;background:rgba(15,23,42,.45);display:flex;align-items:flex-end;justify-content:center;padding:16px;font-family:Heebo,sans-serif;';
    const card = document.createElement('div');
    card.style.cssText =
      'background:#fff;border-radius:28px;padding:22px 20px 18px;width:min(420px,100%);box-shadow:0 16px 40px rgba(15,23,42,.18);';
    const title = document.createElement('p');
    title.textContent = 'הקובץ מוכן';
    title.style.cssText = 'margin:0 0 6px;font-size:18px;font-weight:700;color:#0f172a;';
    const text = document.createElement('p');
    text.textContent = 'בטלפון השמירה נפתחת ממסך השיתוף. לחצו שמירה ובחרו "שמור לקבצים".';
    text.style.cssText = 'margin:0 0 16px;font-size:14px;line-height:1.5;color:#64748b;';
    const save = document.createElement('button');
    save.type = 'button';
    save.textContent = 'שמור בטלפון';
    save.style.cssText =
      'width:100%;border:0;border-radius:999px;background:#1e3a8a;color:#fff;font-weight:700;font-size:16px;padding:12px 16px;';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'סגור';
    cancel.style.cssText =
      'width:100%;margin-top:8px;border:0;background:transparent;color:#64748b;font-weight:600;font-size:14px;padding:10px;';

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      root.remove();
      resolve(ok);
    };

    save.onclick = async () => {
      save.disabled = true;
      try {
        if (typeof navigator.share === 'function') {
          const data: ShareData = { files: [file], title: 'הצעת מחיר' };
          if (!navigator.canShare || navigator.canShare(data)) {
            await navigator.share(data);
            finish(true);
            return;
          }
        }
        downloadWithAnchor(file, file.name);
        finish(true);
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          save.disabled = false;
          return;
        }
        downloadWithAnchor(file, file.name);
        finish(true);
      }
    };
    cancel.onclick = () => finish(false);
    card.append(title, text, save, cancel);
    root.append(card);
    document.body.appendChild(root);
  });
}

/** Saves a PDF without navigating the current page. On iPhone the file goes through the share sheet. */
export async function savePdfBlob(blob: Blob, filename: string): Promise<boolean> {
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (!isIosDevice()) {
    downloadWithAnchor(blob, filename);
    return true;
  }
  if (typeof navigator.share === 'function') {
    try {
      const data: ShareData = { files: [file], title: 'הצעת מחיר' };
      if (!navigator.canShare || navigator.canShare(data)) {
        await navigator.share(data);
        return true;
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return false;
    }
  }
  return openSaveSheet(file);
}
