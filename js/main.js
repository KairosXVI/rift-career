/* Arranque del juego */
(function (RC) {
  async function start() {
    RC.bindEvents();
    try {
      await RC.D.load();
    } catch (e) {
      document.getElementById('app').innerHTML = '<div class="loading">No se pudieron cargar los datos del juego.</div>';
      return;
    }
    RC.render();
  }
  start();
})(window.RC);
