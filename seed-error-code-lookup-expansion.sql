-- Expanded model catalogue and original, general-purpose diagnostic guides.
-- Run after migrations/0007_lookup_models_and_diagnostic_guides.sql.

INSERT OR IGNORE INTO lookup_models (model_id, manufacturer, device_type, model_name) VALUES
  ('DRM-D9', 'Dreame', 'robot_vacuum_mop', 'D9'),
  ('DRM-D9P', 'Dreame', 'robot_vacuum_mop', 'D9 Pro'),
  ('DRM-D9M', 'Dreame', 'robot_vacuum_mop', 'D9 Max'),
  ('DRM-D9M2', 'Dreame', 'robot_vacuum_mop', 'D9 Max Gen 2'),
  ('DRM-D10P', 'Dreame', 'robot_vacuum_mop', 'D10 Plus'),
  ('DRM-D20U', 'Dreame', 'robot_vacuum_mop', 'D20 Ultra'),
  ('DRM-D30U', 'Dreame', 'robot_vacuum_mop', 'D30 Ultra'),
  ('DRM-L10P', 'Dreame', 'robot_vacuum_mop', 'L10 Prime'),
  ('DRM-L10U', 'Dreame', 'robot_vacuum_mop', 'L10 Ultra'),
  ('DRM-L10PR', 'Dreame', 'robot_vacuum_mop', 'L10 Pro'),
  ('DRM-L10SU', 'Dreame', 'robot_vacuum_mop', 'L10s Ultra'),
  ('DRM-L10SPU', 'Dreame', 'robot_vacuum_mop', 'L10s Pro Ultra'),
  ('DRM-L10S2', 'Dreame', 'robot_vacuum_mop', 'L10s Ultra Gen 2'),
  ('DRM-L10S3', 'Dreame', 'robot_vacuum_mop', 'L10s Ultra Gen 3'),
  ('DRM-L10SH', 'Dreame', 'robot_vacuum_mop', 'L10s Ultra Heat'),
  ('DRM-L20U', 'Dreame', 'robot_vacuum_mop', 'L20 Ultra'),
  ('DRM-L30SU', 'Dreame', 'robot_vacuum_mop', 'L30s Ultra'),
  ('DRM-L40U', 'Dreame', 'robot_vacuum_mop', 'L40 Ultra'),
  ('DRM-L40SU', 'Dreame', 'robot_vacuum_mop', 'L40s Ultra'),
  ('DRM-L50U', 'Dreame', 'robot_vacuum_mop', 'L50 Ultra'),
  ('DRM-M40S', 'Dreame', 'robot_vacuum_mop', 'M40S'),
  ('DRM-S10', 'Dreame', 'robot_vacuum_mop', 'S10'),
  ('DRM-S10P', 'Dreame', 'robot_vacuum_mop', 'S10 Pro'),
  ('DRM-S10PL', 'Dreame', 'robot_vacuum_mop', 'S10 Plus'),
  ('DRM-X30U', 'Dreame', 'robot_vacuum_mop', 'X30 Ultra'),
  ('DRM-X30M', 'Dreame', 'robot_vacuum_mop', 'X30 Master'),
  ('DRM-X40U', 'Dreame', 'robot_vacuum_mop', 'X40 Ultra'),
  ('DRM-X40M', 'Dreame', 'robot_vacuum_mop', 'X40 Master'),
  ('DRM-X50U', 'Dreame', 'robot_vacuum_mop', 'X50 Ultra'),
  ('DRM-X50PU', 'Dreame', 'robot_vacuum_mop', 'X50 Pro Ultra'),
  ('DRM-X50M', 'Dreame', 'robot_vacuum_mop', 'X50 Master'),
  ('DRM-X60U', 'Dreame', 'robot_vacuum_mop', 'X60 Ultra'),
  ('DRM-Z10P', 'Dreame', 'robot_vacuum_mop', 'Z10 Pro'),
  ('MOV-E30U', 'MOVA', 'robot_vacuum_mop', 'E30 Ultra'),
  ('MOV-E30P', 'MOVA', 'robot_vacuum_mop', 'E30 Pro'),
  ('MOV-M10', 'MOVA', 'robot_vacuum_mop', 'M10'),
  ('MOV-M10P', 'MOVA', 'robot_vacuum_mop', 'M10 Pro'),
  ('MOV-M10S', 'MOVA', 'robot_vacuum_mop', 'M10 Station'),
  ('MOV-M30P', 'MOVA', 'robot_vacuum_mop', 'M30 Pro'),
  ('MOV-M30S', 'MOVA', 'robot_vacuum_mop', 'M30s'),
  ('MOV-M40', 'MOVA', 'robot_vacuum_mop', 'M40'),
  ('MOV-P50U', 'MOVA', 'robot_vacuum_mop', 'P50 Ultra'),
  ('MOV-P50PU', 'MOVA', 'robot_vacuum_mop', 'P50 Pro Ultra'),
  ('MOV-V50U', 'MOVA', 'robot_vacuum_mop', 'V50 Ultra Complete'),
  ('MOV-Z50U', 'MOVA', 'robot_vacuum_mop', 'Z50 Ultra'),
  ('RBR-Q5P', 'Roborock', 'robot_vacuum_mop', 'Q5 Pro'),
  ('RBR-Q7M', 'Roborock', 'robot_vacuum_mop', 'Q7 Max'),
  ('RBR-Q8M', 'Roborock', 'robot_vacuum_mop', 'Q8 Max+'),
  ('RBR-QR', 'Roborock', 'robot_vacuum_mop', 'Qrevo'),
  ('RBR-QRS', 'Roborock', 'robot_vacuum_mop', 'Qrevo S'),
  ('RBR-QRM', 'Roborock', 'robot_vacuum_mop', 'Qrevo Master'),
  ('RBR-QRC', 'Roborock', 'robot_vacuum_mop', 'Qrevo Curv'),
  ('RBR-S4', 'Roborock', 'robot_vacuum', 'S4'),
  ('RBR-S5M', 'Roborock', 'robot_vacuum', 'S5 Max'),
  ('RBR-S6', 'Roborock', 'robot_vacuum', 'S6'),
  ('RBR-S6P', 'Roborock', 'robot_vacuum', 'S6 Pure'),
  ('RBR-S7', 'Roborock', 'robot_vacuum_mop', 'S7'),
  ('RBR-S7M', 'Roborock', 'robot_vacuum_mop', 'S7 MaxV'),
  ('RBR-S7MU', 'Roborock', 'robot_vacuum_mop', 'S7 MaxV Ultra'),
  ('RBR-S8', 'Roborock', 'robot_vacuum_mop', 'S8'),
  ('RBR-S8PU', 'Roborock', 'robot_vacuum_mop', 'S8 Pro Ultra'),
  ('RBR-S8MU', 'Roborock', 'robot_vacuum_mop', 'S8 MaxV Ultra'),
  ('RBR-SAR10', 'Roborock', 'robot_vacuum_mop', 'Saros 10'),
  ('RBR-SAR10R', 'Roborock', 'robot_vacuum_mop', 'Saros 10R'),
  ('ECV-N8', 'ECOVACS', 'robot_vacuum_mop', 'DEEBOT N8'),
  ('ECV-N8P', 'ECOVACS', 'robot_vacuum_mop', 'DEEBOT N8+'),
  ('ECV-T8', 'ECOVACS', 'robot_vacuum_mop', 'DEEBOT T8 AIVI'),
  ('ECV-T9', 'ECOVACS', 'robot_vacuum_mop', 'DEEBOT T9 AIVI'),
  ('ECV-X1O', 'ECOVACS', 'robot_vacuum_mop', 'X1 Omni'),
  ('ECV-X2O', 'ECOVACS', 'robot_vacuum_mop', 'X2 Omni'),
  ('ECV-X2C', 'ECOVACS', 'robot_vacuum_mop', 'X2 Combo'),
  ('ECV-T10O', 'ECOVACS', 'robot_vacuum_mop', 'T10 Omni'),
  ('ECV-T20O', 'ECOVACS', 'robot_vacuum_mop', 'T20 Omni'),
  ('ECV-T30P', 'ECOVACS', 'robot_vacuum_mop', 'T30 Pro Omni'),
  ('ECV-T50P', 'ECOVACS', 'robot_vacuum_mop', 'T50 Pro Omni'),
  ('ECV-X5P', 'ECOVACS', 'robot_vacuum_mop', 'X5 Pro Omni'),
  ('ECV-X8P', 'ECOVACS', 'robot_vacuum_mop', 'X8 Pro Omni'),
  ('ECV-T80', 'ECOVACS', 'robot_vacuum_mop', 'T80 Omni'),
  ('XMI-E5', 'Xiaomi', 'robot_vacuum_mop', 'Robot Vacuum E5'),
  ('XMI-E10', 'Xiaomi', 'robot_vacuum_mop', 'Robot Vacuum E10'),
  ('XMI-E10C', 'Xiaomi', 'robot_vacuum_mop', 'Robot Vacuum E10C'),
  ('XMI-H40', 'Xiaomi', 'robot_vacuum_mop', 'Robot Vacuum H40'),
  ('XMI-M2', 'Xiaomi', 'robot_vacuum_mop', 'Mi Robot Vacuum-Mop 2'),
  ('XMI-M2P', 'Xiaomi', 'robot_vacuum_mop', 'Mi Robot Vacuum-Mop 2 Pro'),
  ('XMI-M2U', 'Xiaomi', 'robot_vacuum_mop', 'Mi Robot Vacuum-Mop 2 Ultra'),
  ('XMI-S10', 'Xiaomi', 'robot_vacuum_mop', 'Robot Vacuum S10'),
  ('XMI-S10P', 'Xiaomi', 'robot_vacuum_mop', 'Robot Vacuum S10+'),
  ('XMI-S20P', 'Xiaomi', 'robot_vacuum_mop', 'Robot Vacuum S20+'),
  ('XMI-X10', 'Xiaomi', 'robot_vacuum_mop', 'Robot Vacuum X10'),
  ('XMI-X10P', 'Xiaomi', 'robot_vacuum_mop', 'Robot Vacuum X10+'),
  ('XMI-X20P', 'Xiaomi', 'robot_vacuum_mop', 'Robot Vacuum X20+'),
  ('XMI-X20PR', 'Xiaomi', 'robot_vacuum_mop', 'Robot Vacuum X20 Pro'),
  ('XMI-X20M', 'Xiaomi', 'robot_vacuum_mop', 'Robot Vacuum X20 Max'),
  ('NRW-F', 'Narwal', 'robot_vacuum_mop', 'Freo'),
  ('NRW-FP', 'Narwal', 'robot_vacuum_mop', 'Freo Pro'),
  ('NRW-FX', 'Narwal', 'robot_vacuum_mop', 'Freo X Plus'),
  ('NRW-FXU', 'Narwal', 'robot_vacuum_mop', 'Freo X Ultra'),
  ('NRW-FZ', 'Narwal', 'robot_vacuum_mop', 'Freo Z Ultra'),
  ('NRW-FZ10', 'Narwal', 'robot_vacuum_mop', 'Freo Z10 Ultra'),
  ('EUF-C20', 'Eufy', 'robot_vacuum_mop', 'C20 Omni'),
  ('EUF-E20', 'Eufy', 'robot_vacuum_mop', 'E20'),
  ('EUF-L60', 'Eufy', 'robot_vacuum', 'L60'),
  ('EUF-L60S', 'Eufy', 'robot_vacuum', 'L60 SES'),
  ('EUF-S1P', 'Eufy', 'robot_vacuum_mop', 'S1 Pro'),
  ('EUF-X8H', 'Eufy', 'robot_vacuum_mop', 'X8 Hybrid'),
  ('EUF-X8P', 'Eufy', 'robot_vacuum_mop', 'X8 Pro'),
  ('EUF-X9P', 'Eufy', 'robot_vacuum_mop', 'X9 Pro'),
  ('EUF-X10P', 'Eufy', 'robot_vacuum_mop', 'X10 Pro Omni');

