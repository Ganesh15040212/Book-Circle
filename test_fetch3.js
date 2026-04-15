fetch('http://localhost/bookcircle-api/profile/verify-library.php', { method: 'POST' })
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);
