document.addEventListener('DOMContentLoaded', function () {
  var reservarModal = document.getElementById('reservarModal');
  if (!reservarModal) return;

  reservarModal.addEventListener('show.bs.modal', function (event) {
    var button = event.relatedTarget;
    var vehiculoId = button.getAttribute('data-id');
    var content = reservarModal.querySelector('#reservarModalContent');
    if (!content) return;

    content.innerHTML = '<div class="text-center p-3">Cargando...</div>';
//Esto es una petición AJAX usando jQuery
    $.ajax({
      url: '/reservas/nuevo/' + encodeURIComponent(vehiculoId), //Ajusta la URL según tu ruta
      method: 'GET', //Usamos GET para obtener el formulario
      headers: { 'X-Requested-With': 'XMLHttpRequest' }, //indica que es una petición AJAX
      success: function(html){ //Si la petición es exitosa
        content.innerHTML = html; //Insertamos el HTML recibido en el modal
      },
      error: function(jqXHR){ //Manejo de errores
        if (jqXHR.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (jqXHR.status === 404) {
          content.innerHTML = '<div class="text-danger p-3">Vehículo no encontrado</div>';
          return;
        }
        var text = jqXHR.responseText || 'Error del servidor';
        content.innerHTML = '<div class="text-danger p-3">' + text + '</div>';
      }
    });
  });
});