-- The guides below are newly written, generic checks. They deliberately avoid
-- model-specific disassembly and only appear alongside a selected manufacturer.
WITH brands(manufacturer, code) AS (
  VALUES
    ('Dreame', 'DRM'), ('MOVA', 'MOV'), ('Roborock', 'RBR'),
    ('ECOVACS', 'ECV'), ('Xiaomi', 'XMI'), ('Narwal', 'NRW'), ('Eufy', 'EUF')
)
INSERT OR REPLACE INTO symptom_references (
  record_id, manufacturer, device_type, model_scope, reported_code, symptom_key,
  title_vi, summary_vi, first_action_vi, safety_stop_vi, diagnostic_steps_vi,
  service_handoff_vi, confidence_score, confidence_label, model_scope_note_vi,
  source_name, source_url, source_accessed_at, publication_status
)
SELECT
  'GUIDE-' || code || '-CHARGE', manufacturer, 'robot_vacuum_mop', 'Tất cả model', '',
  'dock-charge', 'Không sạc hoặc không về trạm',
  'Robot không bắt đầu sạc, sạc chập chờn hoặc tìm thấy trạm nhưng không ghép đúng tiếp điểm.',
  'Kiểm tra đèn nguồn của trạm và lau khô tiếp điểm sạc trên cả robot lẫn trạm trước khi thử lại.',
  'Dừng ngay nếu pin nóng bất thường, có mùi khét, phồng pin hoặc nước đã chạm khu vực điện.',
  'Xác nhận trạm có điện, cắm chắc đầu nguồn và thử một ổ điện khác nếu đèn trạm không sáng.\nLau tiếp điểm sạc trên robot và trạm bằng khăn khô, sau đó chờ bề mặt khô hoàn toàn.\nLau sạch vùng cảm biến ở mặt trước trạm và dọn khoảng trống phía trước để robot dễ căn vị trí.\nKiểm tra khay trạm, bánh xe trước và hai bánh dẫn động có tóc hoặc dị vật làm robot đứng lệch không.\nKhởi động lại robot, đặt thẳng bằng tay lên trạm rồi chờ vài phút để kiểm tra biểu tượng sạc.\nNếu robot tự quay về trạm, hãy thử từ khoảng cách ngắn trên nền khô và phẳng.',
  'Nếu đã làm sạch nhưng máy vẫn không nhận sạc, hãy mang cả robot và trạm để kiểm tra cùng nhau. Máy còn bảo hành nên ưu tiên trung tâm bảo hành chính hãng.',
  0.70, 'trung bình', 'Hướng dẫn kiểm tra chung cho robot ' || manufacturer || '; cần đối chiếu đúng model trước khi thay linh kiện.',
  '', '', '', 'general-service-guide'
