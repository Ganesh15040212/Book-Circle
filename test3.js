const test = async () => {
    try {
        const r1 = await fetch('http://localhost/bookcircle-api/requests/update.php', { method: 'PUT' });
        console.log('UPDATE STATUS:', r1.status);
        console.log('UPDATE TEXT:', await r1.text());
    } catch(e) {
        console.error(e);
    }
};
test();
