(function () {
  function openLightbox(img) {
    var overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.innerHTML = '&times;';
    overlay.appendChild(closeBtn);

    var clone = img.cloneNode(true);
    overlay.appendChild(clone);

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    function close() {
      overlay.remove();
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    function escHandler(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', escHandler);
      }
    }
    document.addEventListener('keydown', escHandler);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var imgs = document.querySelectorAll('main img');
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].style.cursor = 'zoom-in';
      imgs[i].addEventListener('click', function () {
        openLightbox(this);
      });
    }
  });
})();
