fetch('http://localhost/bookcircle-api/user/verify-library.php', { method: 'POST' })
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);
