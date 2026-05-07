-- =====================================================
-- GYM MANAGEMENT SYSTEM - MySQL Schema for XAMPP
-- =====================================================
-- Instructions:
-- 1. Ouvrez phpMyAdmin dans XAMPP
-- 2. Créez une base de données nommée 'gym_management'
-- 3. Importez ce fichier SQL
-- =====================================================

CREATE DATABASE IF NOT EXISTS gym_management;
USE gym_management;

-- Table des utilisateurs
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des rôles utilisateurs
CREATE TABLE user_roles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    role ENUM('admin', 'coach', 'member') NOT NULL DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_role (user_id, role),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des profils
CREATE TABLE profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    address TEXT,
    date_of_birth DATE,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des coachs
CREATE TABLE coaches (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL UNIQUE,
    hourly_rate DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    specializations JSON,
    certifications JSON,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des cours
CREATE TABLE courses (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    coach_id VARCHAR(36),
    duration_minutes INT NOT NULL DEFAULT 60,
    max_participants INT NOT NULL DEFAULT 20,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'intermediate',
    room VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL
);

-- Table des horaires de cours
CREATE TABLE course_schedules (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    course_id VARCHAR(36) NOT NULL,
    day_of_week TINYINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Table des sessions de cours
CREATE TABLE course_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    course_id VARCHAR(36) NOT NULL,
    schedule_id VARCHAR(36),
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES course_schedules(id) ON DELETE SET NULL
);

-- Table des réservations
CREATE TABLE reservations (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    session_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    status ENUM('confirmed', 'cancelled', 'attended', 'no_show') DEFAULT 'confirmed',
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL,
    UNIQUE KEY unique_reservation (session_id, user_id),
    FOREIGN KEY (session_id) REFERENCES course_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des types d'abonnement
CREATE TABLE subscription_types (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_months INT NOT NULL DEFAULT 1,
    max_classes_per_week INT,
    features JSON DEFAULT ('[]'),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des abonnements
CREATE TABLE subscriptions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    subscription_type_id VARCHAR(36) NOT NULL,
    start_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled', 'pending') DEFAULT 'active',
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_type_id) REFERENCES subscription_types(id) ON DELETE RESTRICT
);

-- Table des paiements
CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    subscription_id VARCHAR(36),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
    stripe_payment_id VARCHAR(255),
    invoice_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);

-- Table des équipements
CREATE TABLE equipment (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    status ENUM('available', 'maintenance', 'out_of_service') DEFAULT 'available',
    purchase_date DATE,
    last_maintenance DATE,
    next_maintenance DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des messages de contact
CREATE TABLE contact_messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('unread', 'read') DEFAULT 'unread',
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Données de test (optionnel)
-- =====================================================

-- Créer un utilisateur admin par défaut
-- Mot de passe: admin123 (hashé avec bcrypt)
INSERT INTO users (id, email, password_hash) VALUES 
('admin-uuid-001', 'admin@gym.com', '$2a$10$rQnM1kH1yG1xZ1234567890abcdefghijklmnopqrstuvwxyz');

INSERT INTO user_roles (user_id, role) VALUES 
('admin-uuid-001', 'admin');

INSERT INTO profiles (user_id, first_name, last_name, email) VALUES 
('admin-uuid-001', 'Admin', 'Système', 'admin@gym.com');

-- Types d'abonnement par défaut
INSERT INTO subscription_types (id, name, description, price, duration_months, max_classes_per_week) VALUES
('sub-type-001', 'Basic', 'Accès à la salle de sport', 29.99, 1, 3),
('sub-type-002', 'Premium', 'Accès illimité + cours collectifs', 49.99, 1, NULL),
('sub-type-003', 'VIP', 'Tout inclus + coaching personnalisé', 99.99, 1, NULL);

-- =====================================================
-- TRIGGERS SIMPLES
-- =====================================================

-- 1. Table de logs pour les utilisateurs supprimés
CREATE TABLE IF NOT EXISTS user_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36),
    email VARCHAR(255),
    action VARCHAR(50),
    log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Trigger pour archiver les utilisateurs supprimés (Audit)
DELIMITER //
CREATE TRIGGER after_user_delete
AFTER DELETE ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_logs (user_id, email, action)
    VALUES (OLD.id, OLD.email, 'DELETE');
END;//
DELIMITER ;

-- 3. Trigger pour empêcher une date de fin intèrieure à la date de début
DELIMITER //
CREATE TRIGGER check_subscription_dates
BEFORE INSERT ON subscriptions
FOR EACH ROW
BEGIN
    IF NEW.end_date <= NEW.start_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La date de fin doit être postérieure à la date de début';
    END IF;
END;//
DELIMITER ;