FROM brands;

WITH brands(manufacturer, code) AS (
  VALUES
    ('Dreame', 'DRM'), ('MOVA', 'MOV'), ('Roborock', 'RBR'),
    ('ECOVACS', 'ECV'), ('Xiaomi', 'XMI'), ('Narwal', 'NRW'), ('Eufy', 'EUF')
)
INSERT OR REPLACE INTO symptom_references (
  record_id, manufacturer, device_type, model_scope, reported_code, symptom_key,
  title_vi, summary_vi, first_action_vi, safety_stop_vi, diagnostic_steps_vi,
  service_handoff_vi, confidence_score, confidence_label, model_scope_note_vi,
  source_name, source_url, source_accessed_at, publication_status
)
SELECT
  'GUIDE-' || code || '-WATER', manufacturer, 'robot_vacuum_mop', 'Tất cả model', '',
  'mop-water-dry', 'Không ra nước hoặc lau xong sàn vẫn khô',
  'Giẻ vẫn khô, lượng nước ra ít hoặc trạm có dấu hiệu cấp nước không bình thường.',
  'Tháo giẻ để kiểm tra độ ẩm và xác nhận bình nước sạch hoặc khay giặt đã lắp khít.',
  'Ngắt điện trạm và dừng sử dụng nếu có nước tràn, rò vào phần điện hoặc trạm nóng bất thường.',
  'Xác nhận chế độ lau và mức nước trong ứng dụng phù hợp với sàn đang dùng.\nKiểm tra bình nước sạch còn nước, bình nước bẩn chưa đầy và nắp bình đã đóng kín.\nNếu model có trạm giặt, tháo khay giặt để lấy tóc và cặn bẩn ở phần dễ tiếp cận rồi lắp lại đúng khớp.\nLàm ẩm nhẹ giẻ trước khi thử chu trình lau mới; không đổ nước trực tiếp vào thân robot.\nKiểm tra đầu phun ngoài bề mặt có bị che bởi cặn hoặc dị vật hay không.\nChạy thử ngắn ở khu vực khô, quan sát dưới trạm và quanh robot để phát hiện rò nước.',
  'Không tự thông ống, tháo bơm hay mở thân trạm. Nếu vẫn khô sau khi đã kiểm tra vật tư, hoặc thấy nước rò, hãy ngắt điện và liên hệ kỹ thuật.',
  0.70, 'trung bình', 'Hướng dẫn chung cho robot ' || manufacturer || ' có chức năng lau; model không có trạm nước có thể không áp dụng toàn bộ các bước.',
  '', '', '', 'general-service-guide'
