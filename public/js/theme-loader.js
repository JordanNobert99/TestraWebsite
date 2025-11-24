(function () {
    try {
        var stored = localStorage.getItem('testra-theme');
        if (stored === 'dark' || stored === 'light') {
            document.documentElement.setAttribute('data-theme', stored);
            return;
        }
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    } catch (e) { }
})();