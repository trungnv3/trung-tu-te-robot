# Trung Tử Tế – Robot lau nhà

Website V1 dạng tĩnh, thiết kế đơn giản theo hướng chia sẻ thực tế về robot lau nhà.

## Chạy local

Mở PowerShell tại thư mục này:

```powershell
npx wrangler dev
```

Sau đó mở URL local Wrangler hiển thị.

## Trước khi public

1. Thay `YOUR_PHONE` trong `index.html` bằng số điện thoại thật.
2. Thay `YOUR_FACEBOOK_URL` bằng link Facebook/Fanpage.
3. Bổ sung ảnh/logo thật trong `assets/`.
4. Thay 3 bài mẫu bằng bài viết thực tế.

## Deploy Cloudflare

```powershell
npx wrangler deploy
```

Hoặc kết nối repository GitHub với Cloudflare để tự động deploy.
