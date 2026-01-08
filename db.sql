CREATE DATABASE health_bridge;

\c health_bridge

CREATE TABLE schemes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    age_group VARCHAR(50),
    gender VARCHAR(20),
    income_group VARCHAR(50)
);

-- Sample Data
INSERT INTO schemes(name, description, category, age_group, gender, income_group)
VALUES
('Ayushman Bharat', 'National health protection scheme providing coverage up to ₹5 lakhs per family.', 'Low Income Families', 'All', 'All', 'Low'),
('Rashtriya Swasthya Bima Yojana', 'Health insurance scheme for families below poverty line.', 'Low Income Families', 'All', 'All', 'Low');
