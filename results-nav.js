
(function () {
  function updateNavigation() {
    document.querySelectorAll('[data-page="compare"]').forEach(function (item) {
      item.remove();
    });

    [
      { selector: '.sidebar .navbtn[data-page="home"]', id: 'results-desktop' },
      { selector: '.mobile-nav [data-page="home"]', id: 'results-mobile' }
    ].forEach(function (target) {
      var home = document.querySelector(target.selector);
      if (!home || document.getElementById(target.id)) return;

      var button = document.createElement('button');
      button.id = target.id;
      button.type = 'button';
      button.className = home.className;
      button.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M3 3v18h18M7 16l4-5 4 2 5-8"/>' +
        '</svg><span>Results</span>';

      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        window.location.assign('/results.html');
      });

      home.insertAdjacentElement('afterend', button);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavigation);
  } else {
    updateNavigation();
  }

  window.addEventListener('load', updateNavigation);
})();
