(function(){
  function parseCombo(str){
    if (!str || typeof str !== 'string') return null;
    const s = str.trim().toLowerCase();
    return {
      ctrl: /ctrl\+/.test(s),
      alt: /alt\+/.test(s),
      shift: /shift\+/.test(s),
      key: s.replace(/(ctrl\+|alt\+|shift\+)/g,'').trim()
    };
  }
  const defaults = {
    misReservas: 'ctrl+h',
    inicio: 'ctrl+i',
    vehiculos: 'ctrl+v'
  };
  const cfg = (window.appShortcuts || defaults);
  const combos = {
    misReservas: parseCombo(cfg.misReservas) || parseCombo(defaults.misReservas),
    inicio: parseCombo(cfg.inicio) || parseCombo(defaults.inicio),
    vehiculos: parseCombo(cfg.vehiculos) || parseCombo(defaults.vehiculos)
  };
  const role = (window.currentUserRole || '').toLowerCase();
  function match(evt, combo){
    if (!combo) return false;
    if (!!combo.ctrl !== !!evt.ctrlKey) return false;
    if (!!combo.alt !== !!evt.altKey) return false;
    if (!!combo.shift !== !!evt.shiftKey) return false;
    const key = (evt.key || '').toLowerCase();
    return key === combo.key;
  }
  function isTypingTarget(el){
    if (!el) return false;
    const tag = (el.tagName||'').toLowerCase();
    return tag === 'input' || tag === 'textarea' || el.isContentEditable;
  }
  window.addEventListener('keydown', function(e){
    if (isTypingTarget(document.activeElement)) return;
    //las resercas de los empleados
    if (role === 'empleado' && match(e, combos.misReservas)) {
      e.preventDefault();
      window.location.href = '/reservas';
      return;
    }
    //inicio redireccion
    if (match(e, combos.inicio)) {
      e.preventDefault();
      window.location.href = '/';
      return;
    }
    ///redireccion a vehiculos
    if (match(e, combos.vehiculos)) {
      e.preventDefault();
      window.location.href = '/vehiculos';
      return;
    }
  });
})();
