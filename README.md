# NƠI LƯU GIỮ THANH XUÂN A5

Một website lưu bút cuối cấp, thiết kế responsive cho máy tính và điện thoại. Frontend dùng HTML/CSS/JavaScript thuần; backend dùng **Supabase Auth + PostgreSQL + Storage + Row Level Security (RLS)**. Không cần chạy một máy chủ Node riêng để vận hành bản này.

> **Lưu ý quan trọng:** ZIP đã có frontend, cấu trúc dữ liệu, chính sách bảo mật và hướng dẫn triển khai. Đăng nhập Google/Facebook không thể hoạt động chỉ bằng cách mở `index.html`: cần một Supabase project và cấu hình OAuth riêng do chủ website quản lý. Không có cách an toàn để đóng gói sẵn Client Secret vào ZIP công khai.

## Có sẵn những gì?

- Trang giới thiệu / đăng nhập với Google và Facebook.
- Hồ sơ thành viên: tên hiển thị, biệt danh, giới thiệu ngắn, ảnh đại diện tải từ điện thoại hoặc máy tính.
- Trang chủ, album kỷ niệm, danh sách thành viên và hồ sơ cá nhân.
- Đăng ảnh riêng với mục tải ảnh; đăng video riêng với mục tải video.
- Lưu thời gian do cơ sở dữ liệu ghi (`created_at`, múi giờ đầy đủ), hiển thị đến giây; rê chuột vào thời gian để xem timestamp ISO đầy đủ.
- Chú thích dưới ảnh/video, tùy chỉnh màu chữ và font.
- Reaction 🩷 😂 🥹 ✨ 🫶; mở danh sách để xem ai đã thả từng cảm xúc.
- Trình crop ảnh trước khi upload: chọn tỉ lệ 1:1, 4:3, 16:9 hoặc theo ảnh gốc; kéo ảnh để căn khung và phóng to.
- Trình cắt video trước khi upload: chọn điểm bắt đầu/kết thúc; đoạn cắt được xuất thành tệp mới trong trình duyệt, còn tệp gốc được giữ nếu hủy. Do dùng MediaRecorder, việc xuất diễn ra theo thời gian thực và có thể mã hóa lại; dùng Chrome/Edge mới nhất để tương thích tốt hơn.
- Nút **Tải video về máy** hiện trên mọi bài video cho thành viên có quyền xem bài đó. Video vẫn dùng URL ký hạn của Storage, không mở bucket công khai. Nếu trình duyệt chặn tải blob cross-origin, nút sẽ mở video để người xem lưu từ trình phát.
- Tìm kiếm nhanh; sắp xếp mới nhất/cũ nhất; lọc ảnh, video và bài của mình.
- Modal, thông báo, animation, trạng thái rỗng, giao diện co giãn cho màn hình nhỏ và hỗ trợ `prefers-reduced-motion`.
- **Phân quyền tại backend:** người dùng chỉ được sửa/xóa hàng `media_items` của chính mình; tệp Storage phải nằm trong thư mục mang UID của người đăng. Người xem khác không thể chiếm quyền chỉ bằng cách thay HTML trong trình duyệt.

## A. Tạo backend Supabase

