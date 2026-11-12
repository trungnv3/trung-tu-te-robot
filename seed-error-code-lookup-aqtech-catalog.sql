-- Public lookup catalogue imported with permission from the source-site owner.
-- Run after migrations/0008_lookup_device_types.sql.

WITH catalog(device_type, manufacturer, model_name) AS (
  VALUES
    -- Robot hút bụi
    ('robot', 'Dreame', 'L10s Ultra'), ('robot', 'Dreame', 'L10 Prime'),
    ('robot', 'Dreame', 'L10s Pro Ultra'), ('robot', 'Dreame', 'D9'),
    ('robot', 'Dreame', 'D9 Pro'), ('robot', 'Dreame', 'D9 Max'),
    ('robot', 'Dreame', 'W10'), ('robot', 'Dreame', 'W10 Pro'),
    ('robot', 'Dreame', 'L10s Ultra Gen 2'), ('robot', 'Dreame', 'L10s Ultra Gen 3'),
    ('robot', 'Dreame', 'L10s Ultra Heat'), ('robot', 'Dreame', 'L10 Ultra'),
    ('robot', 'Dreame', 'L10 Pro'), ('robot', 'Dreame', 'D9 Max Gen 2'),
    ('robot', 'Dreame', 'D20 Ultra'), ('robot', 'Dreame', 'D30 Ultra'),
    ('robot', 'Dreame', 'D30 Ultra CE'), ('robot', 'Dreame', 'X30 Ultra'),
    ('robot', 'Dreame', 'X30 Master'), ('robot', 'Dreame', 'X40 Ultra'),
    ('robot', 'Dreame', 'X40 Master'), ('robot', 'Dreame', 'X50 Ultra'),
    ('robot', 'Dreame', 'X50 Pro Ultra'), ('robot', 'Dreame', 'X50 Master'),
    ('robot', 'Dreame', 'X60 Ultra'), ('robot', 'Dreame', 'X60 Master'),
    ('robot', 'Dreame', 'L20 Ultra'), ('robot', 'Dreame', 'L30s Ultra'),
    ('robot', 'Dreame', 'L40 Ultra'), ('robot', 'Dreame', 'L40s Ultra'),
    ('robot', 'Dreame', 'L50 Ultra CE'), ('robot', 'Dreame', 'L50s Pro Ultra'),
    ('robot', 'Dreame', 'S10'), ('robot', 'Dreame', 'S10 Pro'),
    ('robot', 'Dreame', 'S10 Plus'), ('robot', 'Dreame', 'S20'),
    ('robot', 'Dreame', 'Z10 Pro'), ('robot', 'Dreame', 'Z10 Station'),
    ('robot', 'Dreame', 'F20'), ('robot', 'Dreame', 'Matrix10 Ultra'),
    ('robot', 'Dreame', 'M10'), ('robot', 'Dreame', 'M10 Pro'),
    ('robot', 'Dreame', 'M10 Station'), ('robot', 'Dreame', 'M30 Pro'),
    ('robot', 'Dreame', 'M30s'), ('robot', 'Dreame', 'M40S'),
    ('robot', 'MOVA', 'P50 Ultra'), ('robot', 'MOVA', 'P10 Pro Ultra'),
    ('robot', 'MOVA', 'P10s Ultra'), ('robot', 'MOVA', 'E30 Ultra'),
    ('robot', 'MOVA', 'E40 Ultra'), ('robot', 'MOVA', 'E50 Ultra'),
    ('robot', 'MOVA', 'E50 Pro Ultra'), ('robot', 'MOVA', 'P70 Pro Ultra'),
    ('robot', 'MOVA', 'V50 Ultra'), ('robot', 'MOVA', 'V70 Ultra Complete'),
    ('robot', 'MOVA', 'S70 Roller'), ('robot', 'MOVA', 'S70 Ultra Roller'),
    ('robot', 'MOVA', 'Z50 Ultra'), ('robot', 'MOVA', 'Z60 Ultra Roller Complete'),
    ('robot', 'MOVA', 'Z70 Ultra Roller Complete'),
    ('robot', 'Roborock', 'S7'), ('robot', 'Roborock', 'S7 MaxV'),
    ('robot', 'Roborock', 'S8'), ('robot', 'Roborock', 'S8 MaxV'),
    ('robot', 'Roborock', 'S8 MaxV Ultra'), ('robot', 'Roborock', 'Q Revo'),
    ('robot', 'Roborock', 'Q Revo Pro'), ('robot', 'Roborock', 'Q Revo MaxV'),
    ('robot', 'Roborock', 'Q Revo Master'), ('robot', 'Roborock', 'Q Revo S'),
    ('robot', 'Roborock', 'Q Revo Slim'), ('robot', 'Roborock', 'Q Revo Curv'),
    ('robot', 'Roborock', 'Qrevo Curv 2 Flow'), ('robot', 'Roborock', 'Qrevo CurvX'),
    ('robot', 'Roborock', 'Qrevo Curv 2 Pro'), ('robot', 'Roborock', 'Qrevo Edge'),
    ('robot', 'Roborock', 'Qrevo Edge 2'), ('robot', 'Roborock', 'Qrevo EdgeT'),
    ('robot', 'Roborock', 'Q Revo Edge 5V1'), ('robot', 'Roborock', 'Q Revo 5AE'),
    ('robot', 'Roborock', 'QR 798'), ('robot', 'Roborock', 'Q7 Max'),
    ('robot', 'Roborock', 'Q7 TF'), ('robot', 'Roborock', 'Q7 TF+'),
    ('robot', 'Roborock', 'Q7 Pro Max'), ('robot', 'Roborock', 'Q7 Pro Max+'),
    ('robot', 'Roborock', 'Q10 PF'), ('robot', 'Roborock', 'Q10 PF+'),
    ('robot', 'Roborock', 'Q10 VF+'), ('robot', 'Roborock', 'Saros 10'),
    ('robot', 'Roborock', 'Saros 10R'), ('robot', 'Roborock', 'Saros 20'),
    ('robot', 'Roborock', 'Saros 20 Sonic'), ('robot', 'Roborock', 'Saros 20 Flow Complete'),
    ('robot', 'Roborock', 'Saros Z70'),
    ('robot', 'Ecovacs', 'X1 Omni'), ('robot', 'Ecovacs', 'X1'),
    ('robot', 'Ecovacs', 'X5 Hybrid'), ('robot', 'Ecovacs', 'X9 Pro Omni'),
    ('robot', 'Ecovacs', 'X8 Pro OMNI'), ('robot', 'Ecovacs', 'X10'),
    ('robot', 'Ecovacs', 'X11 OmniCyclone'), ('robot', 'Ecovacs', 'X11 Pro Omni'),
    ('robot', 'Ecovacs', 'T8'), ('robot', 'Ecovacs', 'T9'),
    ('robot', 'Ecovacs', 'T10'), ('robot', 'Ecovacs', 'T20'),
    ('robot', 'Ecovacs', 'T30'), ('robot', 'Ecovacs', 'T30 Pro OMNI'),
    ('robot', 'Ecovacs', 'T30C'), ('robot', 'Ecovacs', 'T50'),
    ('robot', 'Ecovacs', 'T50 Pro OMNI'), ('robot', 'Ecovacs', 'T80 OMNI'),
    ('robot', 'Ecovacs', 'T80 Max Omni'), ('robot', 'Ecovacs', 'T80S Omni'),
    ('robot', 'Ecovacs', 'T90 Pro Omni'), ('robot', 'Ecovacs', 'N30 Pro OMNI'),
    ('robot', 'Ecovacs', 'OZMO 950'), ('robot', 'Ecovacs', 'M85'),
    ('robot', 'Ecovacs', 'M88'), ('robot', 'Ecovacs', 'Deebot OZMO 610'),
    ('robot', 'Ecovacs', 'DD3G'), ('robot', 'Ecovacs', 'Deebot 600'),
    ('robot', 'Ecovacs', 'Deebot 600 (DO3G)'), ('robot', 'Ecovacs', 'Deebot Slim (DA60)'),
    ('robot', 'Ecovacs', 'N79'), ('robot', 'Ecovacs', 'N79S'),
    ('robot', 'Ecovacs', 'N79SE'), ('robot', 'Ecovacs', 'N79W'),
    ('robot', 'Xiaomi', 'X10 Plus'), ('robot', 'Xiaomi', 'X20 Plus'),
    ('robot', 'Xiaomi', 'X20 Pro'), ('robot', 'Xiaomi', 'X20 Max'),
    ('robot', 'Xiaomi', 'Mijia 1C'), ('robot', 'Xiaomi', 'Mijia 1T'),
    ('robot', 'Xiaomi', 'Mijia 2C'), ('robot', 'Xiaomi', 'Mijia Pro'),
    ('robot', 'Xiaomi', 'Mop 2S'), ('robot', 'Xiaomi', 'Mi Robot Vacuum'),
    ('robot', 'Xiaomi', 'Mi Robot Vacuum-Mop P'), ('robot', 'Xiaomi', 'Mijia 1S'),
    ('robot', 'Narwal', 'Freo X Ultra'), ('robot', 'Narwal', 'Freo Z10 Ultra'),
    ('robot', 'Narwal', 'Freo Z10'), ('robot', 'Narwal', 'Freo Z Ultra'),
    ('robot', 'Eufy', '11'), ('robot', 'Eufy', '11S'),
    ('robot', 'Eufy', '12'), ('robot', 'Eufy', '15C'),
    ('robot', 'Eufy', '25C'), ('robot', 'Eufy', '30'),
    ('robot', 'Eufy', '30C'), ('robot', 'Eufy', '35C'),
    ('robot', 'Eufy', 'G10'), ('robot', 'Eufy', 'G20'),
    ('robot', 'Eufy', 'G30'), ('robot', 'Eufy', 'G30 Hybrid'),
    ('robot', 'Eufy', 'G35+'), ('robot', 'Eufy', 'G40'),
    ('robot', 'Eufy', 'L70 Hybrid'), ('robot', 'Eufy', 'X8'),
    ('robot', 'Eufy', 'X8 Hybrid'), ('robot', 'Eufy', 'X8 Pro'),
    ('robot', 'Eufy', 'X8 Pro SES'), ('robot', 'Eufy', 'X10 Pro Omni'),
    ('robot', 'Eufy', 'Omni C20'), ('robot', 'Eufy', 'E25'),
    ('robot', 'Eufy', 'E28'), ('robot', 'Eufy', 'S1 Pro'),

    -- Cây lau nhà hút bụi cầm tay
    ('floor_washer', 'Dreame', 'H11'), ('floor_washer', 'Dreame', 'H11 Max'),
    ('floor_washer', 'Dreame', 'H12 Core'), ('floor_washer', 'Dreame', 'H12'),
    ('floor_washer', 'Dreame', 'H12 Pro'), ('floor_washer', 'Dreame', 'H12 Dual'),
    ('floor_washer', 'Dreame', 'H12 Pro Plus'), ('floor_washer', 'Dreame', 'H12S AE'),
    ('floor_washer', 'Dreame', 'H13'), ('floor_washer', 'Dreame', 'H13 Pro'),
    ('floor_washer', 'Dreame', 'H13 FlexReach'), ('floor_washer', 'Dreame', 'H13 Dual FlexReach'),
    ('floor_washer', 'Dreame', 'H13S FlexReach'), ('floor_washer', 'Dreame', 'H14'),
    ('floor_washer', 'Dreame', 'H14 Pro'), ('floor_washer', 'Dreame', 'H14 Ultra'),
    ('floor_washer', 'Dreame', 'H14 Station'), ('floor_washer', 'Dreame', 'H15'),
    ('floor_washer', 'Dreame', 'H15 Pro'), ('floor_washer', 'Dreame', 'H15 Pro Heat'),
    ('floor_washer', 'Dreame', 'H15 Mix'), ('floor_washer', 'Dreame', 'H16 Pro Steam'),
    ('floor_washer', 'Dreame', 'H16 Pro TriForce'), ('floor_washer', 'Dreame', 'H16 Steam'),
    ('floor_washer', 'Dreame', 'H16 GT'), ('floor_washer', 'Dreame', 'H16 FlexReach'),
    ('floor_washer', 'Dreame', 'M12'), ('floor_washer', 'Dreame', 'M12 Combo'),
    ('floor_washer', 'Dreame', 'V18S Aqua'), ('floor_washer', 'Dreame', 'W10S'),
    ('floor_washer', 'Tineco', 'Floor One S3'), ('floor_washer', 'Tineco', 'Floor One S5'),
    ('floor_washer', 'Tineco', 'Floor One S5 Pro'), ('floor_washer', 'Tineco', 'Floor One 2.0 LCD'),
    ('floor_washer', 'Tineco', 'Floor One 2.0 LED'), ('floor_washer', 'Tineco', 'Floor One S6 Stretch Pro'),
    ('floor_washer', 'Tineco', 'Floor One S6 Stretch Steam'), ('floor_washer', 'Tineco', 'Floor One S7'),
    ('floor_washer', 'Tineco', 'Floor One S7 Pro'), ('floor_washer', 'Tineco', 'Floor One S7 Steam'),
    ('floor_washer', 'Tineco', 'Floor One S7 Combo'), ('floor_washer', 'Tineco', 'Floor One S7 Max Pro'),
    ('floor_washer', 'Tineco', 'Floor One S7 Stretch Steam'), ('floor_washer', 'Tineco', 'Floor One S7 HotJet'),
    ('floor_washer', 'Tineco', 'Floor One Switch S7'), ('floor_washer', 'Tineco', 'Floor One S9 Artist Pro'),
    ('floor_washer', 'Tineco', 'Floor One S9 Artist'), ('floor_washer', 'Tineco', 'Floor One S9 Artist Steam Pro'),
    ('floor_washer', 'Tineco', 'Floor One Station S9'), ('floor_washer', 'Tineco', 'Floor One i5 Stretch Plus'),
    ('floor_washer', 'Tineco', 'Floor One i6 Stretch Plus'), ('floor_washer', 'Tineco', 'Floor One i7 Fold'),
    ('floor_washer', 'Tineco', 'Floor One i7 Steam'),
    ('floor_washer', 'MOVA', 'K20'), ('floor_washer', 'MOVA', 'K20 Pro'),
    ('floor_washer', 'MOVA', 'K30'), ('floor_washer', 'MOVA', 'K30 Pro'),
    ('floor_washer', 'MOVA', 'M10'), ('floor_washer', 'MOVA', 'M10 Pro'),
    ('floor_washer', 'MOVA', 'M10 Station'), ('floor_washer', 'MOVA', 'X4 Pro'),
    ('floor_washer', 'MOVA', 'M50 Ultra'),
    ('floor_washer', 'Roborock', 'F25'), ('floor_washer', 'Roborock', 'F25 RT'),
    ('floor_washer', 'Roborock', 'F25 GT'), ('floor_washer', 'Roborock', 'F25 LT'),
    ('floor_washer', 'Roborock', 'F25 Ultra'), ('floor_washer', 'Roborock', 'F25 Ace'),
    ('floor_washer', 'Roborock', 'F25 Ace Combo'), ('floor_washer', 'Roborock', 'F25 ACE Pro'),
    ('floor_washer', 'Roborock', 'F25 Pro Turbo'), ('floor_washer', 'Roborock', 'F25 Steam'),
    ('floor_washer', 'Roborock', 'F25 Pure'), ('floor_washer', 'Roborock', 'Flexi Lite'),
    ('floor_washer', 'Roborock', 'Flexi Pro'), ('floor_washer', 'Roborock', 'Dyad'),
    ('floor_washer', 'Roborock', 'Dyad Pro'), ('floor_washer', 'Roborock', 'Dyad Combo'),
    ('floor_washer', 'Roborock', 'A30 Pro'), ('floor_washer', 'Roborock', 'A30 Pro Combo'),
    ('floor_washer', 'Roborock', 'A30 Pro Steam'), ('floor_washer', 'Roborock', 'A30 Pro Ultra'),
    ('floor_washer', 'Narwal', 'S20'), ('floor_washer', 'Narwal', 'S20 Pro'),
    ('floor_washer', 'Narwal', 'S30 Pro'),

    -- Máy hút bụi cầm tay
    ('stick_vacuum', 'Dreame', 'V11'), ('stick_vacuum', 'Dreame', 'V11 Pro'),
    ('stick_vacuum', 'Dreame', 'V12'), ('stick_vacuum', 'Dreame', 'V12 Pro'),
    ('stick_vacuum', 'Dreame', 'V12s'), ('stick_vacuum', 'Dreame', 'V18s'),
    ('stick_vacuum', 'Dreame', 'R10'), ('stick_vacuum', 'Dreame', 'R10 Pro'),
    ('stick_vacuum', 'Dreame', 'R20'), ('stick_vacuum', 'Dreame', 'T10'),
    ('stick_vacuum', 'Dreame', 'T12'), ('stick_vacuum', 'Dreame', 'T20'),
    ('stick_vacuum', 'Dreame', 'Z10 Station'), ('stick_vacuum', 'Dreame', 'D20 Pro'),
    ('stick_vacuum', 'Dreame', 'D20 Aura'), ('stick_vacuum', 'Dreame', 'Air'),
    ('stick_vacuum', 'Dreame', 'Z30 AquaCycle'), ('stick_vacuum', 'Dreame', 'Z30 Ultra'),
    ('stick_vacuum', 'Dreame', 'Z30'),
    ('stick_vacuum', 'Roborock', 'H5'), ('stick_vacuum', 'Roborock', 'H6'),
    ('stick_vacuum', 'Roborock', 'H7'), ('stick_vacuum', 'Roborock', 'H60'),
    ('stick_vacuum', 'Roborock', 'H60 Ultra'), ('stick_vacuum', 'Roborock', 'H60 Hub Pro'),
    ('stick_vacuum', 'Roborock', 'H60 Hub Ultra'),
    ('stick_vacuum', 'Tineco', 'Pure One Mini S4'), ('stick_vacuum', 'Tineco', 'Go Mini'),
    ('stick_vacuum', 'Tineco', 'A30'), ('stick_vacuum', 'Tineco', 'A30 Pro'),
    ('stick_vacuum', 'Tineco', 'A30 Pro Combo'), ('stick_vacuum', 'Tineco', 'A30 Pro Steam'),
    ('stick_vacuum', 'Tineco', 'A30 Pro Ultra'),
    ('stick_vacuum', 'MOVA', 'I10'), ('stick_vacuum', 'MOVA', 'S4 Detect'),
    ('stick_vacuum', 'MOVA', 'D10 Max'), ('stick_vacuum', 'MOVA', 'D20'),
    ('stick_vacuum', 'Xiaomi', '1C'), ('stick_vacuum', 'Xiaomi', '1S'),
    ('stick_vacuum', 'Xiaomi', 'G10'), ('stick_vacuum', 'Xiaomi', 'G20'),
    ('stick_vacuum', 'Xiaomi', 'G30 Ultra'), ('stick_vacuum', 'Xiaomi', 'G20 Lite')
)
INSERT OR IGNORE INTO lookup_models (
  model_id, manufacturer, device_type, model_name, guide_group
)
SELECT
  'AQT-' || device_type || '-' || manufacturer || '-' || model_name,
  manufacturer,
  device_type,
  model_name,
  'aqtech-' || device_type || '-' || lower(manufacturer)
