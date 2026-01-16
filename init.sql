CREATE TABLE citizens (
    citizen_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    profile_photo_url TEXT,
    telegram_username VARCHAR(100),
    email_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE verification_codes (
    code_id SERIAL PRIMARY KEY,
    citizen_id INT REFERENCES citizens(citizen_id),
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),   -- timestamp with timezone
    expires_at TIMESTAMPTZ NOT NULL         -- timestamp with timezone
);

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    office TEXT NOT NULL
);
CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE company_categories (
    company_id INT REFERENCES companies(company_id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(category_id) ON DELETE CASCADE,
    PRIMARY KEY (company_id, category_id)
);

CREATE TABLE statuses (
    status_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE operators (
    operator_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role_id INT REFERENCES roles(role_id) NOT NULL,
    company_id INT REFERENCES companies(company_id) NOT NULL
);

CREATE TABLE operator_categories (
    operator_id INT REFERENCES operators(operator_id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(category_id) ON DELETE CASCADE,
    PRIMARY KEY (operator_id, category_id)
);

CREATE TABLE reports (
    report_id SERIAL PRIMARY KEY,
    citizen_id INT REFERENCES citizens(citizen_id),
    category_id INT REFERENCES categories(category_id),
    status_id INT REFERENCES statuses(status_id),
    assigned_to_operator_id INT REFERENCES operators(operator_id),
    assigned_to_company_id INT REFERENCES companies(company_id),
    assigned_to_external_id INT REFERENCES operators(operator_id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    anonymous BOOLEAN DEFAULT FALSE,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE photos (
    photo_id SERIAL PRIMARY KEY,
    report_id INT REFERENCES reports(report_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE internal_comment (
    internal_comment_id SERIAL PRIMARY KEY,
    report_id INT REFERENCES reports(report_id) ON DELETE CASCADE,
    sender_operator_id INT REFERENCES operators(operator_id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    report_id INT REFERENCES reports(report_id) ON DELETE CASCADE,
    sender_type VARCHAR(10) CHECK (sender_type IN ('citizen','operator')),
    sender_id INT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    citizen_id INT REFERENCES citizens(citizen_id),
    report_id INT REFERENCES reports(report_id),
    message TEXT NOT NULL,
    new_status_id INT REFERENCES statuses(status_id),
    sent_at TIMESTAMP DEFAULT NOW(),
    seen BOOLEAN DEFAULT FALSE
);

CREATE TABLE telegram_users (
    telegram_user_id SERIAL PRIMARY KEY,
    citizen_id INT UNIQUE REFERENCES citizens(citizen_id),
    chat_id BIGINT UNIQUE NOT NULL,
    linked_at TIMESTAMP DEFAULT NOW()
);

-- Tracks when users last read each chat (for unread message counts)
CREATE TABLE chat_reads (
    id SERIAL PRIMARY KEY,
    user_type VARCHAR(10) CHECK (user_type IN ('citizen','operator')) NOT NULL,
    user_id INT NOT NULL,
    report_id INT REFERENCES reports(report_id) ON DELETE CASCADE,
    last_read_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_type, user_id, report_id)
);

-- Funzione per controllare email duplicate tra citizens e operators
CREATE OR REPLACE FUNCTION check_email_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'citizens' THEN
        IF EXISTS (SELECT 1 FROM operators WHERE email = NEW.email) THEN
            RAISE EXCEPTION USING
                MESSAGE = format('Email already in use: %s', NEW.email),
                ERRCODE = '23505';
        END IF;
    ELSIF TG_TABLE_NAME = 'operators' THEN
        IF EXISTS (SELECT 1 FROM citizens WHERE email = NEW.email) THEN
            RAISE EXCEPTION USING
                MESSAGE = format('Email already in use: %s', NEW.email),
                ERRCODE = '23505';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger su citizens
CREATE TRIGGER check_email_on_citizens
BEFORE INSERT OR UPDATE ON citizens
FOR EACH ROW
EXECUTE FUNCTION check_email_uniqueness();

-- Trigger su operators
CREATE TRIGGER check_email_on_operators
BEFORE INSERT OR UPDATE ON operators
FOR EACH ROW
EXECUTE FUNCTION check_email_uniqueness();

-- Trigger per controllare unique username
CREATE OR REPLACE FUNCTION check_username_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'citizens' THEN
        IF EXISTS (SELECT 1 FROM operators WHERE username = NEW.username) THEN
            RAISE EXCEPTION USING
                MESSAGE = format('Username already in use: %s', NEW.username),
                ERRCODE = '23505';
        END IF;
    ELSIF TG_TABLE_NAME = 'operators' THEN
        IF EXISTS (SELECT 1 FROM citizens WHERE username = NEW.username) THEN
            RAISE EXCEPTION USING
                MESSAGE = format('Username already in use: %s', NEW.username),
                ERRCODE = '23505';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_username_on_citizens
BEFORE INSERT OR UPDATE ON citizens
FOR EACH ROW
EXECUTE FUNCTION check_username_uniqueness();
CREATE TRIGGER check_username_on_operators
BEFORE INSERT OR UPDATE ON operators
FOR EACH ROW
EXECUTE FUNCTION check_username_uniqueness();


--Trigger Controlla che l'operatore possa avere quella categoria (basandosi sulla sua azienda)
CREATE OR REPLACE FUNCTION check_operator_category_consistency() RETURNS TRIGGER AS $$
DECLARE
    op_company_id INT;
BEGIN
    SELECT company_id INTO op_company_id FROM operators WHERE operator_id = NEW.operator_id;
    IF NOT EXISTS (
        SELECT 1 FROM company_categories 
        WHERE company_id = op_company_id AND category_id = NEW.category_id
    ) THEN
        RAISE EXCEPTION 'Errore: La compagnia di questo operatore non gestisce questa categoria.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_op_cat_consistency
BEFORE INSERT OR UPDATE ON operator_categories
FOR EACH ROW
EXECUTE FUNCTION check_operator_category_consistency();

--Trigger Controlla che il report sia assegnato a una compagnia competente
CREATE OR REPLACE FUNCTION check_report_company_competence() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.assigned_to_company_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM company_categories 
            WHERE company_id = NEW.assigned_to_company_id AND category_id = NEW.category_id
        ) THEN
            RAISE EXCEPTION 'Errore: La compagnia assegnata non gestisce la categoria del report.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_report_assignment
BEFORE INSERT OR UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION check_report_company_competence();

-- ============================================
-- POPOLAMENTO DATABASE
-- ============================================

-- 1. Statuses
INSERT INTO statuses (name) VALUES
('Pending Approval'),
('Assigned'),
('In Progress'),
('Suspended'),
('Rejected'),
('Resolved');

-- 2. Roles
INSERT INTO roles (name, description) VALUES
('Admin', 'Administrator with full system access and user management capabilities'),
('Municipal public relations officer', 'Handles preliminary report verification and approval/rejection'),
('Technical office staff member', 'Manages assigned reports, updates status, and resolves issues'),
('Municipal administrator', 'Studies statistics'),
('External maintainer', 'External company staff member who handles specific maintenance tasks');

-- 3. Categories (con campo office)
INSERT INTO categories (name, office) VALUES
('Organization', 'Organization Office'),
('Water Supply – Drinking Water', 'Water Department'),
('Architectural Barriers', 'Accessibility Office'),
('Sewer System', 'Sewage Department'),
('Public Lighting', 'Lighting Department'),
('Waste', 'Waste Management'),
('Road Signs and Traffic Lights', 'Traffic Department'),
('Roads and Urban Furnishings', 'Public Works'),
('Public Green Areas and Playgrounds', 'Parks Department'),
('Other', 'General Services');

-- 4. Companies
INSERT INTO companies (name, description) VALUES
('Participium', 'Municipality of Turin - Internal staff'),
('Enel X', 'Public lighting maintenance and energy services'),
('SMAT', 'Water and sewage system management'),
('AMIAT', 'Waste management and street cleaning'),
('GTT Infrastrutture', 'Public transport infrastructure maintenance');
INSERT INTO companies (name, description) VALUES
('FixRoads Srl', 'Maintenance of roads and urban furnishings');

-- 5. Company Categories
-- Participium gestisce TUTTE le categorie
INSERT INTO company_categories (company_id, category_id)
SELECT 
    (SELECT company_id FROM companies WHERE name = 'Participium'),
    category_id
FROM categories;

-- Enel X gestisce solo Public Lighting
INSERT INTO company_categories (company_id, category_id) VALUES
((SELECT company_id FROM companies WHERE name = 'Enel X'),
 (SELECT category_id FROM categories WHERE name = 'Public Lighting'));

-- SMAT gestisce Water Supply e Sewer System
INSERT INTO company_categories (company_id, category_id) VALUES
((SELECT company_id FROM companies WHERE name = 'SMAT'),
 (SELECT category_id FROM categories WHERE name = 'Water Supply – Drinking Water')),
((SELECT company_id FROM companies WHERE name = 'SMAT'),
 (SELECT category_id FROM categories WHERE name = 'Sewer System'));

-- AMIAT gestisce Waste
INSERT INTO company_categories (company_id, category_id) VALUES
((SELECT company_id FROM companies WHERE name = 'AMIAT'),
 (SELECT category_id FROM categories WHERE name = 'Waste'));

-- GTT gestisce Road Signs and Traffic Lights
INSERT INTO company_categories (company_id, category_id) VALUES
((SELECT company_id FROM companies WHERE name = 'GTT Infrastrutture'),
 (SELECT category_id FROM categories WHERE name = 'Road Signs and Traffic Lights'));

 -- DEMO Company Roads and Urban Furnishings
 INSERT INTO company_categories (company_id, category_id) VALUES
((SELECT company_id FROM companies WHERE name = 'FixRoads Srl'),
 (SELECT category_id FROM categories WHERE name = 'Roads and Urban Furnishings'));

-- 6. Operators
-- Admin
INSERT INTO operators (email, username, password_hash, salt, role_id, company_id)
VALUES (
  'admin@participium.local',
  'admin',
  'f746cd28ba22bc7f3bbd4f62f152180f17236d0463d70888c4881d154c7526af',
  '4c999d4a2a78113f997cc7fd2cd05043',
  (SELECT role_id FROM roles WHERE name = 'Admin'),
  (SELECT company_id FROM companies WHERE name = 'Participium')
);

-- Public Relations Officer
INSERT INTO operators (email, username, password_hash, salt, role_id, company_id) VALUES
('mimmo.schillaci@participium.local', 'off_organization', 
 'f746cd28ba22bc7f3bbd4f62f152180f17236d0463d70888c4881d154c7526af', 
 '4c999d4a2a78113f997cc7fd2cd05043', 
 (SELECT role_id FROM roles WHERE name = 'Municipal public relations officer'),
 (SELECT company_id FROM companies WHERE name = 'Participium'));

-- Technical Staff Members (uno per categoria principale)
INSERT INTO operators (email, username, password_hash, salt, role_id, company_id) VALUES
('tec.water@participium.local', 'tec_water', 'f746cd28ba22bc7f3bbd4f62f152180f17236d0463d70888c4881d154c7526af', '4c999d4a2a78113f997cc7fd2cd05043', 
  (SELECT role_id FROM roles WHERE name = 'Technical office staff member'),
  (SELECT company_id FROM companies WHERE name = 'Participium')),
('tec.accessibility@participium.local', 'tec_accessibility', 'f746cd28ba22bc7f3bbd4f62f152180f17236d0463d70888c4881d154c7526af', '4c999d4a2a78113f997cc7fd2cd05043', 
  (SELECT role_id FROM roles WHERE name = 'Technical office staff member'),
  (SELECT company_id FROM companies WHERE name = 'Participium')),
('tec.sewage@participium.local', 'tec_sewage', 'f746cd28ba22bc7f3bbd4f62f152180f17236d0463d70888c4881d154c7526af', '4c999d4a2a78113f997cc7fd2cd05043', 
  (SELECT role_id FROM roles WHERE name = 'Technical office staff member'),
  (SELECT company_id FROM companies WHERE name = 'Participium')),
('tec.lighting@participium.local', 'tec_lighting', 'f746cd28ba22bc7f3bbd4f62f152180f17236d0463d70888c4881d154c7526af', '4c999d4a2a78113f997cc7fd2cd05043', 
  (SELECT role_id FROM roles WHERE name = 'Technical office staff member'),
  (SELECT company_id FROM companies WHERE name = 'Participium')),
('tec.waste@participium.local', 'tec_waste', 'f746cd28ba22bc7f3bbd4f62f152180f17236d0463d70888c4881d154c7526af', '4c999d4a2a78113f997cc7fd2cd05043', 
  (SELECT role_id FROM roles WHERE name = 'Technical office staff member'),
  (SELECT company_id FROM companies WHERE name = 'Participium')),
('tec.traffic@participium.local', 'tec_traffic', 'f746cd28ba22bc7f3bbd4f62f152180f17236d0463d70888c4881d154c7526af', '4c999d4a2a78113f997cc7fd2cd05043', 
  (SELECT role_id FROM roles WHERE name = 'Technical office staff member'),
  (SELECT company_id FROM companies WHERE name = 'Participium')),
('ada.lovelace@participium.local', 'tec_publicworks', 'f746cd28ba22bc7f3bbd4f62f152180f17236d0463d70888c4881d154c7526af', '4c999d4a2a78113f997cc7fd2cd05043', 
  (SELECT role_id FROM roles WHERE name = 'Technical office staff member'),
  (SELECT company_id FROM companies WHERE name = 'Participium')),
('tec.parks@participium.local', 'tec_parks', 'f746cd28ba22bc7f3bbd4f62f152180f17236d0463d70888c4881d154c7526af', '4c999d4a2a78113f997cc7fd2cd05043', 
  (SELECT role_id FROM roles WHERE name = 'Technical office staff member'),
  (SELECT company_id FROM companies WHERE name = 'Participium')),
('tec.general@participium.local', 'tec_general', 'f746cd28ba22bc7f3bbd4f62f152180f17236d0463d70888c4881d154c7526af', '4c999d4a2a78113f997cc7fd2cd05043', 
  (SELECT role_id FROM roles WHERE name = 'Technical office staff member'),
  (SELECT company_id FROM companies WHERE name = 'Participium'));

-- External Maintainers
INSERT INTO operators (email, username, password_hash, salt, role_id, company_id) VALUES
('maint.lighting@enelx.com', 'ext_enelx', 'f746cd28ba22bc7f3bbd4f62f152180f17236d0463d70888c4881d154c7526af', '4c999d4a2a78113f997cc7fd2cd05043',
    (SELECT role_id FROM roles WHERE name = 'External maintainer'),      
    (SELECT company_id FROM companies WHERE name = 'Enel X')),
('maint.water@smat.com', 'ext_smat', 'f746cd28ba22bc7f3bbd4f62f152180f17236d0463d70888c4881d154c7526af', '4c999d4a2a78113f997cc7fd2cd05043',
    (SELECT role_id FROM roles WHERE name = 'External maintainer'),      
    (SELECT company_id FROM companies WHERE name = 'SMAT')),
('maint.waste@amiat.com', 'ext_amiat', 'f746cd28ba22bc7f3bbd4f62f152180f17236d0463d70888c4881d154c7526af', '4c999d4a2a78113f997cc7fd2cd05043',
    (SELECT role_id FROM roles WHERE name = 'External maintainer'),      
    (SELECT company_id FROM companies WHERE name = 'AMIAT')),
('maint.traffic@gtt.com', 'ext_gtt', 'f746cd28ba22bc7f3bbd4f62f152180f17236d0463d70888c4881d154c7526af', '4c999d4a2a78113f997cc7fd2cd05043',
    (SELECT role_id FROM roles WHERE name = 'External maintainer'),      
    (SELECT company_id FROM companies WHERE name = 'GTT Infrastrutture')),
('maint.publicworks@fixroads.com', 'ext_fixroads', 'f746cd28ba22bc7f3bbd4f62f152180f17236d0463d70888c4881d154c7526af', '4c999d4a2a78113f997cc7fd2cd05043',
    (SELECT role_id FROM roles WHERE name = 'External maintainer'),      
    (SELECT company_id FROM companies WHERE name = 'FixRoads Srl'));

-- 7. Operator Categories (associazioni N-N)
-- Associa ogni technical staff member alla sua categoria principale
INSERT INTO operator_categories (operator_id, category_id) VALUES
((SELECT operator_id FROM operators WHERE username = 'tec_water'),
 (SELECT category_id FROM categories WHERE name = 'Water Supply – Drinking Water')),
((SELECT operator_id FROM operators WHERE username = 'tec_accessibility'),
 (SELECT category_id FROM categories WHERE name = 'Architectural Barriers')),
((SELECT operator_id FROM operators WHERE username = 'tec_sewage'),
 (SELECT category_id FROM categories WHERE name = 'Sewer System')),
((SELECT operator_id FROM operators WHERE username = 'tec_lighting'),
 (SELECT category_id FROM categories WHERE name = 'Public Lighting')),
((SELECT operator_id FROM operators WHERE username = 'tec_waste'),
 (SELECT category_id FROM categories WHERE name = 'Waste')),
((SELECT operator_id FROM operators WHERE username = 'tec_traffic'),
 (SELECT category_id FROM categories WHERE name = 'Road Signs and Traffic Lights')),
((SELECT operator_id FROM operators WHERE username = 'tec_publicworks'),
 (SELECT category_id FROM categories WHERE name = 'Roads and Urban Furnishings')),
((SELECT operator_id FROM operators WHERE username = 'tec_parks'),
 (SELECT category_id FROM categories WHERE name = 'Public Green Areas and Playgrounds')),
((SELECT operator_id FROM operators WHERE username = 'tec_general'),
 (SELECT category_id FROM categories WHERE name = 'Other'));

-- External maintainers: associa alle loro categorie
INSERT INTO operator_categories (operator_id, category_id) VALUES
((SELECT operator_id FROM operators WHERE username = 'ext_enelx'),
 (SELECT category_id FROM categories WHERE name = 'Public Lighting')),
((SELECT operator_id FROM operators WHERE username = 'ext_smat'),
 (SELECT category_id FROM categories WHERE name = 'Water Supply – Drinking Water')),
((SELECT operator_id FROM operators WHERE username = 'ext_smat'),
 (SELECT category_id FROM categories WHERE name = 'Sewer System')),
((SELECT operator_id FROM operators WHERE username = 'ext_amiat'),
 (SELECT category_id FROM categories WHERE name = 'Waste')),
((SELECT operator_id FROM operators WHERE username = 'ext_gtt'),
 (SELECT category_id FROM categories WHERE name = 'Road Signs and Traffic Lights'));

-- 8. Citizen
INSERT INTO citizens (email, username, first_name, last_name, password_hash, salt, profile_photo_url, telegram_username, email_notifications, verified) VALUES
('melo@participium.local', 'melo', 'Carmelo', 'Locali', '858461e61ed6a0863bb44c4541e7bdcb33f9dd8d4401095ea6016bb4645b1239', '50ca648a1d5bbd29454d4a19efd9775b', NULL, NULL, TRUE, TRUE);

INSERT INTO citizens (email, username, first_name, last_name, password_hash, salt, profile_photo_url, telegram_username, email_notifications, verified) VALUES
('rosa.bianca@mail.example', 'RosaB', 'Rosa', 'Bianca', '858461e61ed6a0863bb44c4541e7bdcb33f9dd8d4401095ea6016bb4645b1239', '50ca648a1d5bbd29454d4a19efd9775b', NULL, NULL, TRUE, TRUE);



-- 9. Reports
-- Report 1: Pending Approval
WITH new_report AS (
    INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
    ) VALUES (
        (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
        (SELECT category_id FROM categories WHERE name='Architectural Barriers'),
        (SELECT status_id FROM statuses WHERE name='Pending Approval'),
        NULL,
        'Broken mobile stairs and inaccessible stairs',
        'The escalators are not functioning and the elevator is out of service, making access impossible.',
        45.063231, 7.659270,
        FALSE
    )
    RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT nr.report_id, url
FROM new_report nr,
LATERAL (VALUES
    ('https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/scale_mobili_2.jpg'),
    ('https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/scale_mobili1.jpg')
) AS t(url);

-- Report 2: Pending Approval
WITH new_report AS (
    INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
    ) VALUES (
        (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
        (SELECT category_id FROM categories WHERE name='Sewer System'),
        (SELECT status_id FROM statuses WHERE name='Pending Approval'),
        NULL,
        'Working on sewage overflow',
        'Replacing damaged pipes causing sewage overflow in the street.',
        45.063215, 7.659258,
        FALSE
    )
    RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT nr.report_id, url
FROM new_report nr,
LATERAL (VALUES
    ('https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/swage_report.jpg'),
    ('https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/sewage2.jpg'),
    ('https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/sewage3.jpg')
) AS t(url);

-- Report 3: Assigned to Technical
WITH new_report AS (
    INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
    ) VALUES (
        (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
        (SELECT category_id FROM categories WHERE name='Public Lighting'),
        (SELECT status_id FROM statuses WHERE name='Assigned'),
        (SELECT operator_id FROM operators WHERE username='tec_lighting'),
        'Streetlight completely broken',
        'The streetlight has been off for several days, the area is very dark at night.',
        45.063248, 7.659290,
        FALSE
    )
    RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT nr.report_id, 'https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/lampione_rotto.jpg'
FROM new_report nr;

-- Report 4: In Progress by Technical
WITH new_report AS (
    INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
    ) VALUES (
        (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
        (SELECT category_id FROM categories WHERE name='Waste'),
        (SELECT status_id FROM statuses WHERE name='In Progress'),
        (SELECT operator_id FROM operators WHERE username='tec_waste'),
        'Overflowing trash container',
        'Trash is not being collected and bags are piling up around the container.',
        45.070500, 7.661200,
        FALSE
    )
    RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT nr.report_id, 'https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/waste_report.jpg'
FROM new_report nr;

-- Report 5: Assigned to Company (Enel X)
WITH new_report AS (
    INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, assigned_to_company_id, title, description,
        latitude, longitude, anonymous
    ) VALUES (
        (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
        (SELECT category_id FROM categories WHERE name='Public Lighting'),
        (SELECT status_id FROM statuses WHERE name='Assigned'),
        (SELECT operator_id FROM operators WHERE username='tec_lighting'),
        (SELECT company_id FROM companies WHERE name='Enel X'),
        'Multiple streetlights not working',
        'Several streetlights on this street are not functioning. Area very dark at night.',
        45.063611, 7.677467,
        FALSE
    )
    RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT nr.report_id, url
FROM new_report nr,
LATERAL (VALUES
    ('https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/semafooro_rotto.jpg'),
    ('https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/semaforo2.jpg')
) AS t(url);

-- Report 6: Assigned to External (già preso in carico)
WITH new_report AS (
    INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, assigned_to_company_id, assigned_to_external_id,
        title, description, latitude, longitude, anonymous
    ) VALUES (
        (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
        (SELECT category_id FROM categories WHERE name='Waste'),
        (SELECT status_id FROM statuses WHERE name='In Progress'),
        (SELECT operator_id FROM operators WHERE username='tec_waste'),
        (SELECT company_id FROM companies WHERE name='AMIAT'),
        (SELECT operator_id FROM operators WHERE username='ext_amiat'),
        'Large waste accumulation',
        'Large amount of waste needs special collection.',
        45.064250, 7.680255,
        FALSE
    )
    RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT nr.report_id, 'https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/roadworks_report.jpg'
FROM new_report nr;

-- Report 7: Resolved
WITH new_report AS (
    INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
    ) VALUES (
        (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
        (SELECT category_id FROM categories WHERE name='Public Green Areas and Playgrounds'),
        (SELECT status_id FROM statuses WHERE name='Resolved'),
        (SELECT operator_id FROM operators WHERE username='tec_parks'),
        'Fallen tree blocking path',
        'A large tree has fallen and is blocking the pedestrian walkway.',
        45.073415, 7.663635,
        FALSE
    )
    RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT nr.report_id, 'https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/fallen_tree.png'
FROM new_report nr;

-- Report 8: Suspended
WITH new_report AS (
    INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
    ) VALUES (
        (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
        (SELECT category_id FROM categories WHERE name='Other'),
        (SELECT status_id FROM statuses WHERE name='Suspended'),
        (SELECT operator_id FROM operators WHERE username='tec_general'),
        'Broken information screen',
        'The municipal electronic info-panel is not working and shows only static.',
        45.079649, 7.660552,
        FALSE
    )
    RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT nr.report_id, 'https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/fontana_rotta.jpg'
FROM new_report nr;

WITH new_report AS (
INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
) VALUES (
    (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
    (SELECT category_id FROM categories WHERE name='Roads and Urban Furnishings'),
    2,
    9,
    'Pothole on the roadway',
    'Large pothole causing danger to cars and bicycles.',
    45.070120, 7.668450, TRUE
) RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT report_id, 'https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/1768502322961-pothole-in-the-road.jpg' FROM new_report;

WITH new_report AS (
INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
) VALUES (
    (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
    (SELECT category_id FROM categories WHERE name='Water Supply – Drinking Water'),
    2,
    3,
    'Water leak from sidewalk',
    'Continuous water leak coming out from the pavement.',
    45.068940, 7.662310, TRUE
) RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT report_id, 'https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/1768503058207-water.jfif' FROM new_report;

WITH new_report AS (
INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
) VALUES (
    (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
    (SELECT category_id FROM categories WHERE name='Waste'),
    2,
    7,
    'Illegal dumping',
    'Bulky waste abandoned on sidewalk.',
    45.089099, 7.668285, TRUE
) RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT report_id, 'https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/1768502516755-rifiuti.jfif' FROM new_report;

WITH new_report AS (
INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
) VALUES (
    (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
    (SELECT category_id FROM categories WHERE name='Waste'),
    2,
    7,
    'Rubbish on the road',
    'Bulky waste abandoned on sidewalk.',
    45.077534, 7.702425, TRUE
) RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT report_id, 'https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/1768503057793-rifiuti_2.jfif' FROM new_report;

WITH new_report AS (
INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
) VALUES (
    (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
    (SELECT category_id FROM categories WHERE name='Public Lighting'),
    2,
    6,
    'Flickering streetlight',
    'Streetlight intermittently turns on and off at night.',
     45.076104, 7.643008, TRUE
) RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT report_id, 'https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/1768503057273-flicker.jfif' FROM new_report;

WITH new_report AS (
INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
) VALUES (
    (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
    (SELECT category_id FROM categories WHERE name='Architectural Barriers'),
    2,
    4,
    'Broken sidewalk ramp',
    'Wheelchair ramp is broken and inaccessible.',
    45.057051, 7.645352, TRUE
) RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT report_id, 'https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/1768502797485-ramp.jfif' FROM new_report;

WITH new_report AS (
INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
) VALUES (
    (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
    (SELECT category_id FROM categories WHERE name='Road Signs and Traffic Lights'),
    2,
    8,
    'Traffic light not working',
    'Traffic light completely off causing traffic confusion.',
    45.051353, 7.662778, TRUE
) RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT report_id, 'https://example.com/traffic_light_off.jpg' FROM new_report;

WITH new_report AS (
INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
) VALUES (
    (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
    (SELECT category_id FROM categories WHERE name='Sewer System'),
    2,
    5,
    'Blocked manhole',
    'Sewer is blocked and it is flooding.',
    45.051099, 7.689944, TRUE
) RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT report_id, 'https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/1768502517318-sewage.jfif' FROM new_report;

WITH new_report AS (
INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
) VALUES (
    (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
    (SELECT category_id FROM categories WHERE name='Public Green Areas and Playgrounds'),
    2,
    10,
    'Broken playground swing',
    'Swing structure damaged and unsafe for children.',
    45.057628, 7.632340, TRUE
) RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT report_id, 'https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/1768502517696-altalena.jfif' FROM new_report;

WITH new_report AS (
INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
) VALUES (
    (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
    (SELECT category_id FROM categories WHERE name='Roads and Urban Furnishings'),
    2,
    9,
    'Damaged bench',
    'Public bench is broken.',
    45.072085, 7.688524, TRUE
) RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT report_id, 'https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/1768502321554-bench.jfif' FROM new_report;

WITH new_report AS (
INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
) VALUES (
    (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
    (SELECT category_id FROM categories WHERE name='Other'),
    2,
    11,
    'Public clock broken',
    'City square clock is now broken.',
    45.076286, 7.683368, TRUE
) RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT report_id, 'https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/1768502322562-clock.jfif' FROM new_report;

WITH new_report AS (
INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
) VALUES (
    (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
    (SELECT category_id FROM categories WHERE name='Public Lighting'),
    2,
    6,
    'Broken streetlight',
    'The streatlight is shattered.',
    45.075540, 7.656291, TRUE
) RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT report_id, 'https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/1768502795592-lambione.jpg' FROM new_report;

WITH new_report AS (
INSERT INTO reports (
        citizen_id, category_id, status_id,
        assigned_to_operator_id, title, description,
        latitude, longitude, anonymous
) VALUES (
    (SELECT citizen_id FROM citizens WHERE email='melo@participium.local'),
    (SELECT category_id FROM categories WHERE name='Public Lighting'),
    2,
    6,
    'Broken semaphor',
    'The streatlight is always off.',
    45.065200, 7.671900, TRUE
) RETURNING report_id
)
INSERT INTO photos (report_id, image_url)
SELECT report_id, 'https://vxofqxupvztswwxksllp.supabase.co/storage/v1/object/public/Reports/1768502797899-semaphor.jfif' FROM new_report;

UPDATE operators
SET username = 'm_schillaci'
WHERE email = 'mimmo.schillaci@participium.local';

UPDATE operators
SET username = 'a_lovelace'
WHERE email = 'ada.lovelace@participium.local';
