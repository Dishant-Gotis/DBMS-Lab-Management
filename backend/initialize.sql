CREATE TABLE colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    state VARCHAR(100) NOT NULL
);

CREATE TABLE labs (
    id SERIAL PRIMARY KEY,
    college_id INT NOT NULL,
    name VARCHAR(100),
    floor INT NOT NULL,

    FOREIGN KEY (college_id) REFERENCES colleges(id)
);

CREATE TABLE os (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL
);

CREATE TABLE pcs (
    id SERIAL PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    os_id INT NOT NULL,

    FOREIGN KEY (os_id) REFERENCES os(id)
);

CREATE TABLE assistants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    lab_id INT NOT NULL,

    FOREIGN KEY (lab_id) REFERENCES labs(id)
);

CREATE TABLE software (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    version VARCHAR(50),
    pc_id INT NOT NULL,
    installed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (pc_id) REFERENCES pcs(id)
);

CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    division VARCHAR(10) NOT NULL,
    year INT NOT NULL,
    floor INT NOT NULL,
    strength INT NOT NULL CHECK (strength > 0)
);

CREATE TABLE faculty (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL
);

CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    duration_weeks INT NOT NULL CHECK (duration_weeks > 0),
    credits INT NOT NULL CHECK (credits > 0)
);

CREATE TABLE slots (
    id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,
    faculty_id INT NOT NULL,
    class_id INT NOT NULL,

    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (faculty_id) REFERENCES faculty(id),
    FOREIGN KEY (class_id) REFERENCES classes(id)
);

CREATE TABLE timetable (
    lab_id SERIAL PRIMARY KEY,

    mon_slot_id INT,
    tue_slot_id INT,
    wed_slot_id INT,
    thur_slot_id INT,
    fri_slot_id INT,

    FOREIGN KEY (lab_id) REFERENCES labs(id),

    FOREIGN KEY (mon_slot_id) REFERENCES slots(id),
    FOREIGN KEY (tue_slot_id) REFERENCES slots(id),
    FOREIGN KEY (wed_slot_id) REFERENCES slots(id),
    FOREIGN KEY (thur_slot_id) REFERENCES slots(id),
    FOREIGN KEY (fri_slot_id) REFERENCES slots(id)
);