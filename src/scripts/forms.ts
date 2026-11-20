// Shared behaviour for every <form data-form>: inline validation, entries kept on error,
// POST to the form's action, success panel on completion.
// If the server answers with JSON { redirect }, the browser goes there (used for the payment hand-off).
// A form can set data-fail="…" to replace the default error message.
const messages: Record<string, string> = {
  valueMissing: 'Please fill in this field.',
  typeMismatch: 'Please enter a valid email address.',
  rangeUnderflow: 'Please enter an amount greater than zero.',
  badInput: 'Please enter a number.',
  stepMismatch: 'Please enter an amount with no more than two decimal places.',
};

function fieldOf(el: Element) {
  return el.closest<HTMLElement>('.field');
}

function setError(input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  const field = fieldOf(input);
  if (!field) return;
  const err = field.querySelector<HTMLElement>('.field-error');
  if (input.validity.valid) {
    field.classList.remove('has-error');
    input.removeAttribute('aria-invalid');
    return;
  }
  const v = input.validity;
  const key = v.valueMissing ? 'valueMissing' : v.badInput ? 'badInput' : v.typeMismatch ? 'typeMismatch' : v.rangeUnderflow ? 'rangeUnderflow' : v.stepMismatch ? 'stepMismatch' : 'valueMissing';
  const custom = key === 'valueMissing' ? input.dataset.error : undefined;
  if (err) err.textContent = custom || messages[key];
  field.classList.add('has-error');
  input.setAttribute('aria-invalid', 'true');
}

document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach((form) => {
  form.noValidate = true;
  const wrap = form.closest<HTMLElement>('[data-form-wrap]') ?? form;
  const alert = form.querySelector<HTMLElement>('.form-alert');
  const submit = form.querySelector<HTMLButtonElement>('[type=submit]');
  const controls = () => Array.from(form.querySelectorAll<HTMLInputElement>('input, select, textarea')).filter((c) => c.willValidate);

  controls().forEach((c) => c.addEventListener('input', () => { if (fieldOf(c)?.classList.contains('has-error')) setError(c); }));
  controls().forEach((c) => c.addEventListener('change', () => { if (fieldOf(c)?.classList.contains('has-error')) setError(c); }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alert?.classList.remove('is-error');
    const invalid = controls().filter((c) => !c.validity.valid);
    controls().forEach(setError);
    if (invalid.length) { invalid[0].focus(); return; }

    const label = submit?.innerHTML;
    if (submit) { submit.disabled = true; submit.textContent = 'Sending…'; }
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      const data = (res.headers.get('content-type') ?? '').includes('json') ? await res.json().catch(() => ({})) : {};
      if (typeof data.redirect === 'string') { location.assign(data.redirect); return; }
      wrap.classList.add('is-sent');
      wrap.querySelector<HTMLElement>('.form-success')?.focus();
    } catch {
      if (alert) {
        alert.textContent = form.dataset.fail ?? 'Sorry, your details could not be sent just now. Please try again, or contact the church directly.';
        alert.classList.add('is-error');
      }
    } finally {
      if (submit) { submit.disabled = false; submit.innerHTML = label ?? 'Send'; }
    }
  });
});
