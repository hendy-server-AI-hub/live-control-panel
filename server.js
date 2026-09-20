const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API tiếp nhận thông số cấu hình tăng mắt
app.post('/api/start-boost', (req, res) => {
    const { link, server, views, time } = req.body;

    console.log(`Đang thiết lập tiến trình cho link: ${link}`);
    console.log(`- Server: ${server === 'vn' ? 'Việt Nam' : 'Quốc tế'}`);
    console.log(`- Số lượng mắt: ${views}`);
    console.log(`- Thời gian duy trì: ${time} phút`);

    runBotWorker(link, server, views, time);

    res.json({ status: 'success', message: 'Tiến trình đã được đưa vào hàng đợi chạy ngầm.' });
});

function runBotWorker(link, server, views, time) {
    let activeMinutes = 0;
    const interval = setInterval(() => {
        activeMinutes++;
        console.log(`Đang duy trì ${views} mắt trên server [${server}]. Thời gian chạy: ${activeMinutes}/${time} phút`);

        if (activeMinutes >= time) {
            clearInterval(interval);
            console.log('Đã hoàn thành thời gian duy trì, hệ thống ngắt kết nối.');
        }
    }, 60000);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});