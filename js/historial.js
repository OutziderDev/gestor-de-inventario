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

  function formatDinero(n) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function render() {
    const lista = document.getElementById('lista-historial');
    const historial = JSON.parse(localStorage.getItem(HISTORIAL_KEY) || '[]');
    const resumen = document.getElementById('historial-resumen');

    if (historial.length === 0) {
      lista.innerHTML =
        '<div class="empty-state"><div class="icon">&#128221;</div><p>No hay ventas registradas</p></div>';
      resumen.classList.add('hidden');
      return;
    }

    let total = 0;
    let totalCash = 0;
    let totalYappy = 0;
    lista.innerHTML = historial.map(item => {
      const subtotal = (item.precio || 0) * (item.cantidad || 1);
      total += subtotal;
      if (item.metodo === 'yappy') totalYappy += subtotal;
      else totalCash += subtotal;
      const precioFmt = formatDinero(item.precio || 0);
      const metodo = item.metodo || 'cash';
      const metodoLabel = metodo === 'yappy' ? 'Yappy' : 'Cash';
      return `
      <div class="historial-item">
        <div class="historial-info">
          <div class="historial-name">${item.nombre}</div>
          <div class="historial-time">${formatFecha(item.fecha)} &middot; $ ${precioFmt}</div>
        </div>
        <div class="historial-right">
          <span class="historial-metodo metodo-${metodo}">${metodoLabel}</span>
          <div class="historial-cantidad">-${item.cantidad}</div>
        </div>
      </div>`;
    }).join('');

    document.getElementById('historial-total').textContent = `$ ${formatDinero(total)}`;
    document.getElementById('historial-cantidad-total').textContent = historial.reduce((s, i) => s + (i.cantidad || 0), 0);
    document.getElementById('historial-total-cash').textContent = `$ ${formatDinero(totalCash)}`;
    document.getElementById('historial-total-yappy').textContent = `$ ${formatDinero(totalYappy)}`;
    resumen.classList.remove('hidden');
  }

  render();
})();
