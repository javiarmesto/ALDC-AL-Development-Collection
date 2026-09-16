/* Progressive enhancement: all installation instructions remain readable without JS. */
(() => {
  'use strict';
  function init() {
    const root = document.querySelector('[data-aldc-start]');
    if (!root || root.dataset.ready) return;
    root.dataset.ready = 'true';
    const choices = [...root.querySelectorAll('input[name="aldc-surface"]')];
    const allowed = choices.map(input => input.value);
    const params = new URLSearchParams(location.search);
    const select = (value, updateUrl = false) => {
      if (!allowed.includes(value)) value = 'vscode';
      choices.forEach(input => { input.checked = input.value === value; });
      root.querySelectorAll('[data-aldc-panel]').forEach(panel => {
        panel.hidden = panel.dataset.aldcPanel !== value;
      });
      root.querySelector('[data-aldc-source]').hidden = value === 'vscode';
      if (updateUrl) {
        const url = new URL(location.href);
        url.searchParams.set('surface', value);
        history.replaceState(null, '', url);
      }
      const language = root.querySelector('[data-aldc-language]');
      const link = new URL(language.href);
      link.searchParams.set('surface', value);
      language.href = link.href;
    };
    select(params.get('surface'));
    choices.forEach(input => input.addEventListener('change', () => select(input.value, true)));
    root.querySelectorAll('[data-aldc-copy]').forEach(button => {
      button.hidden = false;
      button.addEventListener('click', async () => {
        const target = button.parentElement.querySelector('code');
        const es = root.dataset.language === 'es';
        const status = root.querySelector('[data-aldc-copy-status]');
        try {
          await navigator.clipboard.writeText(target.textContent);
          status.textContent = es ? 'Copiado. Revisa el contenido antes de ejecutarlo.' : 'Copied. Review the content before running it.';
        } catch {
          const range = document.createRange();
          range.selectNodeContents(target);
          const selection = window.getSelection();
          selection.removeAllRanges(); selection.addRange(range);
          status.textContent = es ? 'Copia no disponible. Texto seleccionado: utiliza Ctrl+C o Cmd+C.' : 'Clipboard unavailable. Text selected: use Ctrl+C or Cmd+C.';
        }
      });
    });
  }
  if (typeof document$ !== 'undefined') document$.subscribe(init);
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