FROM brands;

WITH brands(manufacturer, code) AS (
  VALUES
    ('Dreame', 'DRM'), ('MOVA', 'MOV'), ('Roborock', 'RBR'),
    ('ECOVACS', 'ECV'), ('Xiaomi', 'XMI'), ('Narwal', 'NRW'), ('Eufy', 'EUF')
)
INSERT OR REPLACE INTO symptom_references (
  record_id, manufacturer, device_type, model_scope, reported_code, symptom_key,
  title_vi, summary_vi, first_action_vi, safety_stop_vi, diagnostic_steps_vi,
  service_handoff_vi, confidence_score, confidence_label, model_scope_note_vi,
  source_name, source_url, source_accessed_at, publication_status
)
SELECT
  'GUIDE-' || code || '-NAV', manufacturer, 'robot_vacuum_mop', 'Tất cả model', '',
  'navigation-map-lds', 'Báo lỗi laser, đi sai hoặc bản đồ bất thường',
  'Robot quay vòng, va chạm, không định vị được hoặc tạo bản đồ không ổn định.',
  'Dừng phiên dọn hiện tại, làm sạch bề mặt cảm biến dễ tiếp cận và thử lại ở nơi đủ sáng, ít vật cản.',
  'Dừng sử dụng nếu robot va chạm mạnh liên tục, phát tiếng cơ khí ở cụm điều hướng hoặc không thể di chuyển thẳng.',
  'Lau nhẹ cửa sổ cảm biến, cảm biến chống rơi và phần tháp laser nếu model có trang bị.\nDọn dây điện, gương thấp, rèm chạm sàn và đồ vật phản chiếu sát nền trong khu vực thử.\nKiểm tra bánh xe và chổi có bị quấn tóc khiến robot trượt hoặc quay lệch hay không.\nKhởi động lại robot, chạy thử ở một phòng trống trước khi chỉnh sửa bản đồ.\nLưu ảnh hoặc ghi lại nguyên văn thông báo trong ứng dụng để đối chiếu đúng model.\nChỉ xóa bản đồ hoặc khôi phục cài đặt sau khi đã thử thao tác cơ bản và lưu thông tin cần thiết.',
  'Không tự tháo cụm laser, camera hoặc cảm biến. Nếu lỗi lặp lại ở phòng thoáng và sạch, hãy liên hệ kỹ thuật kèm ảnh thông báo và video ngắn.',
  0.70, 'trung bình', 'Hướng dẫn chung cho robot ' || manufacturer || '; tên và vị trí cảm biến khác nhau theo model.',
  '', '', '', 'general-service-guide'