FROM catalog;

-- Shared code map published for the Roborock S and Q robot families.
WITH codes(error_code, error_title_vi, description_vi, first_action_vi, diagnostic_steps_vi, service_handoff_vi) AS (
  VALUES
    ('Error 1', 'Lidar bị chặn', 'Cụm laser không thể quét không gian bình thường nên robot khó định vị.', 'Lau khô khu vực Lidar, bỏ vật cản và khởi động lại robot.', 'Kiểm tra xem nắp Lidar có bị vật lạ đè hoặc tóc quấn không.\nLau cửa sổ laser bằng khăn mềm, khô.\nĐặt robot tại vị trí trống rồi khởi động lại.\nChạy thử ngắn để xác nhận robot tạo định vị trở lại.', 'Nếu cụm Lidar không quay hoặc lỗi quay lại ngay sau khi làm sạch, dừng sử dụng và mang máy đi kiểm tra.'),
    ('Error 2', 'Cản trước bị kẹt', 'Cản trước không trở về vị trí bình thường sau khi va chạm.', 'Nhấn nhẹ hai đầu cản trước và lấy dị vật ở khe cản.', 'Tắt robot trước khi kiểm tra.\nKiểm tra cản có bị kẹt vì tóc, bụi hoặc vỏ máy lệch không.\nNhấn và thả nhẹ cản tại nhiều điểm.\nKhởi động lại rồi thử chạy ở nền trống.', 'Không cố bẩy cản hoặc tháo vỏ nếu cản không hồi vị hay robot tiếp tục báo lỗi.'),
    ('Error 3', 'Bánh xe bị treo', 'Robot nhận thấy bánh dẫn động không chạm đều mặt sàn.', 'Đặt robot xuống nền phẳng và kiểm tra hai bánh dẫn động.', 'Đặt robot trên bề mặt cứng, phẳng.\nKiểm tra tóc hoặc rác quấn quanh trục bánh.\nẤn từng bánh xuống rồi thả để kiểm tra độ đàn hồi.\nChạy lại sau khi làm sạch.', 'Nếu bánh không đàn hồi, kêu cọ sát hoặc lỗi lặp lại, nên kiểm tra cụm bánh xe.'),
    ('Error 4', 'Lỗi cảm biến chống rơi', 'Cảm biến phía dưới bị bẩn hoặc đọc bề mặt không chính xác.', 'Lau các mắt cảm biến đáy máy bằng khăn mềm, khô.', 'Tắt robot và lau sạch toàn bộ mắt cảm biến dưới đáy.\nĐặt robot trên nền sáng, phẳng.\nKhông thử sát cầu thang.\nKhởi động lại và chạy thử.', 'Dừng dùng gần bậc thang nếu cảnh báo còn lặp lại sau khi vệ sinh.'),
    ('Error 5', 'Chổi chính bị kẹt', 'Chổi chính hoặc trục chổi bị tóc và rác làm cản trở.', 'Tháo chổi chính, gỡ tóc/rác và lắp lại đúng khớp.', 'Tắt robot.\nTháo nắp chổi và chổi chính.\nLàm sạch hai đầu trục và hốc chổi.\nLắp lại chổi cùng nắp chắn đúng khớp rồi chạy thử.', 'Ngừng chạy nếu trục gãy, chổi không quay hoặc có mùi khét.'),
    ('Error 6', 'Chổi cạnh bị kẹt', 'Chổi cạnh bị quấn tóc, dị vật hoặc không lắp khít.', 'Tháo chổi cạnh để gỡ tóc và kiểm tra trục quay.', 'Tắt robot.\nTháo chổi cạnh.\nGỡ tóc, sợi chỉ và bụi tại trục.\nLắp lại chổi chắc chắn rồi chạy thử.', 'Nếu chổi không quay sau khi đã làm sạch, không tự tháo sâu vào mô-tơ chổi.'),
    ('Error 7', 'Bánh xe bị kẹt', 'Bánh dẫn động gặp vật cản hoặc khó quay.', 'Lật robot, loại bỏ dị vật quanh bánh xe và thử lại.', 'Tắt robot.\nGỡ tóc/rác quanh hai bánh.\nKiểm tra bánh có bị vật cứng chèn không.\nĐặt máy xuống nền phẳng và chạy thử.', 'Mang máy kiểm tra nếu bánh bị bó, trượt liên tục hoặc phát tiếng cơ khí lớn.'),
    ('Error 8', 'Robot bị mắc kẹt', 'Robot không tìm được đường tiếp tục hoặc bị chèn vào vật cản.', 'Đưa robot ra vùng trống và dọn vật cản quanh bánh/chổi.', 'Di chuyển robot ra khu vực thoáng.\nKiểm tra bánh, chổi và gầm máy.\nXem lại dây điện, mép thảm và đồ thấp dễ mắc.\nChạy lại từ vị trí trống.', 'Không kéo mạnh robot khi đang bị kẹt vào dây hoặc vật có thể làm hỏng cảm biến.'),
    ('Error 9', 'Chưa lắp hộp bụi', 'Robot không nhận diện được hộp bụi hoặc hộp chưa lắp khít.', 'Tháo và lắp lại hộp bụi cùng bộ lọc.', 'Tắt robot.\nĐổ rác và kiểm tra hộp bụi không bị biến dạng.\nLắp bộ lọc khô đúng chiều.\nĐẩy hộp bụi đến khi khớp rồi khởi động lại.', 'Không dùng hộp bụi nứt, ướt hoặc hỏng chốt giữ.'),
    ('Error 10', 'Lọc tắc hoặc còn ướt', 'Luồng gió qua bộ lọc bị cản trở.', 'Làm sạch bộ lọc và để khô hoàn toàn trước khi lắp lại.', 'Tháo bộ lọc theo hướng dẫn model.\nGõ nhẹ hoặc rửa nếu model cho phép.\nĐể khô hoàn toàn.\nLắp lại rồi thử chạy.', 'Không vận hành với bộ lọc ướt; thay lọc nếu đã biến dạng hoặc mùi ẩm kéo dài.'),
    ('Error 11', 'Từ trường mạnh', 'Robot phát hiện vùng từ trường có thể làm sai định hướng.', 'Di chuyển robot khỏi vật có nam châm hoặc đế kim loại mạnh.', 'Tắt robot.\nDi chuyển máy khỏi chân đế, nam châm hoặc vật kim loại mạnh.\nKhởi động lại ở vị trí khác.\nKiểm tra lại tường ảo hay phụ kiện từ tính.', 'Nếu lỗi xuất hiện ở nhiều vị trí không có vật từ tính, cần kiểm tra cảm biến định hướng.'),
    ('Error 12', 'Pin yếu', 'Mức pin không đủ để hoàn tất tác vụ hiện tại.', 'Cho robot về trạm, kiểm tra biểu tượng sạc và sạc đầy.', 'Đặt robot lên trạm đúng tiếp điểm.\nXác nhận trạm có điện.\nChờ một khoảng để kiểm tra trạng thái sạc.\nSau khi đủ pin, chạy thử ngắn.', 'Dừng dùng nếu pin nóng, phồng, có mùi bất thường hoặc robot tắt ngay khi rời trạm.'),
    ('Error 13', 'Lỗi sạc', 'Robot không nhận hoặc không duy trì được quá trình sạc.', 'Lau khô tiếp điểm robot và trạm, sau đó kiểm tra nguồn trạm.', 'Kiểm tra dây nguồn và đèn trạm.\nLau tiếp điểm bằng khăn khô.\nDọn vùng trạm để robot vào thẳng.\nĐặt robot đúng vị trí rồi quan sát trạng thái sạc.', 'Mang cả robot và trạm đi kiểm tra nếu vẫn không sạc sau các bước cơ bản.'),
    ('Error 14', 'Lỗi pin', 'Hệ thống phát hiện trạng thái pin bất thường.', 'Dừng sạc khi pin nóng và để máy nguội ở nơi thông thoáng.', 'Ngừng vận hành.\nKiểm tra dấu hiệu nóng, phồng hoặc mùi lạ.\nĐể máy nguội tự nhiên.\nKhông tự mở khoang pin.', 'Không tiếp tục dùng hoặc sạc nếu có dấu hiệu pin bất thường; cần kiểm tra chuyên môn.'),
    ('Error 15', 'Cảm biến tường bẩn', 'Cảm biến bên hông bị bụi che hoặc hoạt động không ổn định.', 'Lau sạch cảm biến bên hông bằng khăn mềm khô.', 'Tắt robot.\nLau cửa sổ cảm biến bên hông.\nKiểm tra không có tem hoặc vết xước che mắt cảm biến.\nKhởi động lại và chạy thử sát tường.', 'Nếu robot vẫn đi sát tường bất thường, cần kiểm tra cảm biến.'),
    ('Error 16', 'Robot bị nghiêng', 'Robot không ở tư thế vận hành bằng phẳng.', 'Đặt robot trên nền phẳng rồi kiểm tra bánh xe và gầm máy.', 'Đặt robot xuống mặt sàn phẳng.\nLấy vật lạ kẹt dưới gầm.\nKiểm tra hai bánh có hồi vị đều.\nKhởi động lại và chạy thử.', 'Không tiếp tục chạy nếu thân máy bị nghiêng do bánh xe không hồi vị.'),
    ('Error 17', 'Lỗi mô-đun chổi cạnh', 'Cụm chổi cạnh không phản hồi bình thường.', 'Tháo chổi cạnh, làm sạch trục và lắp lại.', 'Tắt robot.\nTháo chổi cạnh.\nGỡ tóc, chỉ và bụi trong hốc trục.\nLắp lại rồi thử chạy.', 'Nếu lỗi lặp lại dù chổi sạch và lắp đúng, cần kiểm tra mô-tơ chổi.'),
    ('Error 18', 'Lỗi quạt hút', 'Đường gió hoặc mô-tơ quạt hút có thể bị cản.', 'Vệ sinh hộp bụi, bộ lọc và cửa hút trước khi chạy lại.', 'Tắt robot.\nĐổ hộp bụi và làm sạch lọc.\nKiểm tra cửa hút, chổi chính và đường gió dễ tiếp cận.\nLắp lại bộ lọc khô rồi chạy thử.', 'Dừng máy nếu tiếng mô-tơ rất lớn, có mùi khét hoặc lực hút mất hoàn toàn.'),
    ('Error 19', 'Lỗi kết nối dock sạc', 'Robot không giao tiếp bình thường với trạm sạc.', 'Kiểm tra nguồn trạm, tiếp điểm và khoảng trống phía trước trạm.', 'Khởi động lại trạm và robot.\nLau tiếp điểm.\nĐặt trạm trên nền phẳng sát tường.\nDọn vật cản trước trạm rồi cho robot về lại.', 'Mang cả robot lẫn trạm đi kiểm tra nếu không thể ghép hoặc sạc ổn định.'),
    ('Error 21', 'Cản đứng bị ấn', 'Cảm biến cản đứng hoặc cụm cản bị giữ ở vị trí kích hoạt.', 'Kiểm tra khe cản và bỏ dị vật dễ thấy.', 'Tắt robot.\nKiểm tra quanh cản trước và phần vỏ.\nLấy tóc, bụi hoặc vật kẹt.\nNhấn/thả nhẹ cản rồi thử lại.', 'Không cạy hoặc tháo vỏ nếu cản không hồi vị.'),
    ('Error 22', 'Lỗi định vị dock', 'Robot không nhận diện được vị trí trạm.', 'Lau vùng tín hiệu của trạm và đặt robot cách trạm một đoạn ngắn để thử lại.', 'Kiểm tra trạm có điện.\nLau mặt trước trạm và cảm biến robot.\nDọn khoảng trống trước trạm.\nGọi robot về từ khoảng cách ngắn.', 'Nếu robot không định vị trạm ở mọi vị trí, nên kiểm tra hệ thống tín hiệu.'),
    ('Error 23', 'Không về được dock', 'Robot không tìm hoặc không ghép chính xác vào trạm.', 'Dọn lối đi, lau cảm biến/trạm và gọi robot về từ vị trí gần.', 'Dọn dây điện và vật cản.\nLau cảm biến cùng tiếp điểm.\nĐặt trạm trên nền khô, phẳng.\nCho robot về trạm từ khoảng một đến hai mét.', 'Nếu robot vào rồi tự lùi ra hoặc lặp lại nhiều lần, nên kiểm tra robot và trạm cùng nhau.'),
    ('Error 24', 'Khu vực cấm hoặc tường ảo', 'Robot nhận thấy vùng bị hạn chế trong bản đồ.', 'Mở bản đồ trong ứng dụng để kiểm tra vùng cấm hoặc tường ảo.', 'Kiểm tra bản đồ hiện dùng.\nTạm tắt vùng cấm hoặc tường ảo gần robot.\nĐặt robot ra ngoài khu vực bị chặn.\nChạy lại tác vụ.', 'Khôi phục bản đồ hoặc liên hệ hỗ trợ nếu bản đồ lỗi liên tục.'),
    ('Error 26', 'Cảm biến tường bẩn', 'Cảm biến bên hông bị bụi che.', 'Lau khô cảm biến bên hông và thử chạy dọc tường.', 'Tắt robot.\nLau sạch mặt cảm biến bên hông.\nKiểm tra không có miếng dán che cảm biến.\nKhởi động lại và chạy thử.', 'Cần kiểm tra cảm biến nếu robot vẫn xoay vòng hoặc đi sát tường bất thường.'),
    ('Error 27', 'Hệ thống VibraRise bị kẹt', 'Cụm nâng hoặc rung giẻ không di chuyển bình thường.', 'Tháo giẻ, làm sạch khu vực lắp giẻ và thử lại.', 'Tắt robot.\nTháo giẻ lau theo hướng dẫn.\nLau sạch tóc, bụi và vật lạ quanh cụm giẻ.\nLắp lại đúng khớp và chạy thử.', 'Không cố kéo cụm nâng giẻ; mang máy kiểm tra nếu cơ cấu vẫn không hoạt động.'),
    ('Error 28', 'Robot ở trên thảm', 'Robot nhận diện bề mặt thảm trong khi thực hiện tác vụ không phù hợp.', 'Đưa robot ra nền cứng hoặc điều chỉnh cài đặt xử lý thảm trong ứng dụng.', 'Đặt robot lên nền cứng.\nKiểm tra cài đặt thảm và vùng cấm.\nTháo giẻ nếu model yêu cầu.\nChạy lại tác vụ.', 'Không ép robot lau thảm khi model không hỗ trợ.'),
    ('Error 42', 'Chổi bảo trì của trạm bị kẹt', 'Chổi vệ sinh trong trạm bị tóc hoặc cặn bẩn làm kẹt.', 'Ngắt điện trạm rồi làm sạch chổi bảo trì theo hướng dẫn model.', 'Rút điện trạm.\nTháo phần chổi bảo trì nếu hướng dẫn model cho phép.\nGỡ tóc và cặn bẩn.\nLắp lại đúng vị trí rồi cấp điện thử.', 'Không thao tác sâu trong trạm hoặc với đường nước nếu chổi vẫn không hoạt động.'),
    ('E39', 'Lỗi docking hoặc dấu định vị của trạm', 'Robot không khớp vị trí hoặc không nhận được dấu định vị của trạm.', 'Lau vùng tín hiệu, tiếp điểm và đặt lại trạm trên nền khô phẳng.', 'Kiểm tra nguồn trạm.\nLau cảm biến và tiếp điểm.\nDọn khoảng trống trước trạm.\nĐặt robot gần trạm rồi gọi về lại.', 'Nếu lỗi lặp lại sau khi khởi động lại cả trạm và robot, nên kiểm tra hệ thống docking.')
)
INSERT OR REPLACE INTO error_codes (
  record_id, manufacturer, device_type, model_scope, error_code, error_title_vi,
  description_vi, first_action_vi, diagnostic_steps_vi, service_handoff_vi,
  confidence_score, confidence_label, model_scope_note_vi, source_name, source_url,
  source_accessed_at, publication_status
)
SELECT
  'AQT-RBR-' || replace(error_code, ' ', '-'),
  'Roborock', 'robot', 'Tất cả model', error_code, error_title_vi,
  description_vi, first_action_vi, diagnostic_steps_vi, service_handoff_vi,
  0.85, 'cao', 'Bảng mã dùng cho nhóm robot Roborock S và Q; đối chiếu thông báo trên máy trước khi thao tác.',
  'AQTECH lookup data (licensed)', 'https://aqtech.com.vn/sua-chua-robot-hut-bui/',
  '2026-11-07', 'licensed-reference'
