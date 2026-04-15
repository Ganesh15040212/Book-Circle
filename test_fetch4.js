fetch('http://localhost/bookcircle-api/test.php', { method: 'POST' })
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);
