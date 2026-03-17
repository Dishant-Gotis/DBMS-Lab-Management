TRUNCATE TABLE timetable, software, assistants, slots, courses, faculty, classes, pcs, os, labs, colleges RESTART IDENTITY CASCADE;

INSERT INTO colleges (name, city, pincode, state) VALUES
('PCCOE Pune', 'Pune', '411044', 'Maharashtra'),
('ABC Institute', 'Mumbai', '400001', 'Maharashtra');

INSERT INTO labs (college_id, name, floor) VALUES
(1, 'Computer Lab 6101', 6),
(1, 'Computer Lab 6102', 6),
(2, 'Computer Lab 2101', 2);

INSERT INTO os (name, version) VALUES
('Windows', '11 Pro'),
('Ubuntu', '22.04 LTS'),
('Debian', '12');

INSERT INTO pcs (password, os_id, lab_id) VALUES
('pcpass-1001', 1, 1),
('pcpass-1002', 2, 1),
('pcpass-1003', 2, 2),
('pcpass-2001', 3, 3);

INSERT INTO assistants (name, password, email, phone, lab_id) VALUES
('Raj Patel', 'asstpass1', 'rajpatel@pccoepune.org', '9000000001', 1),
('Priya Sharma', 'asstpass2', 'priyasharma@pccoepune.org', '9000000002', 2),
('Amit Kale', 'asstpass3', 'amitkale@abci.org', '9000000003', 3);

INSERT INTO software (name, version, pc_id, installed_at) VALUES
('Python', '3.11.8', 1, NOW() - INTERVAL '10 day'),
('VS Code', '1.99.0', 1, NOW() - INTERVAL '9 day'),
('PostgreSQL', '17', 2, NOW() - INTERVAL '8 day'),
('Docker', '27', 2, NOW() - INTERVAL '7 day'),
('Node.js', '22.14.0', 3, NOW() - INTERVAL '6 day'),
('Git', '2.43.0', 4, NOW() - INTERVAL '5 day');

INSERT INTO classes (division, year, floor, strength) VALUES
('A', 2, 4, 62),
('B', 3, 5, 58),
('C', 4, 5, 55);

INSERT INTO faculty (name, password, email, phone) VALUES
('Dr. Mehta', 'facpass1', 'mehta@pccoepune.org', '9100000001'),
('Prof. Kulkarni', 'facpass2', 'kulkarni@pccoepune.org', '9100000002'),
('Prof. Shah', 'facpass3', 'shah@abci.org', '9100000003');

INSERT INTO courses (name, duration_weeks, credits) VALUES
('DBMS Lab', 12, 4),
('Operating Systems Lab', 10, 3),
('Web Programming Lab', 8, 3);

INSERT INTO slots (course_id, faculty_id, class_id) VALUES
(1, 1, 1),
(2, 2, 2),
(3, 1, 3),
(1, 3, 2),
(2, 2, 1);

INSERT INTO timetable (lab_id, mon_slot_id, tue_slot_id, wed_slot_id, thur_slot_id, fri_slot_id) VALUES
(1, 1, 2, 3, NULL, 5),
(2, NULL, 2, NULL, 1, 3),
(3, 4, NULL, NULL, NULL, NULL);
