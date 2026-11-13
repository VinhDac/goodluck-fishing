# GoodLuck Fishing: thiết kế lối chơi (bản nháp để Vin duyệt)

Viết 13/11/2026 theo lời Vin: «xóa hết chỉ giữ lại bước search ... làm nó thành 1 game câu cá. mỗi ngày người dùng vào
câu cá 10 phút ... không bán đâu, làm kiểu promote tên tuổi ... đầu tư vào lối chơi, trải nghiệm người dùng».

## Một câu

Con vịt GoodLuck ngồi thuyền câu cá: mỗi cá là một việc làm thật vừa đăng, cá càng to càng hợp CV của bạn; 10 phút mỗi
ngày, cuối buổi có một giỏ việc để nộp.

## Vì sao làm được mà không cần server

Đã thử 13/11: Greenhouse, Lever, Ashby, Workable, SmartRecruiters đều cho trình duyệt đọc thẳng danh sách việc (CORS mở).
Nên game là MỘT TRANG WEB TĨNH: không cài, không server, không tốn tiền chạy, không gửi CV của ai đi đâu (CV nằm trong
trình duyệt người chơi). Đặt ở vinhdac.github.io/fishing, ai có link là chơi.

## Vòng chơi (một buổi = 10 phút)

1. **Lần đầu (30 giây):** dán CV (hoặc thả file PDF), chọn 1 đến 3 chức danh và thành phố. Lưu trong trình duyệt.
2. **Ra ao:** cảnh pixel, mặt trời mọc. Đồng hồ 10 phút là mặt trời đi qua bầu trời.
3. **Thả câu:** giữ chuột để lấy đà, thả ra. Mỗi lần thả là một "điểm câu" = một công ty được đọc thật.
4. **Cá cắn câu:** phao giật khi có việc khớp chức danh. Kéo cần (một cú bấm đúng nhịp) để lên cá.
   Cá hiện ra kèm tấm thẻ: chức danh, công ty, nơi làm, đăng mấy giờ trước, điểm khớp CV.
5. **Cỡ cá = điểm:** cá nhỏ (dưới 50), cá vừa, cá to (70+), **cá vàng** (85+, hiếm, có hiệu ứng riêng).
   Việc đăng trong 24 giờ có vây sáng ("cá tươi").
6. **Không bao giờ phạt:** kéo hụt cá vẫn vào giỏ. Trò chơi chỉ làm vui; dữ liệu không mất.
   Ai lười có thể để vịt tự câu, ngồi xem.
7. **Hoàng hôn = hết buổi:** cái giỏ mở ra: danh sách việc hôm nay xếp theo cỡ cá, mỗi việc một nút "Nộp" tới trang
   gốc của công ty, nút đánh dấu "đã nộp".

## Thứ giữ người ta quay lại (và quảng bá)

- **Thẻ "mẻ cá hôm nay"** (ảnh pixel đẹp: số cá, cá to nhất, chuỗi ngày): một nút chia sẻ lên LinkedIn/X.
  Góc thẻ ghi "GoodLuck Fishing by Vinh Dac". Đây là chỗ tên anh đi ra ngoài.
- **Sổ cá (Fishdex):** mỗi công ty là một loài cá, câu được thì mở ô trong sổ.
- **Chuỗi ngày câu:** ngày thứ mấy liên tiếp.
- Việc đã thấy hôm trước không hiện lại; ao "cạn" thì nói thật là hôm nay ít việc mới.

## Nguồn tìm (bản đầu)

Chỉ nguồn hợp pháp, chạy ổn: trang tuyển dụng gốc của công ty qua 5 hệ thống trên. Bắt đầu bằng danh sách vài trăm công
ty (lấy 35 công ty sẵn có, mở rộng dần), người chơi gõ thêm công ty muốn câu. Không LinkedIn, không cào trang.

## Chấm điểm

Theo luật, chạy trong trình duyệt: bao nhiêu phần điều việc đòi CV có nói tới (cùng cách GoodLuck chấm, viết lại gọn).
Không dùng AI, không tốn gì.

## Kỹ thuật

HTML + CSS + JS thuần, vẽ canvas pixel, không bước build. Thư mục này riêng, không đụng JobA-Z.

## Các bước dựng (mỗi bước Vin xem rồi mới đi tiếp)

1. Ao, thuyền, vịt, thả câu, cá nổi lên từ việc thật của 35 công ty (chưa chấm điểm).
2. Màn lần đầu (CV, chức danh, thành phố) và chấm điểm = cỡ cá.
3. Giỏ cuối buổi, nút Nộp, đánh dấu đã nộp, nhớ việc đã thấy.
4. Thẻ chia sẻ, sổ cá, chuỗi ngày.
5. Đưa lên vinhdac.github.io/fishing.
