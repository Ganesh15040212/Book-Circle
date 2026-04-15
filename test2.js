const test = async () => {
    try {
        const r1 = await fetch('http://localhost/bookcircle-api/requests/index.php');
        console.log('INDEX.PHP STATUS:', r1.status);
        console.log('INDEX.PHP TEXT:', await r1.text());

        const r2 = await fetch('http://localhost/bookcircle-api/requests/extend.php', { method: 'POST' });
        console.log('EXTEND.PHP STATUS:', r2.status);
        const t2 = await r2.text();
        console.log('EXTEND.PHP TEXT:', t2.substring(0, 100));
    } catch(e) {
        console.error(e);
    }
};
test();
