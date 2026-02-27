# BẢN Ý TƯỞNG & KẾ HOẠCH TRIỂN KHAI DỰ ÁN  
**CosmoMosaic** 🚀  

**Phiên bản:** 2.0 – Low-code Miễn phí 100% – Tối ưu ngân sách 2026  
**Ngày lập:** 27/02/2026  
**Tác giả:** Đặng (với hỗ trợ AI tối ưu)  

## 1. Thông tin tổng quan  
**Tên dự án:** **CosmoMosaic**  
**Tagline:** *Ghép tri thức, thắp sáng vũ trụ!*  

**Đối tượng mục tiêu:** Học sinh tiểu học Việt Nam (Lớp 1 – Lớp 5, 6–11 tuổi)  
**Triết lý giáo dục:** “Học tập vô hình” (Invisible Learning) – Toàn bộ kiến thức sách giáo khoa phổ thông 2018 được giấu hoàn toàn vào gameplay. Trẻ chỉ cảm nhận đang chơi một game vũ trụ neon siêu vui, không biết mình đang học.  

**Mục tiêu:**  
Xây dựng ứng dụng giáo dục **độc đáo nhất Việt Nam** kết hợp:  
- Vũ trụ neon/pastel rực rỡ  
- Mascot AI companion tiếng Việt  
- Hành tinh Di sản Việt Nam  
- Cơ chế RPG class system  
- Procedural generation  
- Retention cao (daily quest + seasonal VN)  
- Parent Dashboard tối giản  

**Ngân sách triển khai MVP:** 0đ (chỉ domain sau này ~200k/năm nếu muốn)  

## 2. Cốt truyện & Trải nghiệm Mở đầu  
**Cốt truyện chính:**  
Vũ trụ Tri thức đang bị “Băng đảng Lười Biếng” xâm chiếm, cướp mất các **Mảnh ghép Mosaic** khiến các hành tinh xỉn màu. Người chơi là Tân binh được giao nhiệm vụ thu thập và ghép lại các mảnh mosaic để thắp sáng lại vũ trụ.  

**Đồ họa chủ đạo:** Neon + Pastel cực kỳ rực rỡ, dễ thương, phù hợp trẻ tiểu học.  
**Mascot chính:** Cún/Mèo Không gian (có thể chọn hoặc đổi) – AI companion nói chuyện bằng tiếng Việt (dùng Web Speech API miễn phí). Bé có thể chat thoại “Hôm nay học gì?”, “Giải thích lỗi của con đi!”  

**Trạm Đăng Ký (Onboarding):**  
AI “Chỉ huy Trưởng Cú Mèo” chào hỏi → Bài test ẩn dạng “Khởi động tàu vũ trụ” (4 câu hỏi ngẫu nhiên) → Hệ thống tự xếp lớp & độ khó phù hợp.  

**Hệ thống Nhập vai (Class System – 3 lớp):**  
- **Chiến binh Sao Băng**: Lá chắn thép (sai 1 lần không mất máu)  
- **Phù thủy Tinh vân**: Ngưng đọng thời gian (thêm thời gian)  
- **Thợ săn Ngân hà**: Mắt đại bàng (loại 1 đáp án sai)  

**Nâng cấp sáng tạo:** Mỗi hành tinh là 1 di sản Việt Nam  
- Hành tinh Vịnh Hạ Long → Tiếng Anh & Địa lý  
- Hành tinh Cố đô Huế → Lịch sử & Tiếng Việt  
- Hành tinh Làng Gióng → Toán & Tin học  
- … (dễ mở rộng)  

## 3. Cơ chế Lối chơi & Thuật toán “Tiến hóa Tri thức”  
Toàn bộ màn chơi được tạo **vô tận (Procedural Generation)** nhờ GDevelop – không bao giờ lặp lại, độ khó tự động tăng theo tiến độ bé.  

**Hành động 1:** Bắn súng Không gian (Ẩn môn Tiếng Việt / Tiếng Anh)  
→ Né bom từ sai chính tả, bắn vào bom từ ĐÚNG.  

**Hành động 2:** Kéo thả Vật lý (Ẩn môn Toán / Tin học)  
→ Cân bằng lò rèn vũ trụ bằng phân số/phép tính + nối mạch logic gate.  

**Hành động 3:** Vượt chướng ngại tốc độ cao (Ẩn môn Tiếng Anh)  
→ Ném vật phẩm (quả táo, màu sắc…) vào rào chắn có từ vựng tiếng Anh tương ứng.  