FROM codes;

-- Detailed, safe first checks shared by all catalogued floor-washer models.
WITH brands(manufacturer) AS (
  VALUES ('Dreame'), ('MOVA'), ('Roborock'), ('Tineco'), ('Narwal')
), guides(symptom_key, title_vi, summary_vi, first_action_vi, safety_stop_vi, diagnostic_steps_vi, service_handoff_vi) AS (
  VALUES
    ('water-dry-roller', 'Không ra nước, con lăn khô khi lau', 'Máy đang chạy nhưng con lăn khô hoặc lượng nước ra rất ít.', 'Kiểm tra bình nước sạch, nắp bình và chế độ cấp nước.', 'Dừng máy nếu nước rò vào phần điện hoặc thân máy nóng bất thường.', 'Tắt máy.\nKiểm tra bình nước sạch đã đầy và lắp kín.\nLàm sạch lỗ cấp nước dễ tiếp cận và con lăn.\nLắp lại bình rồi thử ở mức nước phù hợp.\nChạy tự làm sạch nếu model có chức năng này.', 'Nếu vẫn không cấp nước hoặc có rò nước, không tự tháo bơm hay đường nước bên trong.'),
    ('dirty-water-weak-suction', 'Nước bẩn không hút lên hoặc hút yếu', 'Sàn còn đọng nước, bình nước bẩn không thu hồi hoặc máy hút yếu.', 'Đổ bình nước bẩn, làm sạch lọc và kiểm tra đường hút dễ tiếp cận.', 'Dừng máy nếu có tiếng mô-tơ lớn, mùi khét hoặc nước rò ra khe thoát gió.', 'Tắt máy.\nĐổ và rửa bình nước bẩn.\nLàm sạch lưới/lọc theo hướng dẫn model.\nKiểm tra ống và cửa hút có tóc hoặc cặn.\nLắp lại bình đúng khớp rồi chạy thử.', 'Không tiếp tục dùng nếu nước đi vào khe thoát gió hoặc lực hút mất hoàn toàn.'),
    ('roller-jam', 'Con lăn kẹt hoặc không quay', 'Con lăn bị tóc/rác quấn, báo chưa lắp hoặc quay yếu.', 'Tắt máy, tháo con lăn theo hướng dẫn rồi gỡ tóc và rác.', 'Không chạm vào con lăn khi máy đang chạy hoặc đang tự làm sạch.', 'Tắt máy.\nTháo con lăn và nắp che.\nGỡ tóc/rác tại con lăn, trục và lưỡi cạp.\nLắp đúng vị trí.\nKhởi động và thử lại.', 'Nếu trục gãy, con lăn không quay hoặc có tiếng cơ khí lớn, cần kiểm tra kỹ thuật.'),
    ('charge-no-power', 'Không sạc, sạc chậm hoặc không lên nguồn', 'Máy không phản hồi, sạc chập chờn hoặc màn hình không sáng khi sạc.', 'Kiểm tra ổ điện, bộ sạc/trạm và tiếp điểm đã khô sạch.', 'Dừng sạc ngay nếu pin nóng, phồng, mùi lạ hoặc có nước tại khu vực điện.', 'Kiểm tra nguồn điện và đầu cắm.\nLau khô tiếp điểm.\nĐặt máy đúng vị trí trên trạm.\nChờ vài phút để kiểm tra trạng thái sạc.\nKhởi động lại sau khi pin đủ.', 'Không tự mở pin hoặc bo mạch; mang cả máy và bộ sạc đi kiểm tra nếu vẫn không sạc.'),
    ('self-clean-failed', 'Không bật được hoặc không hoàn tất tự làm sạch', 'Chu trình tự làm sạch không bắt đầu hoặc kết thúc bất thường.', 'Kiểm tra bình nước, con lăn và máy đã đặt đúng trạm.', 'Rút điện trạm trước khi vệ sinh khu vực có tiếp điểm hoặc nước.', 'Đổ bình nước bẩn.\nKiểm tra bình sạch và bình bẩn lắp đúng.\nLàm sạch con lăn, khay và vị trí đặt máy.\nĐặt máy chắc vào trạm.\nThử lại chu trình tự làm sạch.', 'Dừng thao tác nếu trạm rò nước hoặc có tiếng bất thường kéo dài.'),
    ('leakage', 'Rò nước hoặc có nước tại khe thoát gió', 'Nước xuất hiện ngoài bình, đầu lau hoặc gần khu vực thông gió.', 'Tắt máy, dựng thẳng và lau khô ngay phần nước rò.', 'Không tiếp tục sạc hay chạy máy khi nước đã chạm vùng điện hoặc khe thoát gió.', 'Tắt máy.\nTháo và kiểm tra bình nước, gioăng cùng nắp.\nLau khô bên ngoài máy.\nKhông nghiêng máy quá mức.\nChỉ thử lại khi máy khô hoàn toàn.', 'Nếu nước đã vào khe thoát gió hoặc rò lặp lại, cần kiểm tra chuyên môn.')
)
INSERT OR REPLACE INTO symptom_references (
  record_id, manufacturer, device_type, model_scope, reported_code, symptom_key,
  title_vi, summary_vi, first_action_vi, safety_stop_vi, diagnostic_steps_vi,
  service_handoff_vi, confidence_score, confidence_label, model_scope_note_vi,
  source_name, source_url, source_accessed_at, publication_status
)
SELECT
  'AQT-FW-' || lower(replace(brands.manufacturer, ' ', '-')) || '-' || guides.symptom_key,
  brands.manufacturer, 'floor_washer', 'Tất cả model', '', guides.symptom_key,
  guides.title_vi, guides.summary_vi, guides.first_action_vi, guides.safety_stop_vi,
  guides.diagnostic_steps_vi, guides.service_handoff_vi,
  0.78, 'trung bình', 'Hướng dẫn kiểm tra ban đầu cho cây lau nhà hút bụi; thao tác theo đúng tài liệu model.',
  'AQTECH lookup data (licensed)', 'https://aqtech.com.vn/sua-chua-robot-hut-bui/',
  '2026-11-07', 'licensed-reference'
