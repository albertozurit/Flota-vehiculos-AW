document.addEventListener('DOMContentLoaded', function () {
  var reservarModal = document.getElementById('reservarModal');
  if (!reservarModal) return;

  var bsModal = new bootstrap.Modal(reservarModal, {
    backdrop: 'static',
    keyboard: true
  });

  reservarModal.addEventListener('show.bs.modal', function (event) {
    var button = event.relatedTarget;
    var vehiculoId = button.getAttribute('data-id');
    var content = reservarModal.querySelector('#reservarModalContent');
    if (!content) return;

    content.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div><p class="mt-3 text-muted">Cargando formulario...</p></div>';

    $.ajax({
      url: '/reservas/nuevo/' + encodeURIComponent(vehiculoId),
      method: 'GET',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      timeout: 10000,
      success: function(html){
        setTimeout(function() {
          content.innerHTML = html;
        }, 100);
      },
      error: function(jqXHR){
        if (jqXHR.status === 401) {
          content.innerHTML = '<div class="alert alert-warning">Debes iniciar sesión para reservar</div>';
          setTimeout(function() {
            window.location.href = '/login';
          }, 2000);
          return;
        }
        if (jqXHR.status === 404) {
          content.innerHTML = '<div class="alert alert-danger">Vehículo no encontrado</div>';
          return;
        }
        var text = jqXHR.responseText || 'Error del servidor';
        content.innerHTML = '<div class="alert alert-danger">' + text + '</div>';
      }
    });
  });

  reservarModal.addEventListener('hidden.bs.modal', function () {
    var content = reservarModal.querySelector('#reservarModalContent');
    if (content) {
      content.innerHTML = '<div class="text-center p-4 text-muted">Cargando...</div>';
    }
  });
});
