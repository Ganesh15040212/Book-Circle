fetch('http://localhost/bookcircle-api/auth/login.php', { method: 'POST' })
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);