FROM brands;

WITH brands(manufacturer, code) AS (
  VALUES
    ('Dreame', 'DRM'), ('MOVA', 'MOV'), ('Roborock', 'RBR'),
    ('ECOVACS', 'ECV'), ('Xiaomi', 'XMI'), ('Narwal', 'NRW'), ('Eufy', 'EUF')
)
INSERT OR REPLACE INTO symptom_references (
  record_id, manufacturer, device_type, model_scope, reported_code, symptom_key,
  title_vi, summary_vi, first_action_vi, safety_stop_vi, diagnostic_steps_vi,
  service_handoff_vi, confidence_score, confidence_label, model_scope_note_vi,
  source_name, source_url, source_accessed_at, publication_status
)
SELECT
  'GUIDE-' || code || '-SUCTION', manufacturer, 'robot_vacuum_mop', 'Tất cả model', '',
  'weak-suction', 'Hút yếu, bỏ sót bụi hoặc chổi hay kẹt',
  'Lực hút giảm, bụi còn lại nhiều hoặc robot phát tiếng gió bất thường khi làm sạch.',
  'Tắt robot, lấy hộp bụi ra và kiểm tra chổi chính, chổi cạnh cùng bộ lọc theo hướng dẫn của model.',
  'Dừng máy nếu có tiếng rít kim loại, mùi khét hoặc mô tơ nóng nhanh bất thường.',
  'Đổ hộp bụi và kiểm tra nắp hộp đã đóng kín trước khi lắp lại.\nGỡ tóc, chỉ và dây quấn quanh chổi chính, chổi cạnh và hai đầu trục chổi.\nKiểm tra bộ lọc theo đúng hướng dẫn của model; không lắp bộ lọc còn ướt.\nLau cửa hút bụi và đường dẫn dễ tiếp cận, không dùng vật nhọn chọc sâu vào thân máy.\nKiểm tra bánh xe có rác làm robot di chuyển chậm khiến đường hút không áp sát sàn.\nChạy thử trên một khu vực nhỏ với chế độ hút phù hợp để so sánh kết quả.',
  'Nếu lực hút vẫn yếu sau khi làm sạch phần ngoài, hoặc có tiếng mô tơ lạ, không nên tiếp tục chạy lâu. Hãy liên hệ kỹ thuật để kiểm tra quạt hút và đường khí bên trong.',
  0.70, 'trung bình', 'Hướng dẫn vệ sinh cơ bản cho robot ' || manufacturer || '; vật tư và cách tháo lắp phải theo tài liệu của đúng model.',
  '', '', '', 'general-service-guide'
