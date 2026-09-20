const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/start-boost', async (req, res) => {
    const { link, server, views, time } = req.body;

    if (!link) {
        return res.status(400).json({ status: 'error', message: 'Thiếu link livestream!' });
    }

    const parsedViews = parseInt(views, 10) || 1;
    const parsedTime = parseInt(time, 10) || 5;

    console.log(`[Worker] Bắt đầu mở ${parsedViews} luồng truy cập vào: ${link}`);

    // Phản hồi ngay lập tức về giao diện để tránh bị treo request
    res.json({ status: 'success', message: 'Đã kích hoạt hệ thống luồng ẩn thành công!' });

    // Chạy tiến trình ngầm mở trình duyệt ảo
    runBrowserBots(link, parsedViews, parsedTime);
});

async function runBrowserBots(targetLink, totalViews, durationMinutes) {
    try {
        // Giới hạn số lượng mở đồng thời trên cloud để tránh tràn RAM (ví dụ tối đa 3-5 luồng cho gói miễn phí)
        const limitThreads = Math.min(totalViews, 3); 

        for (let i = 0; i < limitThreads; i++) {
            setTimeout(async () => {
                console.log(`[Bot #${i+1}] Đang khởi động trình duyệt ẩn...`);
                
                const browser = await puppeteer.launch({
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                });

                const page = await browser.newPage();
                
                // Giả lập giao diện thiết bị di động hoặc máy tính
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
                
                try {
                    console.log(`[Bot #${i+1}] Đang truy cập vào phòng live: ${targetLink}`);
                    await page.goto(targetLink, { waitUntil: 'networkidle2', timeout: 60000 });

                    // Duy trì kết nối trong khoảng thời gian cấu hình
                    console.log(`[Bot #${i+1}] Đã vào phòng live thành công. Giữ kết nối trong ${durationMinutes} phút...`);
                    await new Promise(resolve => setTimeout(resolve, durationMinutes * 60000));

                } catch (err) {
                    console.error(`[Bot #${i+1}] Lỗi kết nối trang:`, err.message);
                } finally {
                    await browser.close();
                    console.log(`[Bot #${i+1}] Đã đóng trình duyệt.`);
                }
            }, i * 3000); // Mỗi bot cách nhau 3 giây để giảm tải
        }
    } catch (error) {
        console.error('Lỗi hệ thống khởi chạy bot:', error);
    }
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});
