const express = require('express');
const path = require('path');
const app = express();

// Cấu hình Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Bộ nhớ tạm lưu trữ danh sách các tiến trình đang hoạt động
let activeBoostTasks = {};

/**
 * API Endpoint: Nhận thông tin cấu hình từ giao diện Control Panel
 */
app.post('/api/start-boost', (req, res) => {
    const { link, server, views, time } = req.body;

    // Kiểm tra tính hợp lệ của dữ liệu đầu vào
    if (!link) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'Vui lòng cung cấp đường dẫn Livestream hợp lệ!' 
        });
    }

    // Tạo mã định danh cho tiến trình (Task ID)
    const taskId = Date.now();
    const parsedViews = parseInt(views, 10) || 0;
    const parsedTime = parseInt(time, 10) || 0;

    // Ghi nhận log hệ thống (hiển thị trên Deploy Logs của Railway)
    console.log(`[${new Date().toISOString()}] [Task #${taskId}] Khởi tạo tiến trình mới`);
    console.log(`- Link Livestream: ${link}`);
    console.log(`- Gói Server chọn: ${server === 'vn' ? 'Mắt Việt Nam (Nội địa)' : 'Mắt Ngoại (Quốc tế)'}`);
    console.log(`- Số lượng mắt yêu cầu: ${parsedViews}`);
    console.log(`- Thời gian duy trì: ${parsedTime} phút`);

    // Lưu trạng thái task vào bộ nhớ
    activeBoostTasks[taskId] = {
        link,
        server,
        views: parsedViews,
        time: parsedTime,
        status: 'Running',
        createdAt: new Date()
    };

    // Kích hoạt tiến trình chạy ngầm xử lý
    executeBoostProcess(taskId, link, server, parsedViews, parsedTime);

    // Phản hồi về cho giao diện (Frontend)
    return res.status(200).json({ 
        status: 'success', 
        message: 'Đã khởi tạo tiến trình hệ thống thành công!',
        taskId: taskId
    });
});

/**
 * Hàm xử lý tiến trình ngầm (Worker Process)
 */
function executeBoostProcess(taskId, link, server, views, time) {
    let currentMinute = 0;

    const intervalTimer = setInterval(() => {
        currentMinute++;
        
        console.log(`[Task #${taskId}] Đang duy trì [${views} mắt] qua server [${server.toUpperCase()}] - Phút thứ ${currentMinute}/${time}`);

        // =========================================================================
        // KHU VỰC TÍCH HỢP MÃ NGUỒN MỞ RỘNG (NẾU CẦN KẾT NỐI THỰC TẾ):
        // Tại đây, các lập trình viên thường cấu hình các worker hoặc gọi đến Pool Proxy 
        // để giả lập các gói tin yêu cầu (HTTP/WebSocket Request) kết nối vào phòng live.
        // =========================================================================

        // Kiểm tra điều kiện kết thúc thời gian duy trì
        if (currentMinute >= time) {
            clearInterval(intervalTimer);
            if (activeBoostTasks[taskId]) {
                activeBoostTasks[taskId].status = 'Completed';
            }
            console.log(`[Task #${taskId}] Đã hoàn thành thời gian chạy. Đã đóng toàn bộ phiên kết nối.`);
        }
    }, 60000); // Thực hiện định kỳ mỗi 60 giây (1 phút)
}

/**
 * API kiểm tra trạng thái các tiến trình đang chạy (Tuỳ chọn mở rộng)
 */
app.get('/api/tasks-status', (req, res) => {
    res.json({
        status: 'success',
        activeTasks
    });
});

// Cấu hình cổng chạy ứng dụng (Ưu tiên lấy cổng từ môi trường đám mây như Railway, mặc định là 8080 hoặc 3000)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Hệ thống Control Panel đang vận hành ổn định tại cổng ${PORT}`);
});
