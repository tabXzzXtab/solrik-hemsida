// Accessible client-side validation + fetch submission for [data-form] forms.
// Without JS the forms still work: native validation and a normal POST.

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function fileAccepted(file: File, accept: string): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .some((rule) => (rule.startsWith('.') ? name.endsWith(rule) : rule.endsWith('/*') ? type.startsWith(rule.slice(0, -1)) : type === rule));
}

function initForm(form: HTMLFormElement) {
  form.noValidate = true;
  const d = form.dataset;
  const maxBytes = Number(d.maxBytes) || Infinity;
  const summary = form.querySelector<HTMLElement>('[data-error-summary]');
  const summaryList = summary?.querySelector('ul');
  const failure = form.querySelector<HTMLElement>('[data-form-error]');
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]');
  const submitLabel = form.querySelector<HTMLElement>('[data-submit-label]');
  const success = form.parentElement?.querySelector<HTMLElement>('[data-form-success]');
  const honeypot = form.querySelector<HTMLInputElement>('[data-honeypot] input');

  const controls = Array.from(form.querySelectorAll<Control>('input, select, textarea')).filter(
    (el) => el.name && el.type !== 'hidden' && el.type !== 'radio' && !el.closest('[data-honeypot]'),
  );
  let attempted = false;

  const validate = (el: Control): string => {
    if (el instanceof HTMLInputElement && el.type === 'file' && el.files?.length) {
      const files = Array.from(el.files);
      if (files.reduce((sum, f) => sum + f.size, 0) > maxBytes) return d.msgFileSize ?? '';
      if (!files.every((f) => fileAccepted(f, el.accept))) return d.msgFileType ?? '';
    }
    if (el.validity.valid) return '';
    if (el.validity.valueMissing) {
      if (el instanceof HTMLInputElement && el.type === 'checkbox') return d.msgConsent ?? '';
      if (el instanceof HTMLSelectElement) return d.msgSelect ?? '';
      return d.msgRequired ?? '';
    }
    if (el.validity.typeMismatch && el.type === 'email') return d.msgEmail ?? '';
    if (el.validity.patternMismatch && el.type === 'tel') return d.msgTel ?? '';
    return el.validationMessage || (d.msgRequired ?? '');
  };

  const show = (el: Control, message: string) => {
    const error = document.getElementById(`${el.id}-error`);
    if (message) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
    if (error) {
      error.textContent = message;
      error.hidden = !message;
    }
  };

  for (const el of controls) {
    const revalidate = () => attempted && show(el, validate(el));
    el.addEventListener('change', revalidate);
    el.addEventListener('blur', revalidate);
    el.addEventListener('input', () => el.getAttribute('aria-invalid') === 'true' && show(el, validate(el)));
  }

  const setBusy = (busy: boolean) => {
    if (!submit) return;
    submit.disabled = busy;
    form.setAttribute('aria-busy', String(busy));
    if (submitLabel) {
      submitLabel.dataset.original ??= submitLabel.textContent ?? '';
      submitLabel.textContent = busy ? (d.msgSending ?? '') : submitLabel.dataset.original;
    }
  };

  const showSuccess = () => {
    form.hidden = true;
    if (success) {
      success.hidden = false;
      success.focus();
      success.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    attempted = true;
    if (failure) failure.hidden = true;

    const errors: Array<{ el: Control; message: string }> = [];
    for (const el of controls) {
      const message = validate(el);
      show(el, message);
      if (message) errors.push({ el, message });
    }

    if (errors.length && summary && summaryList) {
      summaryList.replaceChildren(
        ...errors.map(({ el, message }) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = `#${el.id}`;
          a.className = 'underline';
          a.textContent = `${el.dataset.label ?? el.name}: ${message}`;
          a.addEventListener('click', (e) => {
            e.preventDefault();
            el.focus();
          });
          li.append(a);
          return li;
        }),
      );
      summary.hidden = false;
      summary.focus();
      return;
    }
    if (summary) summary.hidden = true;

    // Bots fill the hidden field: pretend success, send nothing.
    if (honeypot?.value) {
      showSuccess();
      return;
    }

    setBusy(true);
    try {
      const body = new FormData(form);
      // An empty file input still sends a nameless 0-byte part; drop it so only real files arrive.
      for (const [key, value] of Array.from(body.entries())) {
        if (value instanceof File && !value.name && !value.size) body.delete(key);
      }
      const netlify = d.provider === 'netlify';
      const response = await fetch(netlify ? '/' : (d.endpoint ?? form.action), {
        method: 'POST',
        body,
        headers: netlify ? undefined : { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      showSuccess();
    } catch {
      if (failure) {
        failure.hidden = false;
        failure.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    } finally {
      setBusy(false);
    }
  });
}

document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach(initForm);