FROM brands;

WITH brands(manufacturer, code) AS (
  VALUES
    ('Dreame', 'DRM'), ('MOVA', 'MOV'), ('Roborock', 'RBR'),
    ('ECOVACS', 'ECV'), ('Xiaomi', 'XMI'), ('Narwal', 'NRW'), ('Eufy', 'EUF')
)
INSERT OR REPLACE INTO symptom_references (
  record_id, manufacturer, device_type, model_scope, reported_code, symptom_key,
  title_vi, summary_vi, first_action_vi, safety_stop_vi, diagnostic_steps_vi,
  service_handoff_vi, confidence_score, confidence_label, model_scope_note_vi,
  source_name, source_url, source_accessed_at, publication_status
)
SELECT
  'GUIDE-' || code || '-EMPTY', manufacturer, 'robot_vacuum_mop', 'Tất cả model', '',
  'auto-empty-station', 'Về trạm nhưng không tự đổ bụi',
  'Robot vào trạm nhưng chu trình gom bụi không diễn ra hoặc trạm phát tiếng bất thường.',
  'Kiểm tra túi hoặc hộp bụi của trạm đã lắp đúng, nắp trạm đã đóng và khu vực cửa hút không bị che.',
  'Ngắt điện trạm nếu có mùi khét, tiếng rít kéo dài, vỏ nóng bất thường hoặc dấu hiệu kẹt cơ cấu.',
  'Kiểm tra trạm có điện và robot đã đỗ đúng vị trí sạc.\nKiểm tra túi bụi hoặc hộp bụi của trạm, thay hoặc làm rỗng khi đã đầy theo hướng dẫn model.\nLau phần cửa hút và gioăng ngoài bề mặt; chỉ lấy dị vật nhìn thấy ở vị trí dễ tiếp cận.\nĐảm bảo hộp bụi trên robot và nắp trạm đã lắp khít trước khi thử chu trình.\nChạy một chu trình ngắn, sau đó cho robot về trạm để quan sát tiếng vận hành.\nNếu model không có chức năng tự đổ, bỏ qua hướng dẫn này và dùng tra cứu triệu chứng khác.',
  'Không thọc vật cứng vào ống hay mô tơ trạm. Nếu trạm vẫn không gom bụi hoặc tiếng kêu bất thường quay lại, mang cả robot và trạm đi kiểm tra.',
  0.70, 'trung bình', 'Hướng dẫn chỉ áp dụng cho robot ' || manufacturer || ' có trạm tự đổ bụi.',
  '', '', '', 'general-service-guide'