1. Vào [Supabase](https://supabase.com/) và tạo project mới. Ghi lại mật khẩu database ở nơi riêng tư.
2. Mở **SQL Editor** trong Dashboard, tạo query mới, sao chép toàn bộ nội dung `supabase/schema.sql` vào rồi chạy. Script tạo các bảng `profiles`, `media_items`, `reactions`, trigger tạo hồ sơ khi thành viên đăng nhập lần đầu, các policy RLS và hai bucket Storage riêng tư.
3. Vào **Project Settings → API** (tên mục có thể thay đổi theo giao diện Dashboard). Sao chép **Project URL** và **publishable key/anon key**. Chỉ dùng key công khai dành cho trình duyệt.
4. Mở `config.js` và thay các placeholder:

   ```js
   window.A5_CONFIG = {
     SUPABASE_URL: 'https://YOUR_PROJECT_REF.supabase.co',
     SUPABASE_ANON_KEY: 'YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY'
   };
   ```

   Không đưa `service_role` key, database password, Google Client Secret hoặc Facebook App Secret vào `config.js` hay bất kỳ file frontend nào.

## B. Bật đăng nhập Google

1. Tạo OAuth client loại **Web application** trong Google Cloud / Google Auth Platform.
2. Trong cấu hình OAuth client của Google, thêm domain của website vào **Authorized JavaScript origins**.
3. Trong Supabase Dashboard mở **Authentication → Sign In / Providers → Google**. Bật Google; sao chép callback URL mà Supabase hiển thị và thêm URL đó vào **Authorized redirect URIs** trong Google.
4. Dán Google Client ID và Client Secret vào phần cấu hình Google provider trong Supabase Dashboard rồi lưu.
5. Trong Supabase **Authentication → URL Configuration**, đặt Site URL là URL chính thức của website và thêm URL local để thử nghiệm cùng domain Netlify / domain riêng vào Redirect URLs.

Hướng dẫn chính thức: https://supabase.com/docs/guides/auth/social-login/auth-google

## C. Bật đăng nhập Facebook

1. Tạo app tại Meta for Developers và bật sản phẩm Facebook Login.
2. Trong Supabase **Authentication → Sign In / Providers → Facebook**, bật provider và sao chép callback URL mà Supabase hiển thị.
3. Dán callback chính xác đó vào **Valid OAuth Redirect URIs** của Facebook Login; nhập Facebook App ID và App Secret vào Supabase Dashboard.
4. Bật quyền email nếu website/app cần trường email. Trong thời gian Meta app còn ở Development mode, chỉ tài khoản tester/developer được cho phép mới đăng nhập thành công.
5. Đưa app sang trạng thái phù hợp với chính sách Meta trước khi mở cho thành viên ngoài nhóm tester.

Hướng dẫn chính thức: https://supabase.com/docs/guides/auth/social-login/auth-facebook

### URL chuyển hướng

Trong **Supabase → Authentication → URL Configuration → Redirect URLs**, thêm các URL thật mà cậu sử dụng, ví dụ:

- `http://localhost:5500/**`
- `http://127.0.0.1:5500/**`
- `https://TEN-WEBSITE-CUA-CAU.netlify.app/**`
- `https://domain-rieng-cua-cau/**`

Thay các ví dụ bằng đúng domain. URL website trong cài đặt OAuth của Google/Facebook và URL Redirect URLs trong Supabase là hai phần cấu hình khác nhau, cần khớp với môi trường sử dụng.

Hướng dẫn URL redirect: https://supabase.com/docs/guides/auth/redirect-urls

## D. Chạy thử trên máy tính

Không nên mở `index.html` trực tiếp bằng `file://` khi kiểm tra OAuth. Mở Terminal/Command Prompt tại thư mục chứa `index.html` và chạy:

```bash
python -m http.server 5500
```

Sau đó vào `http://localhost:5500`. Cậu cũng có thể dùng một local static server tương đương. Nhớ thêm URL local vào Supabase Redirect URLs và Google Authorized JavaScript origins.

## E. Đưa lên Netlify

1. Giải nén ZIP vào một thư mục.
2. Mở `config.js`, điền Supabase URL và publishable/anon key.
3. Đăng nhập Netlify, chọn tạo site mới bằng cách deploy thư mục/file tĩnh (manual deploy) hoặc nối Git repository. Với manual deploy, tải nội dung thư mục dự án đã giải nén lên; nếu giao diện yêu cầu, hãy chọn thư mục có `index.html` và `netlify.toml` ở ngay cấp gốc.
4. Sau lần deploy đầu tiên, sao chép URL `*.netlify.app` rồi thêm vào Supabase Redirect URLs và Google Authorized JavaScript origins. Thêm domain riêng nếu có.
5. Kiểm tra cả hai luồng đăng nhập, đăng tải tệp và phân quyền bằng **hai tài khoản thử nghiệm khác nhau**.

`netlify.toml` đã đặt thư mục publish là thư mục gốc và thêm một số response headers cơ bản. Backend dữ liệu và media chạy trên Supabase, không phải trên ổ đĩa tạm của Netlify.

## F. Kiểm tra quyền bảo mật trước khi chia sẻ cho cả lớp

1. Đăng nhập bằng tài khoản A, tải ảnh lên và xác nhận chủ ảnh thấy nút sửa/xóa.
2. Đăng nhập bằng tài khoản B trong cửa sổ trình duyệt riêng. B có thể xem ảnh và thả reaction, nhưng không được sửa/xóa bài của A.
3. Kiểm tra trong `supabase/schema.sql` rằng RLS đang bật cho cả ba bảng và hai Storage bucket đều là **private**.
4. Nếu website đang công khai cho thành viên lớp, hãy chia sẻ URL website, không chia sẻ khóa OAuth bí mật hoặc mật khẩu database.

## Giới hạn mặc định trong bản này

- Mỗi ảnh tối đa 15 MB; mỗi video tối đa 50 MB; avatar tối đa 5 MB. Có thể đổi trong `app.js` và thiết lập Storage tương ứng, nhưng giới hạn của bucket/backend vẫn phải phù hợp.
- Ứng dụng hiện tải tối đa 200 bài mới nhất trên mỗi lần tải trang để giao diện nhanh. Có thể tăng hoặc xây dựng phân trang khi album lớn hơn.
- Media được xem bởi các thành viên đã đăng nhập trong cùng Supabase project. Ảnh/video không phải công khai cho toàn Internet, nhưng đường dẫn ký có thời hạn có thể được xem bởi bất kỳ ai mà người dùng tự gửi đường dẫn đó cho trong thời gian hiệu lực.
- Website chưa có chức năng khôi phục tài khoản tùy chỉnh, kiểm duyệt/quản trị viên, thông báo đẩy hay nén video tự động. Các phần đó cần backend và quy tắc vận hành bổ sung.
- Nếu bật liên kết thêm Google/Facebook cho một tài khoản đang đăng nhập, hãy kiểm tra cấu hình provider và Identity Linking của Supabase. Tùy cấu hình OAuth, luồng liên kết có thể yêu cầu đăng nhập/xác nhận lại.

## Cấu trúc dự án

```text
noi-luu-giu-thanh-xuan-a5/
├── index.html             # giao diện và các modal
├── styles.css             # thiết kế responsive, animation
├── app.js                 # logic frontend / Supabase client
├── config.js              # điền project URL + public key của riêng cậu
├── config.example.js      # cấu hình mẫu
├── netlify.toml           # cấu hình deploy tĩnh
├── _redirects             # fallback cho route tĩnh
└── supabase/
    └── schema.sql         # backend database, RLS, storage policies
```

### Tài liệu backend

- Storage Access Control: https://supabase.com/docs/guides/storage/security/access-control
- Storage ownership: https://supabase.com/docs/guides/storage/security/ownership

**Mô hình bảo mật:** website chỉ sử dụng publishable/anon key ở trình duyệt và dựa vào RLS để lọc dữ liệu; khóa `service_role` không được dùng trên frontend. Supabase Auth xử lý OAuth; PostgreSQL là nguồn timestamp cho bài đăng. Hãy giữ quyền sở hữu Supabase project ở tài khoản tin cậy và bật xác thực nhiều yếu tố cho tài khoản quản trị.
