(() => {
  const STORAGE_KEY = 'bazar_inventario';
  const HISTORIAL_KEY = 'bazar_historial';

  let inventario = [];

  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  function guardarInventario() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventario));
  }

  function cargarInventario() {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) {
      inventario = JSON.parse(guardado);
      render();
      return;
    }

    fetch('./data/inventario.json')
      .then(r => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(data => {
        inventario = data;
        guardarInventario();
        render();
      })
      .catch(() => {
        inventario = [];
        render();
      });
  }

  function registrarHistorial(item, cantidad) {
    const historial = JSON.parse(localStorage.getItem(HISTORIAL_KEY) || '[]');
    historial.unshift({
      id: item.id,
      nombre: item.nombre,
      precio: item.precio,
      cantidad: cantidad,
      fecha: new Date().toISOString()
    });
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial));
  }

  function despachar(id) {
    const item = inventario.find(i => i.id === id);
    if (!item || item.cantidad <= 0) return;

    item.cantidad--;
    guardarInventario();
    registrarHistorial(item, 1);
    showToast(`Vendido: ${item.nombre}`);
    render();
  }

  function agregarItem(nombre, precio, cantidad) {
    const maxId = inventario.reduce((max, i) => Math.max(max, i.id), 0);
    inventario.push({
      id: maxId + 1,
      nombre,
      precio: Number(precio),
      cantidad: Number(cantidad)
    });
    guardarInventario();
    showToast(`Agregado: ${nombre}`);
    render();
  }

  function render() {
    const lista = document.getElementById('lista-inventario');
    const disponibles = inventario.filter(i => i.cantidad > 0);
    const agotados = inventario.filter(i => i.cantidad <= 0);
    const ordenados = [...disponibles, ...agotados];

    if (ordenados.length === 0) {
      lista.innerHTML =
        '<div class="empty-state"><div class="icon">&#128230;</div><p>Sin articulos. Agrega uno nuevo.</p></div>';
      document.getElementById('stat-total').textContent = 0;
      document.getElementById('stat-stock').textContent = 0;
      document.getElementById('stat-despachado').textContent = 0;
      return;
    }

    lista.innerHTML = ordenados.map(item => {
      const agotado = item.cantidad <= 0;
      const precioFmt = item.precio.toLocaleString('es-PY');
      return `
        <div class="item-card ${agotado ? 'agotado' : ''}">
          <div class="item-info">
            <div class="item-name">${item.nombre}</div>
            <div class="item-price">Gs. ${precioFmt}</div>
          </div>
          <div class="item-right">
            <div class="item-cantidad">${item.cantidad}</div>
            <button class="btn-despachar"
              ${agotado ? 'disabled' : ''}
              onclick="window.__despachar(${item.id})">
              ${agotado ? 'Agotado' : 'Despachar'}
            </button>
          </div>
        </div>`;
    }).join('');

    const total = inventario.reduce((s, i) => s + i.cantidad, 0);
    const vendidos = JSON.parse(localStorage.getItem(HISTORIAL_KEY) || '[]')
      .reduce((s, i) => s + i.cantidad, 0);

    document.getElementById('stat-total').textContent = inventario.length;
    document.getElementById('stat-stock').textContent = total;
    document.getElementById('stat-despachado').textContent = vendidos;
  }

  function initModal() {
    const btn = document.getElementById('btn-abrir-modal');
    const modal = document.getElementById('modal-overlay');
    const form = document.getElementById('form-agregar');
    const btnCancelar = document.getElementById('btn-cancelar');

    btn.addEventListener('click', () => modal.classList.add('active'));
    btnCancelar.addEventListener('click', () => {
      modal.classList.remove('active');
      form.reset();
    });
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.classList.remove('active');
        form.reset();
      }
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const nombre = form.nombre.value.trim();
      const precio = form.precio.value;
      const cantidad = form.cantidad.value;
      if (!nombre || !precio || !cantidad) return;
      agregarItem(nombre, precio, cantidad);
      form.reset();
      modal.classList.remove('active');
    });
  }

  window.__despachar = despachar;
  cargarInventario();
  initModal();
})();