FROM brands;

WITH brands(manufacturer, code) AS (
  VALUES
    ('Dreame', 'DRM'), ('MOVA', 'MOV'), ('Roborock', 'RBR'),
    ('ECOVACS', 'ECV'), ('Xiaomi', 'XMI'), ('Narwal', 'NRW'), ('Eufy', 'EUF')
)
INSERT OR REPLACE INTO symptom_references (
  record_id, manufacturer, device_type, model_scope, reported_code, symptom_key,
  title_vi, summary_vi, first_action_vi, safety_stop_vi, diagnostic_steps_vi,
  service_handoff_vi, confidence_score, confidence_label, model_scope_note_vi,
  source_name, source_url, source_accessed_at, publication_status
)
SELECT
  'GUIDE-' || code || '-WHEEL', manufacturer, 'robot_vacuum_mop', 'Tất cả model', '',
  'wheel-brush-noise', 'Bánh xe, chổi hoặc thân máy kêu bất thường',
  'Robot chạy chậm, rung, phát tiếng cọ sát hoặc dừng vì bánh xe, chổi bị cản.',
  'Tắt máy, lật robot trên bề mặt mềm và kiểm tra tóc hoặc dị vật ở chổi, bánh xe trước và hai bánh chính.',
  'Dừng chạy nếu có tiếng rít kim loại, bánh xe lắc mạnh, vỏ nứt hoặc robot kéo lê trên sàn.',
  'Tắt nguồn trước khi kiểm tra và không để robot tự chạy khi đang lật.\nGỡ tóc, chỉ và rác bám ngoài chổi chính, chổi cạnh và bánh xe trước.\nẤn nhẹ từng bánh chính để kiểm tra khả năng đàn hồi, không dùng lực bẩy.\nQuan sát lốp có mòn, rách hoặc dính dầu làm robot trượt hay không.\nLắp lại vật tư đúng khớp rồi chạy thử ngắn trên nền phẳng.\nGhi lại vị trí phát tiếng và thời điểm tiếng xuất hiện để kỹ thuật dễ kiểm tra.',
  'Không tự tháo mô tơ, hộp số hoặc cụm bánh xe. Nếu tiếng ồn còn sau khi làm sạch bên ngoài, hãy dừng máy để tránh làm hỏng thêm cơ cấu truyền động.',
  0.70, 'trung bình', 'Hướng dẫn chung cho robot ' || manufacturer || '; cấu tạo chổi và bánh xe thay đổi theo từng model.',
  '', '', '', 'general-service-guide'
FROM brands;

