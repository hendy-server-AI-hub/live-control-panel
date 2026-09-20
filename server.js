const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Lưu trữ danh sách các tiến trình đang chạy (để quản lý)
let activeTasks = {};

// API tiếp nhận thông số cấu hình tăng mắt
app.post('/api/start-boost', (req, res) => {
    const { link, server, views, time } = req.body;

    if (!link) {
        return res.status(400).json({ status: 'error', message: 'Thiếu đường dẫn livestream!' });
    }

    const taskId = Date.now();
    console.log(`[Task #${taskId}] Bắt đầu khởi tạo tiến trình cho link: ${link}`);
    console.log(`- Cấu hình Server: ${server === 'vn' ? 'Mắt Việt Nam (Nội địa)' : 'Mắt Ngoại (Quốc tế)'}`);
    console.log(`- Số lượng yêu cầu: ${views} mắt`);
    console.log(`- Thời gian duy trì: ${time} phút`);

    // Khởi chạy tiến trình xử lý ngầm
    runAdvancedWorker(taskId, link, server, parseInt(views), parseInt(time));

    res.json({ 
        status: 'success', 
        message: 'Tiến trình đã được khởi tạo và đưa vào hệ thống chạy ngầm thành công!',
        taskId: taskId
    });
});

function runAdvancedWorker(taskId, link, server, views, time) {
    let elapsedMinutes = 0;

    // Lưu trạng thái task
    activeTasks[taskId] = { link, server, views, time, status: 'Running' };

    const workInterval = setInterval(() => {
        elapsedMinutes++;
        console.log(`[Task #${taskId}] Đang duy trì ${views} mắt [Server: ${server}] | Thời gian: ${elapsedMinutes}/${time} phút`);

        // NƠI TÍCH HỢP MÃ NGUỒN XỬ LÝ THỰC TẾ:
        // Tại đây, bạn có thể gọi các hàm kết nối Socket, Puppeteer hoặc Pool Proxy 
        // để tương tác trực tiếp với luồng mạng của nền tảng phát trực tiếp.

        if (elapsedMinutes >= time) {
            clearInterval(workInterval);
            activeTasks[taskId].status = 'Completed';
            console.log(`[Task #${taskId}] Đã hoàn thành thời gian chạy. Đã đóng toàn bộ kết nối.`);
        }
    }, 60000); // Chạy định kỳ mỗi 1 phút
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Hệ thống Control Panel đang hoạt động tại cổng ${PORT}`);
});
