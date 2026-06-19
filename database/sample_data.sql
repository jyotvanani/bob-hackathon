-- Reference seed data (the FastAPI backend auto-seeds via app/seed/seed_data.py)

INSERT INTO users (name, email, password, phone, role, usual_city, usual_country,
                   usual_device_id, usual_login_start_hour, usual_login_end_hour,
                   average_transaction_amount)
VALUES
  ('Jyot Vanani', 'jyot@example.com', '123456', '9876543210', 'customer',
   'Surat', 'India', 'android_001', 8, 22, 5000),
  ('Admin User', 'admin@example.com', 'admin123', '9000000000', 'admin',
   'Ahmedabad', 'India', 'admin_laptop_001', 9, 18, 10000);

INSERT INTO devices (user_id, device_id, device_name, browser, os, is_trusted)
VALUES
  (1, 'android_001', 'Samsung Android', 'Chrome', 'Android', 1),
  (2, 'admin_laptop_001', 'Admin Laptop', 'Chrome', 'Windows', 1);
