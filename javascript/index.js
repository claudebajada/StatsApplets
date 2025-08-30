document.querySelectorAll('.nav-bar button').forEach(button => {
  button.addEventListener('click', () => {
    const src = button.getAttribute('data-src');
    document.getElementById('appletFrame').src = src;
  });
});