FROM brands CROSS JOIN guides;

-- Older seed data used an all-caps spelling. Keep one public brand name.
UPDATE error_codes SET manufacturer = 'Ecovacs' WHERE manufacturer = 'ECOVACS';
UPDATE symptom_references SET manufacturer = 'Ecovacs' WHERE manufacturer = 'ECOVACS';
UPDATE lookup_models SET manufacturer = 'Ecovacs' WHERE manufacturer = 'ECOVACS';

-- Detailed, safe first checks shared by all catalogued stick-vacuum models.
WITH brands(manufacturer) AS (
  VALUES ('Dreame'), ('MOVA'), ('Roborock'), ('Tineco'), ('Xiaomi')
), guides(symptom_key, title_vi, summary_vi, first_action_vi, safety_stop_vi, diagnostic_steps_vi, service_handoff_vi) AS (
  VALUES
    ('weak-suction', 'Hút yếu, bỏ sót bụi hoặc báo tắc đường gió', 'Lực hút giảm hoặc máy báo tắc đường gió.', 'Đổ hộp bụi, làm sạch lọc và kiểm tra đầu hút.', 'Dừng máy nếu mô-tơ phát tiếng lớn, mùi khét hoặc nóng bất thường.', 'Tắt máy.\nĐổ hộp bụi.\nLàm sạch lọc theo hướng dẫn model và để khô hoàn toàn.\nKiểm tra ống, đầu hút và cửa hút có dị vật.\nLắp lại rồi thử ở chế độ thấp.', 'Không dùng máy với lọc ướt hoặc khi đường gió vẫn bị tắc.'),
    ('overheat-cutoff', 'Tự ngắt giữa chừng hoặc báo quá nhiệt', 'Máy dừng khi vận hành do quá nhiệt hoặc luồng gió bị cản.', 'Tắt máy và để nguội hoàn toàn trước khi kiểm tra lọc/đường gió.', 'Không khởi động lại liên tục khi máy nóng hoặc có mùi lạ.', 'Tắt máy.\nĐể máy nguội tự nhiên.\nLàm sạch lọc và đường gió.\nKiểm tra đầu hút có kẹt tóc/rác.\nChỉ chạy thử lại khi máy đã nguội.', 'Nếu máy tiếp tục tự ngắt sau khi làm sạch và để nguội, cần kiểm tra quạt hoặc pin.'),
    ('charge-power', 'Không sạc hoặc không lên nguồn', 'Máy không phản hồi nút nguồn hoặc không nhận sạc.', 'Kiểm tra ổ điện, bộ sạc/trạm và tiếp điểm đã khô sạch.', 'Dừng sạc nếu pin nóng, phồng, mùi khét hoặc có dấu hiệu rò điện.', 'Kiểm tra đầu cắm và ổ điện.\nLau khô tiếp điểm.\nĐặt máy đúng vị trí trạm nếu có.\nChờ vài phút để kiểm tra trạng thái sạc.\nKhởi động lại khi pin đủ.', 'Không tự tháo pin hoặc bo mạch khi máy không lên nguồn.'),
    ('roller-head', 'Chổi lăn ở đầu hút không quay hoặc kêu lạ', 'Đầu hút bị tóc/rác quấn hoặc cụm chổi không quay bình thường.', 'Tắt máy, tháo chổi lăn theo hướng dẫn và gỡ tóc/rác.', 'Không chạm vào chổi lăn khi máy đang chạy.', 'Tắt máy.\nTháo chổi lăn.\nGỡ tóc, chỉ và bụi ở hai đầu trục.\nLắp lại đúng khớp.\nKhởi động và thử lại.', 'Nếu đầu hút không quay sau khi làm sạch hoặc có tiếng cơ khí lớn, cần kiểm tra mô-tơ đầu hút.'),
    ('short-runtime', 'Pin nhanh hết hoặc thời gian chạy rất ngắn', 'Máy giảm thời gian hoạt động hoặc tắt khi còn báo pin.', 'Sạc đầy bằng bộ sạc phù hợp rồi thử ở mức công suất thấp.', 'Ngừng dùng nếu pin nóng, phồng hay có mùi lạ.', 'Sạc đầy.\nKiểm tra lọc và đầu hút không bị tắc.\nThử chạy ở mức hút thấp.\nQuan sát thời gian chạy và trạng thái pin.\nĐảm bảo bộ sạc/trạm đúng loại.', 'Nếu thời gian chạy vẫn rất ngắn hoặc máy tắt đột ngột, cần kiểm tra pin và mạch sạc.')
)
INSERT OR REPLACE INTO symptom_references (
  record_id, manufacturer, device_type, model_scope, reported_code, symptom_key,
  title_vi, summary_vi, first_action_vi, safety_stop_vi, diagnostic_steps_vi,
  service_handoff_vi, confidence_score, confidence_label, model_scope_note_vi,
  source_name, source_url, source_accessed_at, publication_status
)
SELECT
  'AQT-SV-' || lower(replace(brands.manufacturer, ' ', '-')) || '-' || guides.symptom_key,
  brands.manufacturer, 'stick_vacuum', 'Tất cả model', '', guides.symptom_key,
  guides.title_vi, guides.summary_vi, guides.first_action_vi, guides.safety_stop_vi,
  guides.diagnostic_steps_vi, guides.service_handoff_vi,
  0.78, 'trung bình', 'Hướng dẫn kiểm tra ban đầu cho máy hút bụi cầm tay; đối chiếu đúng model trước khi thay linh kiện.',
  'AQTECH lookup data (licensed)', 'https://aqtech.com.vn/sua-chua-robot-hut-bui/',
  '2026-11-07', 'licensed-reference'
FROM brands CROSS JOIN guides;
