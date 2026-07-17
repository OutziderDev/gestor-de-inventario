(() => {
  const HISTORIAL_KEY = 'bazar_historial';

  function formatFecha(iso) {
    const d = new Date(iso);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hora}:${min}`;
  }

  function render() {
    const lista = document.getElementById('lista-historial');
    const historial = JSON.parse(localStorage.getItem(HISTORIAL_KEY) || '[]');

    if (historial.length === 0) {
      lista.innerHTML =
        '<div class="empty-state"><div class="icon">&#128221;</div><p>No hay ventas registradas</p></div>';
      return;
    }

    lista.innerHTML = historial.map(item => {
      const precioFmt = (item.precio || 0).toLocaleString('es-PY');
      return `
      <div class="historial-item">
        <div class="historial-info">
          <div class="historial-name">${item.nombre}</div>
          <div class="historial-time">${formatFecha(item.fecha)} &middot; Gs. ${precioFmt}</div>
        </div>
        <div class="historial-cantidad">-${item.cantidad}</div>
      </div>`;
    }).join('');
  }

  render();
})();
