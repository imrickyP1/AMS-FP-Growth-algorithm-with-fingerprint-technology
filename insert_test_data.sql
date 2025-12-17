USE ams_db;

-- Insert sample attendance data for December 17, 2025
INSERT INTO attendance (user_id, position, am_time_in, am_time_out, pm_time_in, pm_time_out, date, remarks)
VALUES 
    (1, 'official', '08:00:00', '12:00:00', '13:00:00', '17:00:00', '2025-12-17', 'Ontime'),
    (22, 'staff', '08:45:00', '12:00:00', '13:00:00', '17:00:00', '2025-12-17', 'LATE'),
    (1, 'official', '08:05:00', '12:00:00', '13:00:00', '16:30:00', '2025-12-17', 'Ontime'),
    (22, 'staff', '08:00:00', '12:00:00', '13:00:00', '18:30:00', '2025-12-17', 'Overtime')
ON DUPLICATE KEY UPDATE 
    am_time_in = VALUES(am_time_in),
    am_time_out = VALUES(am_time_out),
    pm_time_in = VALUES(pm_time_in),
    pm_time_out = VALUES(pm_time_out),
    remarks = VALUES(remarks);

SELECT 'Test data inserted successfully!' as message;
