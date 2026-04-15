fetch('http://localhost/bookcircle-api/migrate_verify.php')
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);
