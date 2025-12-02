document.addEventListener('DOMContentLoaded', function () {
  var reservarModal = document.getElementById('reservarModal');
  if (!reservarModal) return;

  reservarModal.addEventListener('show.bs.modal', function (event) {
    var button = event.relatedTarget; // Button that triggered the modal
    var vehiculoId = button.getAttribute('data-id');
    var content = reservarModal.querySelector('#reservarModalContent');
    if (!content) return;

    content.innerHTML = '<div class="text-center p-3">Cargando...</div>';

    fetch('/reservas/nuevo/' + encodeURIComponent(vehiculoId), {
      credentials: 'same-origin', // incluir cookie de sesión
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
      .then(function (resp) {
        // Obtener el texto de la respuesta (útil para mensajes de error del servidor)
        return resp.text().then(function (text) {
          if (resp.status === 401) {
            window.location.href = '/login';
            throw new Error('No autorizado');
          }
          if (resp.status === 404) {
            throw new Error(text || 'Vehículo no encontrado');
          }
          if (!resp.ok) {
            throw new Error(text || 'Error del servidor');
          }
          return text; // HTML válido
        });
      })
      .then(function (html) {
        content.innerHTML = html;
      })
      .catch(function (err) {
        console.error('Error cargando formulario de reserva:', err);
        var message = err.message || 'Error al cargar el formulario. Inténtalo de nuevo.';
        content.innerHTML = '<div class="text-danger p-3">' + message + '</div>';
      });
  });
});
