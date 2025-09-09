## 📦 Cài đặt

### Yêu cầu
- Python **3.9+**
- Node.js **18+**
- npm / yarn / pnpm
- (Tùy chọn) `ngrok` hoặc `cloudflared` để truy cập từ bên ngoài

---

## 🖥️ Khởi chạy hệ thống

### Bước 1. Khởi tạo máy chủ LLM
Chạy API server bằng Uvicorn:
```bash
cd api
uvicorn main:app --reload --port 8000
````

### Bước 2. Khởi tạo Client-side CMS

Khởi chạy ứng dụng Next.js:

```bash
cd file-management-app
npm run dev
```

⚡ **Lưu ý:** Bước 1 và Bước 2 là **hai tiến trình độc lập**, cần chạy song song để hệ thống hoạt động đầy đủ.

### Bước 3. Truy cập hệ thống

Sau khi khởi chạy thành công, bạn có thể truy cập CMS tại địa chỉ:

👉 [http://127.0.0.1:3000](http://127.0.0.1:3000)

### Bước 4. Trỏ ra bên ngoài (tùy chọn)

Để hệ thống có thể truy cập từ bên ngoài, bạn có thể sử dụng:

* **ngrok**:

  ```bash
  ngrok http 3000
  ngrok http 8000
  ```

* **cloudflared**:

  ```bash
  cloudflared tunnel --url http://127.0.0.1:3000
  cloudflared tunnel --url http://127.0.0.1:8000
  ```

---


## 📂 Cấu trúc thư mục

```bash
.
├── api/                  # API server (FastAPI)
│   ├── main.py           # Điểm khởi chạy FastAPI
│   └── ...
├── file-management-app/  # Ứng dụng CMS (Next.js)
│   ├── package.json
│   └── ...
└── README.md
```

---

## ✨ Ghi chú

* API mặc định chạy trên cổng **8000**
* CMS chạy trên cổng **3000**
* Đảm bảo cả 2 tiến trình luôn hoạt động song song
* Khi deploy production, nên dùng **PM2, Docker hoặc systemd** để duy trì tiến trình

---

## 📜 Giấy phép

Dự án này phát hành theo giấy phép **MIT License**.