WITH brands(manufacturer, code) AS (
  VALUES
    ('Dreame', 'DRM'), ('MOVA', 'MOV'), ('Roborock', 'RBR'),
    ('ECOVACS', 'ECV'), ('Xiaomi', 'XMI'), ('Narwal', 'NRW'), ('Eufy', 'EUF')
)
INSERT OR REPLACE INTO symptom_references (
  record_id, manufacturer, device_type, model_scope, reported_code, symptom_key,
  title_vi, summary_vi, first_action_vi, safety_stop_vi, diagnostic_steps_vi,
  service_handoff_vi, confidence_score, confidence_label, model_scope_note_vi,
  source_name, source_url, source_accessed_at, publication_status
)
SELECT
  'GUIDE-' || code || '-POWER', manufacturer, 'robot_vacuum_mop', 'Tất cả model', '',
  'no-power', 'Không lên nguồn hoặc tự tắt khi rời trạm',
  'Robot không phản hồi nút nguồn, không sáng đèn hoặc chỉ hoạt động khi đang đặt trên trạm.',
  'Đặt robot lên trạm có điện, chờ vài phút rồi thử khởi động theo đúng hướng dẫn của model.',
  'Không tiếp tục sạc hoặc tự mở thân máy nếu pin nóng, phồng, có mùi lạ, nước vào máy hoặc dây sạc hư hỏng.',
  'Kiểm tra trạm và ổ điện trước để loại trừ việc trạm mất nguồn.\nLau khô tiếp điểm sạc, đặt robot thẳng trên trạm và chờ ít nhất vài phút.\nNhấn giữ nút nguồn theo hướng dẫn model, không nhấn liên tục nhiều nút cùng lúc.\nQuan sát đèn báo, âm báo và trạng thái pin trong ứng dụng nếu robot còn kết nối.\nRút robot khỏi trạm sau khi đã có dấu hiệu sạc để xem máy có giữ được nguồn không.\nGhi lại thời điểm tắt máy và tình trạng đèn để cung cấp cho kỹ thuật.',
  'Nếu máy chỉ sáng khi ở trên trạm, tắt ngay khi nhấc ra hoặc không có phản hồi sau khi đã sạc đúng cách, cần kiểm tra pin và mạch sạc. Mang robot kèm trạm đến nơi sửa chữa hoặc bảo hành.',
  0.70, 'trung bình', 'Hướng dẫn an toàn chung cho robot ' || manufacturer || '; không thay thế kiểm tra pin hoặc bo mạch.',
  '', '', '', 'general-service-guide'
FROM brands;

WITH brands(manufacturer, code) AS (
  VALUES
    ('Dreame', 'DRM'), ('MOVA', 'MOV'), ('Roborock', 'RBR'),
    ('ECOVACS', 'ECV'), ('Xiaomi', 'XMI'), ('Narwal', 'NRW'), ('Eufy', 'EUF')
)
INSERT OR REPLACE INTO symptom_references (
  record_id, manufacturer, device_type, model_scope, reported_code, symptom_key,
  title_vi, summary_vi, first_action_vi, safety_stop_vi, diagnostic_steps_vi,
  service_handoff_vi, confidence_score, confidence_label, model_scope_note_vi,
  source_name, source_url, source_accessed_at, publication_status
)
SELECT
  'GUIDE-' || code || '-SENSOR', manufacturer, 'robot_vacuum_mop', 'Tất cả model', '',
  'sensor-bumper-loop', 'Cảm biến hoặc cản va làm robot xoay vòng, đi bất thường',
  'Robot lùi, xoay vòng, đổi hướng liên tục hoặc dừng khi không có vật cản rõ ràng.',
  'Dừng lịch dọn, lau sạch cản va và các cảm biến ngoài thân rồi thử lại trên nền phẳng, khô.',
  'Không dùng lực đẩy cản va vào trong, không xịt dung dịch vào cảm biến và dừng máy nếu robot va đập mạnh liên tục.',
  'Tắt robot và lau khô cản va, cảm biến chống rơi, cảm biến ven tường và cửa sổ cảm biến dễ thấy.\nKiểm tra cản va có bị kẹt bởi bụi, miếng dán hoặc vật lạ ở mép hay không.\nĐặt robot ở một khoảng sàn trống, tránh gương sát sàn, chân bàn mảnh và thảm có tua dài để thử lại.\nKiểm tra bánh xe có trượt hoặc bị quấn tóc làm robot nhận sai hướng di chuyển.\nKhởi động lại robot trước khi tạo tác vụ mới.\nGhi lại video ngắn nếu robot vẫn xoay vòng để kỹ thuật xác định đúng biểu hiện.',
  'Nếu robot tiếp tục va mạnh, quay liên tục hoặc không đi thẳng trên nền trống, hãy ngừng chạy để tránh hư hại đồ đạc và mang máy đi kiểm tra cảm biến hoặc cơ cấu lái.',
  0.70, 'trung bình', 'Hướng dẫn chung cho robot ' || manufacturer || '; vị trí cảm biến và cản va khác nhau theo model.',
  '', '', '', 'general-service-guide'
FROM brands;