**Tích hợp sáng tạo:**  
- Voice recognition (phát âm Tiếng Anh/Việt)  
- AR nhẹ (quét sách giáo khoa 2018 để unlock level – dùng 8th Wall free)  

## 4. Hệ thống Giữ chân Người chơi (Retention)  
- **Nhiệm vụ Khẩn cấp Hàng ngày**: AI phát động sự cố ngẫu nhiên → bé phải đăng nhập xử lý.  
- **Sự kiện theo mùa (Seasonal Events)**:  
  - Trung Thu Ngân Hà – Giải cứu Cây Đa Lượng Tử  
  - Tết Nguyên Đán Vũ Trụ  
  - Giỗ Tổ Hùng Vương Ngân Hà  
  → Đổi bối cảnh + vật phẩm (bánh trung thu, lồng đèn, áo dài không gian…) để đổi skin giới hạn.  

## 5. Bảng Điều Khiển Phụ Huynh (Parent Dashboard)  
Tách biệt hoàn toàn với giao diện game của trẻ.  
**Phong cách:** Tối giản hiện đại – Nền xám nhạt (#F8FAFC), card trắng bo góc, 4 màu pastel phân biệt môn học.  

**Tính năng chính:**  
- Biểu đồ cột tiến độ, số giờ chơi, streak ngày  
- **AI Insights**: Phân tích điểm mạnh/yếu + lời khuyên đời thường bằng tiếng Việt  
  (“Con bạn hay nhầm dấu thanh, hôm nay thử chơi hành tinh Huế thêm nhé!”)  

## 6. Kiến trúc Công nghệ (Tech Stack 100% Miễn phí cho MVP)  
- **Game Engine**: GDevelop (open-source, visual scripting, export HTML5 không giới hạn)  
- **Backend & Database**: Supabase Free (Auth, PostgreSQL, Storage – 500MB miễn phí mãi)  
- **Frontend & Dashboard**: Next.js 15 + Tailwind CSS + Recharts (AI sinh code toàn bộ)  
- **Hosting**: Vercel Hobby (free, tự động, PWA chạy mượt tablet)  
- **AI Companion & Voice**: Web Speech API + Grok/Claude miễn phí  
- **Assets đồ họa**: Generate bằng Grok/Flux/Gemini + assets miễn phí itch.io (neon pixel + pastel)  

## 7. Lộ trình Triển khai (3–4 tháng, chỉ dùng AI miễn phí)  
**Tuần 1–2:**  
- Cài GDevelop + học 5 tutorial cơ bản  
- Generate 100+ assets mascot & background neon/pastel bằng AI  

**Tuần 3–6:**  
- Build 3 màn chơi chính trong GDevelop  
- Tạo project Supabase + nhập 300 câu hỏi sách giáo khoa 2018 (AI sinh)  

**Tuần 7–10:**  
- Claude/Grok sinh toàn bộ Next.js app + Parent Dashboard  
- Embed game GDevelop bằng iframe  

**Tuần 11–12:**  
- Test beta với 20 bé (nhóm phụ huynh Facebook)  
- Thêm daily quest + 1 seasonal event  
- Deploy lên Vercel → có link chia sẻ công khai  

**Sau MVP:**  
- Thêm voice mascot, AR, nhiều hành tinh di sản  
- Freemium: Miễn phí 100% kiến thức (có thể mở rộng sau)  

## 8. Điểm độc đáo & khả năng thành công  
- Không app giáo dục nào ở Việt Nam có **vũ trụ neon + di sản VN + mascot AI nói tiếng Việt + học vô hình**.  
- Đồ họa neon/pastel cực “wow” mà chi phí 0đ.  
- Retention cao nhờ daily + seasonal văn hóa Việt.  
- Dễ mở rộng thành hợp tác Bộ GD&ĐT (AI giáo dục quốc gia 2026).  

---

**Tài liệu hỗ trợ sẵn (copy-paste ngay):**  
- 15 prompt AI mạnh nhất (generate assets, code, câu hỏi…)  
- Hướng dẫn từng bước Tuần 1  
- Wireframe Figma miễn phí  

**Bạn chỉ cần nói:** “Gửi prompt đầy đủ” hoặc “Hướng dẫn Tuần 1” là tôi gửi liền!  

**CosmoMosaic** đã sẵn sàng “bùng nổ”! 🚀  
Ghép tri thức – Thắp sáng vũ trụ! ✨