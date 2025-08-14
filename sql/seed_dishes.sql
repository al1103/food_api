INSERT INTO dishes (name, description, price, category_id, image, preparation_time, available, created_at, updated_at)
VALUES
('Phở bò', /*'Phở bò truyền thống với nước dùng đậm đà'*/ NULL, 45000, 1, 'pho_bo.jpg', 15, true, NOW(), NOW()),
('Bún chả', /*'Bún chả Hà Nội với thịt nướng và nước mắm chua ngọt'*/ NULL, 40000, 1, 'bun_cha.jpg', 12, true, NOW(), NOW()),
('Cơm tấm', /*'Cơm tấm sườn bì chả trứng'*/ NULL, 35000, 2, 'com_tam.jpg', 10, true, NOW(), NOW()),
('Gà rán', /*'Gà rán giòn tan, ăn kèm khoai tây chiên'*/ NULL, 50000, 3, 'ga_ran.jpg', 10, true, NOW(), NOW()),
('Bánh mì thịt', /*'Bánh mì kẹp thịt nguội, pate, rau thơm'*/ NULL, 20000, 4, 'banh_mi.jpg', 5, true, NOW(), NOW()),
('Bún bò Huế', /*'Bún bò Huế cay nồng, đậm vị miền Trung'*/ NULL, 45000, 1, 'bun_bo_hue.jpg', 15, true, NOW(), NOW()),
('Cơm gà xối mỡ', /*'Cơm gà xối mỡ giòn rụm'*/ NULL, 40000, 2, 'com_ga_xoi_mo.jpg', 12, true, NOW(), NOW()),
('Bánh mì trứng', /*'Bánh mì kẹp trứng chiên'*/ NULL, 18000, 4, 'banh_mi_trung.jpg', 5, true, NOW(), NOW()),
('Cơm chiên dương châu', /*'Cơm chiên với tôm, lạp xưởng, rau củ'*/ NULL, 42000, 2, 'com_chien_duong_chau.jpg', 10, true, NOW(), NOW()),
('Khoai tây chiên', /*'Khoai tây chiên giòn'*/ NULL, 25000, 3, 'khoai_tay_chien.jpg', 7, true, NOW(), NOW()); 