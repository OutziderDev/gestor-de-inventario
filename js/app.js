(() => {
  const STORAGE_KEY = 'bazar_inventario';
  const HISTORIAL_KEY = 'bazar_historial';

  let inventario = [];
  let filtro = '';
  let despacharPendiente = null;
  let metodoPago = 'cash';

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

  function registrarHistorial(item, cantidad, metodo) {
    const historial = JSON.parse(localStorage.getItem(HISTORIAL_KEY) || '[]');
    historial.unshift({
      id: item.id,
      nombre: item.nombre,
      precio: item.precio,
      cantidad: cantidad,
      metodo: metodo || 'cash',
      fecha: new Date().toISOString()
    });
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial));
  }

  function despachar(id, metodo) {
    const item = inventario.find(i => i.id === id);
    if (!item || item.cantidad <= 0) return;

    item.cantidad--;
    guardarInventario();
    registrarHistorial(item, 1, metodo);
    showToast(`Vendido: ${item.nombre} (${metodo})`);
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
    let items = inventario;
    if (filtro) {
      const q = filtro.toLowerCase();
      items = inventario.filter(i => i.nombre.toLowerCase().includes(q));
    }
    const disponibles = items.filter(i => i.cantidad > 0);
    const agotados = items.filter(i => i.cantidad <= 0);
    const ordenados = [...disponibles, ...agotados];

    if (ordenados.length === 0) {
      const msg = filtro
        ? 'No se encontraron articulos.'
        : 'Sin articulos. Agrega uno nuevo.';
      lista.innerHTML =
        `<div class="empty-state"><div class="icon">&#128269;</div><p>${msg}</p></div>`;
      document.getElementById('stat-total').textContent = 0;
      document.getElementById('stat-stock').textContent = 0;
      document.getElementById('stat-despachado').textContent = 0;
      return;
    }

    lista.innerHTML = ordenados.map(item => {
      const agotado = item.cantidad <= 0;
      const precioFmt = item.precio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `
        <div class="item-card ${agotado ? 'agotado' : ''}">
          <div class="item-info">
            <div class="item-name">${item.nombre}</div>
            <div class="item-price">$ ${precioFmt}</div>
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

  function initReset() {
    const btnReset = document.getElementById('btn-reset');
    const overlay = document.getElementById('reset-overlay');
    const btnCancelar = document.getElementById('btn-cancelar-reset');
    const btnConfirmar = document.getElementById('btn-confirmar-reset');

    btnReset.addEventListener('click', () => overlay.classList.add('active'));
    btnCancelar.addEventListener('click', () => overlay.classList.remove('active'));
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('active');
    });

    btnConfirmar.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(HISTORIAL_KEY);
      inventario = [];
      overlay.classList.remove('active');
      showToast('Inventario y historial limpiados');
      render();
    });
  }

  function initDespacharConfirm() {
    const overlay = document.getElementById('despachar-overlay');
    const msg = document.getElementById('despachar-msg');
    const btnCancelar = document.getElementById('btn-cancelar-despachar');
    const btnConfirmar = document.getElementById('btn-confirmar-despachar');
    const btnCash = document.getElementById('btn-metodo-cash');
    const btnYappy = document.getElementById('btn-metodo-yappy');

    function seleccionarMetodo(metodo) {
      metodoPago = metodo;
      btnCash.classList.toggle('selected', metodo === 'cash');
      btnYappy.classList.toggle('selected', metodo === 'yappy');
    }

    btnCash.addEventListener('click', () => seleccionarMetodo('cash'));
    btnYappy.addEventListener('click', () => seleccionarMetodo('yappy'));

    window.__despachar = (id) => {
      const item = inventario.find(i => i.id === id);
      if (!item || item.cantidad <= 0) return;
      despacharPendiente = id;
      seleccionarMetodo('cash');
      msg.textContent = `¿Despachar "${item.nombre}"? Quedarán ${item.cantidad - 1} en stock.`;
      overlay.classList.add('active');
    };

    btnCancelar.addEventListener('click', () => {
      overlay.classList.remove('active');
      despacharPendiente = null;
    });

    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        despacharPendiente = null;
      }
    });

    btnConfirmar.addEventListener('click', () => {
      if (despacharPendiente !== null) {
        despachar(despacharPendiente, metodoPago);
        despacharPendiente = null;
      }
      overlay.classList.remove('active');
    });
  }

  window.__despachar = despachar;
  cargarInventario();
  initModal();
  initReset();
  initDespacharConfirm();

  document.getElementById('input-buscar').addEventListener('input', e => {
    filtro = e.target.value.trim();
    render();
  });

  let deferredPrompt;
  const btnInstall = document.getElementById('btn-install');

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    btnInstall.style.display = 'inline-block';
  });

  btnInstall.addEventListener('click', () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choice => {
      if (choice.outcome === 'accepted') {
        btnInstall.style.display = 'none';
        showToast('App instalada correctamente');
      }
      deferredPrompt = null;
    });
  });

  window.addEventListener('appinstalled', () => {
    btnInstall.style.display = 'none';
    deferredPrompt = null;
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
})();
