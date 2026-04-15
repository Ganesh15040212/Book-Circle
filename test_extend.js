const test = async () => {
    try {
        const res = await fetch("http://localhost/bookcircle-api/test.php", {
            method: "GET"
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response Text:");
        console.log(text);
    } catch(e) {
        console.error(e);
    }
};
test();
