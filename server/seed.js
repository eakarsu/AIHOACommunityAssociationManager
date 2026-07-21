const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Destructive demo seed refused. Set ALLOW_DEMO_SEED=true outside production.');
  }
  try {
    console.log('Connecting to database...');

    // ──────────────────────────────────────────────
    // DROP ALL TABLES
    // ──────────────────────────────────────────────
    console.log('Dropping existing tables...');
    await pool.query(`
      DROP TABLE IF EXISTS parking CASCADE;
      DROP TABLE IF EXISTS emergency_plans CASCADE;
      DROP TABLE IF EXISTS architectural_reviews CASCADE;
      DROP TABLE IF EXISTS communications CASCADE;
      DROP TABLE IF EXISTS vendors CASCADE;
      DROP TABLE IF EXISTS amenity_bookings CASCADE;
      DROP TABLE IF EXISTS documents CASCADE;
      DROP TABLE IF EXISTS meetings CASCADE;
      DROP TABLE IF EXISTS violations CASCADE;
      DROP TABLE IF EXISTS financial_transactions CASCADE;
      DROP TABLE IF EXISTS maintenance_requests CASCADE;
      DROP TABLE IF EXISTS properties CASCADE;
      DROP TABLE IF EXISTS residents CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // ──────────────────────────────────────────────
    // CREATE ALL TABLES
    // ──────────────────────────────────────────────
    console.log('Creating tables...');

    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'resident')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE residents (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        unit_number VARCHAR(50) NOT NULL,
        move_in_date DATE,
        status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE properties (
        id SERIAL PRIMARY KEY,
        address VARCHAR(255) NOT NULL,
        unit_number VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('condo', 'townhouse', 'single-family')),
        bedrooms INT,
        bathrooms INT,
        sqft INT,
        owner_name VARCHAR(255),
        status VARCHAR(50) NOT NULL CHECK (status IN ('occupied', 'vacant', 'maintenance')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE maintenance_requests (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        unit_number VARCHAR(50),
        category VARCHAR(50) NOT NULL CHECK (category IN ('plumbing', 'electrical', 'hvac', 'landscaping', 'general', 'structural')),
        priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        reported_by VARCHAR(255),
        status VARCHAR(50) NOT NULL CHECK (status IN ('open', 'in_progress', 'completed', 'closed')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE financial_transactions (
        id SERIAL PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
        category VARCHAR(100),
        date DATE,
        status VARCHAR(50) NOT NULL CHECK (status IN ('completed', 'pending')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE violations (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        unit_number VARCHAR(50),
        violation_type VARCHAR(50) NOT NULL CHECK (violation_type IN ('noise', 'parking', 'maintenance', 'pet', 'architectural', 'trash')),
        severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
        reported_by VARCHAR(255),
        status VARCHAR(50) NOT NULL CHECK (status IN ('open', 'warning_sent', 'resolved', 'escalated')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE meetings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date DATE,
        time VARCHAR(50),
        location VARCHAR(255),
        type VARCHAR(50) NOT NULL CHECK (type IN ('board', 'annual', 'special', 'committee')),
        status VARCHAR(50) NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE documents (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        category VARCHAR(50) NOT NULL CHECK (category IN ('bylaws', 'minutes', 'policy', 'financial', 'legal', 'notice')),
        author VARCHAR(255),
        status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'archived', 'draft')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE amenity_bookings (
        id SERIAL PRIMARY KEY,
        amenity_name VARCHAR(255) NOT NULL,
        booked_by VARCHAR(255),
        booking_date DATE,
        start_time VARCHAR(50),
        end_time VARCHAR(50),
        purpose VARCHAR(255),
        status VARCHAR(50) NOT NULL CHECK (status IN ('confirmed', 'pending', 'cancelled')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE vendors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('plumbing', 'electrical', 'landscaping', 'cleaning', 'security', 'painting', 'roofing')),
        phone VARCHAR(50),
        email VARCHAR(255),
        rating DECIMAL(2,1),
        contract_status VARCHAR(50) NOT NULL CHECK (contract_status IN ('active', 'expired', 'pending')),
        hourly_rate DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE communications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        type VARCHAR(50) NOT NULL CHECK (type IN ('announcement', 'newsletter', 'notice', 'alert')),
        audience VARCHAR(50) NOT NULL CHECK (audience IN ('all', 'board', 'residents', 'staff')),
        priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'sent', 'scheduled')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE architectural_reviews (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        unit_number VARCHAR(50),
        requested_by VARCHAR(255),
        modification_type VARCHAR(50) NOT NULL CHECK (modification_type IN ('exterior', 'interior', 'landscaping', 'structural', 'fence', 'deck')),
        estimated_cost DECIMAL(10,2),
        status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'denied', 'revision_needed')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE emergency_plans (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        emergency_type VARCHAR(50) NOT NULL CHECK (emergency_type IN ('fire', 'flood', 'earthquake', 'power_outage', 'gas_leak', 'severe_weather', 'security')),
        severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        contact_person VARCHAR(255),
        contact_phone VARCHAR(50),
        status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'drill_scheduled', 'needs_update')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE parking (
        id SERIAL PRIMARY KEY,
        spot_number VARCHAR(50) NOT NULL,
        unit_number VARCHAR(50),
        vehicle_make VARCHAR(100),
        vehicle_model VARCHAR(100),
        vehicle_color VARCHAR(50),
        license_plate VARCHAR(50),
        permit_type VARCHAR(50) NOT NULL CHECK (permit_type IN ('resident', 'visitor', 'reserved', 'handicap')),
        status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'expired', 'suspended')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ──────────────────────────────────────────────
    // SEED DATA
    // ──────────────────────────────────────────────
    console.log('Seeding data...');

    // Hash password for users
    const passwordHash = await bcrypt.hash('password123', 10);

    // --- USERS (16) ---
    console.log('Seeding users...');
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role) VALUES
      ('David Chen', 'admin@hoamanager.com', $1, 'admin'),
      ('Maria Santos', 'maria.santos@hoamanager.com', $1, 'manager'),
      ('James Mitchell', 'james.mitchell@hoamanager.com', $1, 'manager'),
      ('Sarah Thompson', 'sarah.t@sunsetridge.com', $1, 'resident'),
      ('Robert Kim', 'robert.kim@sunsetridge.com', $1, 'resident'),
      ('Linda Patel', 'linda.patel@sunsetridge.com', $1, 'resident'),
      ('Michael O''Brien', 'michael.obrien@sunsetridge.com', $1, 'resident'),
      ('Jennifer Wu', 'jennifer.wu@sunsetridge.com', $1, 'resident'),
      ('William Garcia', 'william.garcia@sunsetridge.com', $1, 'resident'),
      ('Karen Nguyen', 'karen.nguyen@sunsetridge.com', $1, 'resident'),
      ('Thomas Rivera', 'thomas.rivera@sunsetridge.com', $1, 'resident'),
      ('Patricia Hayes', 'patricia.hayes@sunsetridge.com', $1, 'resident'),
      ('Daniel Foster', 'daniel.foster@sunsetridge.com', $1, 'resident'),
      ('Angela Brooks', 'angela.brooks@sunsetridge.com', $1, 'resident'),
      ('Christopher Lee', 'christopher.lee@sunsetridge.com', $1, 'resident'),
      ('Rebecca Taylor', 'rebecca.taylor@sunsetridge.com', $1, 'resident')
    `, [passwordHash]);

    // --- RESIDENTS (16) ---
    console.log('Seeding residents...');
    await pool.query(`
      INSERT INTO residents (name, email, phone, unit_number, move_in_date, status) VALUES
      ('Sarah Thompson', 'sarah.t@sunsetridge.com', '(555) 201-3344', '101A', '2022-03-15', 'active'),
      ('Robert Kim', 'robert.kim@sunsetridge.com', '(555) 201-4455', '102A', '2021-08-01', 'active'),
      ('Linda Patel', 'linda.patel@sunsetridge.com', '(555) 201-5566', '103A', '2023-01-10', 'active'),
      ('Michael O''Brien', 'michael.obrien@sunsetridge.com', '(555) 201-6677', '104B', '2020-06-22', 'active'),
      ('Jennifer Wu', 'jennifer.wu@sunsetridge.com', '(555) 201-7788', '105B', '2022-11-05', 'active'),
      ('William Garcia', 'william.garcia@sunsetridge.com', '(555) 201-8899', '106B', '2021-04-18', 'active'),
      ('Karen Nguyen', 'karen.nguyen@sunsetridge.com', '(555) 201-9900', '201A', '2023-07-01', 'active'),
      ('Thomas Rivera', 'thomas.rivera@sunsetridge.com', '(555) 202-1122', '202A', '2019-12-15', 'active'),
      ('Patricia Hayes', 'patricia.hayes@sunsetridge.com', '(555) 202-2233', '203A', '2022-05-20', 'active'),
      ('Daniel Foster', 'daniel.foster@sunsetridge.com', '(555) 202-3344', '204B', '2023-09-01', 'active'),
      ('Angela Brooks', 'angela.brooks@sunsetridge.com', '(555) 202-4455', '205B', '2021-02-14', 'active'),
      ('Christopher Lee', 'christopher.lee@sunsetridge.com', '(555) 202-5566', '206B', '2020-10-30', 'active'),
      ('Rebecca Taylor', 'rebecca.taylor@sunsetridge.com', '(555) 202-6677', '301A', '2022-08-12', 'active'),
      ('Mark Johnson', 'mark.johnson@sunsetridge.com', '(555) 202-7788', '302A', '2018-05-01', 'inactive'),
      ('Emily Davis', 'emily.davis@sunsetridge.com', '(555) 202-8899', '303A', '2023-03-25', 'active'),
      ('Jason Martinez', 'jason.martinez@sunsetridge.com', '(555) 202-9900', '304B', '2021-11-11', 'active')
    `);

    // --- PROPERTIES (16) ---
    console.log('Seeding properties...');
    await pool.query(`
      INSERT INTO properties (address, unit_number, type, bedrooms, bathrooms, sqft, owner_name, status) VALUES
      ('123 Sunset Ridge Blvd', '101A', 'condo', 2, 2, 1100, 'Sarah Thompson', 'occupied'),
      ('123 Sunset Ridge Blvd', '102A', 'condo', 2, 2, 1100, 'Robert Kim', 'occupied'),
      ('123 Sunset Ridge Blvd', '103A', 'condo', 1, 1, 850, 'Linda Patel', 'occupied'),
      ('123 Sunset Ridge Blvd', '104B', 'condo', 3, 2, 1400, 'Michael O''Brien', 'occupied'),
      ('123 Sunset Ridge Blvd', '105B', 'condo', 2, 2, 1100, 'Jennifer Wu', 'occupied'),
      ('123 Sunset Ridge Blvd', '106B', 'condo', 1, 1, 850, 'William Garcia', 'occupied'),
      ('125 Sunset Ridge Blvd', '201A', 'townhouse', 3, 2, 1600, 'Karen Nguyen', 'occupied'),
      ('125 Sunset Ridge Blvd', '202A', 'townhouse', 3, 3, 1800, 'Thomas Rivera', 'occupied'),
      ('125 Sunset Ridge Blvd', '203A', 'townhouse', 2, 2, 1350, 'Patricia Hayes', 'occupied'),
      ('125 Sunset Ridge Blvd', '204B', 'townhouse', 3, 2, 1600, 'Daniel Foster', 'occupied'),
      ('125 Sunset Ridge Blvd', '205B', 'condo', 2, 2, 1100, 'Angela Brooks', 'occupied'),
      ('125 Sunset Ridge Blvd', '206B', 'condo', 2, 1, 950, 'Christopher Lee', 'occupied'),
      ('127 Sunset Ridge Blvd', '301A', 'single-family', 4, 3, 2200, 'Rebecca Taylor', 'occupied'),
      ('127 Sunset Ridge Blvd', '302A', 'single-family', 4, 3, 2200, 'Sunset Ridge LLC', 'vacant'),
      ('127 Sunset Ridge Blvd', '303A', 'townhouse', 3, 2, 1600, 'Emily Davis', 'occupied'),
      ('127 Sunset Ridge Blvd', '304B', 'condo', 2, 2, 1100, 'Jason Martinez', 'maintenance')
    `);

    // --- MAINTENANCE REQUESTS (16) ---
    console.log('Seeding maintenance_requests...');
    await pool.query(`
      INSERT INTO maintenance_requests (title, description, unit_number, category, priority, reported_by, status) VALUES
      ('Leaking kitchen faucet', 'The kitchen faucet has a constant slow drip that worsens when the handle is turned off. Water pooling under the sink cabinet.', '101A', 'plumbing', 'medium', 'Sarah Thompson', 'open'),
      ('Flickering hallway lights', 'The hallway lights on the second floor flicker intermittently throughout the evening. Multiple residents have reported this.', '201A', 'electrical', 'low', 'Karen Nguyen', 'in_progress'),
      ('AC unit not cooling', 'Central air conditioning is running but not producing cold air. Temperature inside is 85F despite thermostat set to 72F.', '104B', 'hvac', 'high', 'Michael O''Brien', 'open'),
      ('Broken sprinkler head', 'Sprinkler head near Building A entrance is broken and spraying water onto the sidewalk, creating a slip hazard.', '103A', 'landscaping', 'medium', 'Linda Patel', 'completed'),
      ('Garage door malfunction', 'Underground parking garage door B is not responding to remote signals and sometimes gets stuck halfway.', '105B', 'general', 'high', 'Jennifer Wu', 'in_progress'),
      ('Cracked foundation wall', 'Visible crack running vertically along the east wall of the basement storage area, approximately 4 feet long.', '202A', 'structural', 'urgent', 'Thomas Rivera', 'open'),
      ('Clogged bathroom drain', 'Master bathroom shower drain is backing up. Water takes over 10 minutes to fully drain after a shower.', '106B', 'plumbing', 'medium', 'William Garcia', 'completed'),
      ('Outlet not working', 'Two electrical outlets in the living room are completely non-functional. No power to either outlet.', '203A', 'electrical', 'medium', 'Patricia Hayes', 'open'),
      ('Heating system noise', 'Loud banging noise coming from the heating vents when the system turns on. Happens every heating cycle.', '301A', 'hvac', 'low', 'Rebecca Taylor', 'in_progress'),
      ('Overgrown tree branches', 'Large oak tree branches hanging over the parking lot near spots 15-18 are at risk of falling during storms.', '204B', 'landscaping', 'high', 'Daniel Foster', 'open'),
      ('Lobby door lock broken', 'The electronic lock on the main lobby entrance is malfunctioning. Door can be pushed open without a key card.', '205B', 'general', 'urgent', 'Angela Brooks', 'in_progress'),
      ('Balcony railing loose', 'The metal railing on the third-floor balcony of unit 301A is wobbling and feels unsafe. Screws appear to be stripped.', '301A', 'structural', 'high', 'Rebecca Taylor', 'open'),
      ('Water heater leaking', 'Small puddle forming at the base of the communal water heater in the basement utility room.', '102A', 'plumbing', 'high', 'Robert Kim', 'in_progress'),
      ('Parking lot light out', 'The light pole near the visitor parking area has been out for a week. Safety concern during evening hours.', '206B', 'electrical', 'medium', 'Christopher Lee', 'open'),
      ('Thermostat malfunction', 'Smart thermostat display is blank and unresponsive. Unable to control heating or cooling in the unit.', '303A', 'hvac', 'medium', 'Emily Davis', 'closed'),
      ('Common area carpet stain', 'Large coffee stain on the carpet in the second-floor hallway near the elevator. Needs professional cleaning.', '304B', 'general', 'low', 'Jason Martinez', 'completed')
    `);

    // --- FINANCIAL TRANSACTIONS (16) ---
    console.log('Seeding financial_transactions...');
    await pool.query(`
      INSERT INTO financial_transactions (description, amount, type, category, date, status) VALUES
      ('Monthly HOA dues - Unit 101A', 450.00, 'income', 'HOA Dues', '2026-04-01', 'completed'),
      ('Monthly HOA dues - Unit 102A', 450.00, 'income', 'HOA Dues', '2026-04-01', 'completed'),
      ('Monthly HOA dues - Unit 103A', 350.00, 'income', 'HOA Dues', '2026-04-01', 'completed'),
      ('Monthly HOA dues - Unit 104B', 525.00, 'income', 'HOA Dues', '2026-04-01', 'completed'),
      ('Monthly HOA dues - Unit 201A', 500.00, 'income', 'HOA Dues', '2026-04-01', 'pending'),
      ('Landscaping service - March', 2800.00, 'expense', 'Landscaping', '2026-03-28', 'completed'),
      ('Pool maintenance - quarterly', 1500.00, 'expense', 'Amenity Maintenance', '2026-03-15', 'completed'),
      ('Elevator inspection and repair', 3200.00, 'expense', 'Building Maintenance', '2026-03-10', 'completed'),
      ('Insurance premium - Q2 2026', 8500.00, 'expense', 'Insurance', '2026-04-01', 'completed'),
      ('Special assessment - Roof repair fund', 750.00, 'income', 'Special Assessment', '2026-03-20', 'completed'),
      ('Plumber service call - Unit 106B', 275.00, 'expense', 'Repairs', '2026-03-22', 'completed'),
      ('Security system monthly fee', 650.00, 'expense', 'Security', '2026-04-01', 'pending'),
      ('Late fee - Unit 302A', 75.00, 'income', 'Late Fees', '2026-03-15', 'completed'),
      ('Common area electricity - March', 1850.00, 'expense', 'Utilities', '2026-03-31', 'completed'),
      ('Parking permit renewal - Visitor passes', 200.00, 'income', 'Parking', '2026-03-25', 'completed'),
      ('Fire alarm system annual inspection', 1200.00, 'expense', 'Safety', '2026-03-05', 'completed')
    `);

    // --- VIOLATIONS (16) ---
    console.log('Seeding violations...');
    await pool.query(`
      INSERT INTO violations (title, description, unit_number, violation_type, severity, reported_by, status) VALUES
      ('Excessive noise after 10PM', 'Loud music and party noise reported coming from unit 104B after 10 PM on a weeknight, disturbing neighboring residents.', '104B', 'noise', 'medium', 'Linda Patel', 'warning_sent'),
      ('Unauthorized parking in fire lane', 'Silver Honda Civic parked in the fire lane near Building A entrance for over 3 hours. License plate ABC-1234.', '106B', 'parking', 'high', 'Maria Santos', 'resolved'),
      ('Uncut lawn and overgrown weeds', 'Front yard of unit 301A has not been maintained for several weeks. Grass is over 8 inches tall with visible weeds.', '301A', 'maintenance', 'low', 'James Mitchell', 'open'),
      ('Unleashed dog in common area', 'Large German Shepherd observed running off-leash in the community park area. Dog approached other residents aggressively.', '205B', 'pet', 'high', 'Karen Nguyen', 'warning_sent'),
      ('Unapproved satellite dish', 'A satellite dish has been mounted on the exterior balcony railing of unit 202A without prior architectural review approval.', '202A', 'architectural', 'medium', 'James Mitchell', 'escalated'),
      ('Trash bins left out past pickup day', 'Garbage bins have been left on the curb for three days after the scheduled trash pickup. Attracting pests.', '303A', 'trash', 'low', 'Patricia Hayes', 'resolved'),
      ('Late night construction noise', 'Power tool noise heard from unit 204B at 11:30 PM. Resident appears to be doing unauthorized renovation work after hours.', '204B', 'noise', 'high', 'Angela Brooks', 'open'),
      ('Double parking in visitor lot', 'Red Toyota Camry double-parked in the visitor parking area, blocking two spaces for most of the afternoon.', '102A', 'parking', 'medium', 'Daniel Foster', 'warning_sent'),
      ('Broken window not repaired', 'Unit 106B has had a cracked front window for over a month. No repair action has been taken despite notification.', '106B', 'maintenance', 'medium', 'Maria Santos', 'escalated'),
      ('Unauthorized pet in no-pet unit', 'Cat observed in the window of unit 103A. This building section has a no-pet policy per the lease agreement.', '103A', 'pet', 'medium', 'Robert Kim', 'open'),
      ('Exterior paint color violation', 'Front door of unit 203A painted bright red without architectural review. Community guidelines specify neutral earth tones only.', '203A', 'architectural', 'medium', 'James Mitchell', 'warning_sent'),
      ('Recycling contamination', 'Unit 105B repeatedly placing non-recyclable items in recycling bins. Waste management company issued a warning to the HOA.', '105B', 'trash', 'low', 'Maria Santos', 'resolved'),
      ('Barking dog complaints', 'Multiple neighbors have reported continuous barking from unit 201A during daytime hours when residents appear to be away.', '201A', 'noise', 'medium', 'Thomas Rivera', 'open'),
      ('Motorcycle parked on sidewalk', 'Black motorcycle consistently parked on the pedestrian sidewalk near Building B entrance, blocking wheelchair access.', '304B', 'parking', 'high', 'Karen Nguyen', 'warning_sent'),
      ('HVAC unit exterior disrepair', 'External HVAC condenser unit for 206B is visibly rusted and leaking refrigerant. Needs immediate attention.', '206B', 'maintenance', 'high', 'Christopher Lee', 'open'),
      ('Unapproved fence installation', 'Chain-link fence erected around unit 302A patio area without submitting an architectural review request.', '302A', 'architectural', 'high', 'James Mitchell', 'escalated')
    `);

    // --- MEETINGS (16) ---
    console.log('Seeding meetings...');
    await pool.query(`
      INSERT INTO meetings (title, description, date, time, location, type, status) VALUES
      ('Q2 Board Meeting', 'Quarterly board meeting to review finances, ongoing projects, and community concerns.', '2026-04-15', '7:00 PM', 'Sunset Ridge Clubhouse - Main Hall', 'board', 'scheduled'),
      ('Annual General Meeting 2026', 'Annual meeting for all homeowners to review yearly budget, elect new board members, and discuss community plans.', '2026-06-20', '6:00 PM', 'Sunset Ridge Clubhouse - Main Hall', 'annual', 'scheduled'),
      ('Emergency Session - Roof Repairs', 'Special meeting to discuss emergency roof repair funding and contractor selection for Building A.', '2026-04-08', '6:30 PM', 'Sunset Ridge Clubhouse - Conference Room B', 'special', 'completed'),
      ('Landscaping Committee Review', 'Monthly landscaping committee meeting to evaluate seasonal planting plans and irrigation system upgrade proposals.', '2026-04-20', '5:30 PM', 'Sunset Ridge Clubhouse - Conference Room A', 'committee', 'scheduled'),
      ('Q1 Board Meeting', 'Quarterly board meeting covering winter maintenance review and spring project planning.', '2026-01-18', '7:00 PM', 'Sunset Ridge Clubhouse - Main Hall', 'board', 'completed'),
      ('Budget Planning Committee', 'Committee meeting to draft the preliminary 2027 fiscal year budget for board review.', '2026-05-10', '4:00 PM', 'Sunset Ridge Clubhouse - Conference Room A', 'committee', 'scheduled'),
      ('Pool Season Preparation Meeting', 'Special meeting to discuss pool opening timeline, new safety rules, and lifeguard staffing.', '2026-05-01', '6:00 PM', 'Sunset Ridge Pool Pavilion', 'special', 'scheduled'),
      ('Architectural Review Committee', 'Monthly review of submitted architectural modification requests from residents.', '2026-04-12', '5:00 PM', 'Sunset Ridge Clubhouse - Conference Room B', 'committee', 'scheduled'),
      ('Safety and Security Review', 'Board sub-committee meeting to evaluate current security measures and review incident reports.', '2026-03-25', '7:00 PM', 'Sunset Ridge Clubhouse - Conference Room A', 'board', 'completed'),
      ('Community Social Planning', 'Committee meeting to plan summer social events including the annual BBQ and outdoor movie nights.', '2026-04-22', '6:00 PM', 'Sunset Ridge Clubhouse - Conference Room A', 'committee', 'scheduled'),
      ('Special Assessment Vote', 'Special meeting for homeowners to vote on the proposed special assessment for parking lot resurfacing.', '2026-03-10', '7:00 PM', 'Sunset Ridge Clubhouse - Main Hall', 'special', 'completed'),
      ('Q4 2025 Board Meeting', 'Year-end board meeting to finalize 2025 finances and approve 2026 operating budget.', '2025-12-15', '7:00 PM', 'Sunset Ridge Clubhouse - Main Hall', 'board', 'completed'),
      ('New Resident Orientation', 'Welcome meeting for new residents moving in during Q1 2026. Overview of community rules and amenities.', '2026-02-08', '10:00 AM', 'Sunset Ridge Clubhouse - Main Hall', 'special', 'completed'),
      ('Fitness Center Renovation Committee', 'Committee meeting to review contractor bids for the fitness center equipment upgrade project.', '2026-04-28', '5:30 PM', 'Sunset Ridge Fitness Center', 'committee', 'scheduled'),
      ('Holiday Decoration Guidelines', 'Board meeting to discuss and approve updated holiday decoration guidelines for common areas.', '2025-11-10', '6:30 PM', 'Sunset Ridge Clubhouse - Conference Room B', 'board', 'completed'),
      ('Emergency Preparedness Workshop', 'Special community-wide workshop on emergency preparedness procedures. Fire department guest speakers.', '2026-05-15', '2:00 PM', 'Sunset Ridge Clubhouse - Main Hall', 'special', 'scheduled')
    `);

    // --- DOCUMENTS (16) ---
    console.log('Seeding documents...');
    await pool.query(`
      INSERT INTO documents (title, content, category, author, status) VALUES
      ('Sunset Ridge Community Bylaws', 'Article I: Name and Location. The name of this association shall be the Sunset Ridge Community Association, located at 123-127 Sunset Ridge Blvd. Article II: Purpose. The Association is organized to manage, maintain, and improve the common areas and facilities of the Sunset Ridge Community. Article III: Membership. Every property owner within Sunset Ridge is automatically a member of the Association. Article IV: Meetings. The Board shall hold regular meetings no less than quarterly. Article V: Assessments. The Board shall have the authority to levy and collect assessments to fund community operations.', 'bylaws', 'David Chen', 'active'),
      ('Board Meeting Minutes - Q1 2026', 'Date: January 18, 2026. Attendees: David Chen (President), Maria Santos (VP), James Mitchell (Secretary), and 4 board members. Agenda: 1) Winter maintenance review - snow removal costs came in under budget by $2,400. 2) Spring project planning - approved landscaping upgrade for Building B common area ($15,000 budget). 3) Security camera upgrade proposal tabled for further review. 4) Treasurer report: Reserve fund balance at $142,500. Next meeting scheduled for April 15, 2026.', 'minutes', 'James Mitchell', 'active'),
      ('Pet Policy - Updated 2026', 'Sunset Ridge Community Pet Policy: 1) Maximum of two pets per household. 2) Dogs must be leashed in all common areas. 3) Pet waste must be cleaned up immediately. 4) Aggressive breeds require additional liability insurance. 5) No pets over 50 lbs in Building A (condo units). 6) All pets must be registered with the management office. 7) Excessive barking resulting in three or more complaints will result in a formal violation notice. Violations may result in fines ranging from $50 to $500.', 'policy', 'Maria Santos', 'active'),
      ('2026 Annual Budget Report', 'Sunset Ridge Community Association - Fiscal Year 2026 Budget. Total Revenue: $385,000. Breakdown: HOA Dues $340,000, Special Assessments $25,000, Late Fees $5,000, Amenity Fees $15,000. Total Expenses: $362,000. Breakdown: Landscaping $35,000, Building Maintenance $85,000, Insurance $34,000, Utilities $48,000, Management Fees $60,000, Reserve Contributions $55,000, Security $18,000, Administrative $12,000, Contingency $15,000. Net Surplus: $23,000.', 'financial', 'David Chen', 'active'),
      ('Master Insurance Policy Summary', 'Policy Number: HOA-2026-SR-4451. Provider: Community Shield Insurance Co. Coverage Period: January 1 - December 31, 2026. Property Coverage: $12,500,000. General Liability: $5,000,000 per occurrence. Directors and Officers: $2,000,000. Workers Compensation: Per statutory requirements. Umbrella Policy: $10,000,000. Deductible: $10,000 per claim. Annual Premium: $34,000. Note: Individual unit owners are responsible for HO-6 policies covering interior improvements and personal property.', 'legal', 'David Chen', 'active'),
      ('Spring Community Newsletter', 'Welcome to spring at Sunset Ridge! Highlights: Pool opens May 25th - new extended hours until 9 PM. Community BBQ scheduled for June 15th. Landscaping upgrades beginning in Building B area. Reminder: Spring assessments due April 1st. New fitness center equipment arriving in May. Board elections will be held at the Annual Meeting on June 20th - nominations are open. Contact the management office if you are interested in serving on the board.', 'notice', 'Maria Santos', 'active'),
      ('Parking Regulations', 'Sunset Ridge Parking Policy: 1) Each unit is assigned one designated parking spot. 2) Additional spots available on a first-come basis for $75/month. 3) Visitor parking limited to 24 hours. 4) No commercial vehicles over 10,000 lbs. 5) No vehicle repairs in the parking areas. 6) Vehicles without valid permits will be towed at owner expense. 7) Speed limit in parking areas is 10 MPH. 8) Motorcycles must park in designated motorcycle areas only. Towing company: Rapid Tow Services (555) 800-8000.', 'policy', 'James Mitchell', 'active'),
      ('Board Meeting Minutes - Emergency Session April 2026', 'Date: April 8, 2026. Emergency Session regarding Building A roof damage from recent storm. Attendees: Full board present. Resolution: Approved emergency repair budget of $45,000 from reserve fund. Contractor: Summit Roofing selected from three bids. Timeline: Repairs to begin April 14, estimated completion within 3 weeks. Temporary measures: Tarps installed on affected areas. Affected units 101A and 102A to receive assessment credits for inconvenience. Insurance claim filed.', 'minutes', 'James Mitchell', 'active'),
      ('Architectural Modification Guidelines', 'All exterior modifications require written approval from the Architectural Review Committee before work begins. Submittal requirements: 1) Completed application form. 2) Detailed description of proposed work. 3) Material samples or specifications. 4) Contractor information and insurance certificates. 5) Project timeline. Review period: 30 days from complete submission. Approved colors: See attached palette (earth tones, muted blues, sage greens). Fencing: Maximum 6 feet, wood or vinyl only, no chain-link. Decks: Must match existing building materials.', 'policy', 'James Mitchell', 'active'),
      ('2025 Year-End Financial Statement', 'Sunset Ridge Community Association - Year-End Financial Statement 2025. Total Revenue Collected: $372,500. Total Expenses: $348,200. Net Income: $24,300. Reserve Fund Balance: $142,500. Operating Account Balance: $38,700. Outstanding Receivables: $4,200 (3 units with past-due balances). Major Capital Expenditures: Elevator modernization $28,000, Lobby renovation $15,500, Security system upgrade $8,200. Audit Status: Clean audit opinion received from Morrison & Associates CPA.', 'financial', 'David Chen', 'active'),
      ('Amenity Usage Rules', 'Sunset Ridge Amenity Guidelines: Pool: Open May 25 - September 15, hours 8AM-9PM, max capacity 40 persons, no glass containers, children under 12 must be supervised. Fitness Center: Open 5AM-11PM daily, wipe equipment after use, no personal trainers without approval. Clubhouse Rental: Available to residents for $150/event, $200 refundable deposit, max capacity 80 persons, must book 14 days in advance. BBQ Area: First-come first-served, clean grill after use, propane provided. Tennis Court: Reserve online, 1-hour slots, proper attire required.', 'policy', 'Maria Santos', 'active'),
      ('Legal Notice - Assessment Lien Filing', 'Notice is hereby given that the Sunset Ridge Community Association has filed an assessment lien against the property at 127 Sunset Ridge Blvd, Unit 302A, for unpaid HOA assessments totaling $2,700.00 plus late fees of $225.00 and legal costs of $350.00, for a total of $3,275.00. The property owner has 30 days from the date of this notice to satisfy the outstanding balance in full. Failure to do so may result in foreclosure proceedings as permitted under state law and the Association governing documents.', 'legal', 'David Chen', 'active'),
      ('Emergency Contact Directory', 'Sunset Ridge Emergency Contacts: Management Office: (555) 200-1000 (M-F 8AM-5PM). After-Hours Emergency: (555) 200-1001. Fire/Police/Ambulance: 911. Non-Emergency Police: (555) 300-2000. Water Main Shutoff: Maintenance on call (555) 200-1002. Gas Emergency: City Gas Co (555) 400-3000. Poison Control: 1-800-222-1222. Nearest Hospital: Sunset Memorial, 500 Healthcare Blvd, (555) 500-4000. Board President (David Chen): (555) 200-1010.', 'notice', 'Maria Santos', 'active'),
      ('Reserve Study Summary 2026', 'Sunset Ridge Community Association Reserve Study - Executive Summary. Prepared by Reserve Analysts Inc. Total replacement cost of all common components: $2,850,000. Current reserve balance: $142,500. Recommended annual contribution: $62,000. Percent funded: 38% (below recommended 70%). Critical components due for replacement within 5 years: Roof (Building A) $120,000, Parking lot resurfacing $85,000, Pool equipment $25,000, Elevator modernization Phase 2 $35,000. Recommendation: Increase monthly assessments by $15/unit or levy special assessment.', 'financial', 'David Chen', 'draft'),
      ('Board Meeting Minutes - Q4 2025', 'Date: December 15, 2025. Attendees: David Chen (President), Maria Santos (VP), James Mitchell (Secretary), and 5 board members. Agenda: 1) 2025 year-end financial review - surplus of $24,300 to be added to reserves. 2) 2026 budget approved unanimously. 3) Holiday lighting contract awarded to Festive Displays Inc for $3,200. 4) Discussion on parking lot condition - reserve study to be commissioned. 5) New vendor approved: Green Valley Landscaping. Meeting adjourned at 8:45 PM.', 'minutes', 'James Mitchell', 'archived'),
      ('Community Rules and Regulations', 'Sunset Ridge Community Rules: Quiet Hours: 10PM - 7AM weekdays, 11PM - 8AM weekends. Moving: Allowed 8AM-6PM Mon-Sat, elevator must be reserved. Trash: Place bins curbside evening before pickup, remove within 12 hours. Grills: Charcoal grills prohibited on balconies, gas grills permitted with 10-foot clearance. Common Areas: No smoking within 25 feet of buildings. Deliveries: Large packages can be held at management office. Laundry: Shared facility hours 7AM-10PM, remove items promptly. Guests: Overnight guests must be registered if staying more than 7 consecutive days.', 'bylaws', 'James Mitchell', 'active')
    `);

    // --- AMENITY BOOKINGS (16) ---
    console.log('Seeding amenity_bookings...');
    await pool.query(`
      INSERT INTO amenity_bookings (amenity_name, booked_by, booking_date, start_time, end_time, purpose, status) VALUES
      ('Clubhouse - Main Hall', 'Sarah Thompson', '2026-04-18', '6:00 PM', '10:00 PM', 'Birthday party celebration', 'confirmed'),
      ('Tennis Court A', 'Robert Kim', '2026-04-12', '9:00 AM', '10:00 AM', 'Recreational tennis match', 'confirmed'),
      ('Pool Area', 'Linda Patel', '2026-06-01', '1:00 PM', '4:00 PM', 'Children swim party', 'pending'),
      ('BBQ Pavilion', 'Michael O''Brien', '2026-04-20', '11:00 AM', '3:00 PM', 'Family cookout gathering', 'confirmed'),
      ('Fitness Center - Group Room', 'Jennifer Wu', '2026-04-14', '7:00 AM', '8:00 AM', 'Yoga class for residents', 'confirmed'),
      ('Clubhouse - Conference Room A', 'William Garcia', '2026-04-16', '2:00 PM', '4:00 PM', 'Book club meeting', 'confirmed'),
      ('Tennis Court B', 'Karen Nguyen', '2026-04-13', '4:00 PM', '5:00 PM', 'Tennis lesson with instructor', 'confirmed'),
      ('Clubhouse - Main Hall', 'Thomas Rivera', '2026-05-05', '5:00 PM', '9:00 PM', 'Retirement dinner celebration', 'pending'),
      ('Pool Area', 'Patricia Hayes', '2026-07-04', '10:00 AM', '6:00 PM', 'Fourth of July pool party', 'pending'),
      ('BBQ Pavilion', 'Daniel Foster', '2026-04-26', '12:00 PM', '4:00 PM', 'Neighborhood potluck', 'confirmed'),
      ('Fitness Center - Group Room', 'Angela Brooks', '2026-04-15', '6:00 PM', '7:00 PM', 'Pilates class', 'confirmed'),
      ('Clubhouse - Conference Room B', 'Christopher Lee', '2026-04-17', '10:00 AM', '12:00 PM', 'Remote work meeting', 'confirmed'),
      ('Tennis Court A', 'Rebecca Taylor', '2026-04-19', '8:00 AM', '9:00 AM', 'Morning doubles match', 'confirmed'),
      ('Clubhouse - Main Hall', 'Emily Davis', '2026-05-20', '6:00 PM', '11:00 PM', 'Graduation party', 'pending'),
      ('BBQ Pavilion', 'Jason Martinez', '2026-04-27', '4:00 PM', '7:00 PM', 'Sunday evening grilling', 'cancelled'),
      ('Pool Area', 'Karen Nguyen', '2026-06-15', '2:00 PM', '5:00 PM', 'Summer kickoff swim', 'pending')
    `);

    // --- VENDORS (16) ---
    console.log('Seeding vendors...');
    await pool.query(`
      INSERT INTO vendors (name, service_type, phone, email, rating, contract_status, hourly_rate) VALUES
      ('Ace Plumbing Solutions', 'plumbing', '(555) 310-1001', 'service@aceplumbing.com', 4.5, 'active', 95.00),
      ('Bright Spark Electric', 'electrical', '(555) 310-2002', 'dispatch@brightspark.com', 4.7, 'active', 110.00),
      ('Green Valley Landscaping', 'landscaping', '(555) 310-3003', 'info@greenvalleyls.com', 4.3, 'active', 65.00),
      ('Sparkle Clean Services', 'cleaning', '(555) 310-4004', 'bookings@sparkleclean.com', 4.1, 'active', 45.00),
      ('Guardian Security Group', 'security', '(555) 310-5005', 'ops@guardiansec.com', 4.6, 'active', 55.00),
      ('ProCoat Painters', 'painting', '(555) 310-6006', 'quotes@procoat.com', 4.4, 'active', 75.00),
      ('Summit Roofing Co', 'roofing', '(555) 310-7007', 'projects@summitroofing.com', 4.8, 'active', 120.00),
      ('FlowMaster Plumbing', 'plumbing', '(555) 311-1001', 'hello@flowmaster.com', 3.9, 'expired', 85.00),
      ('PowerGrid Electrical', 'electrical', '(555) 311-2002', 'service@powergrid.com', 4.2, 'pending', 105.00),
      ('EverGreen Lawn Care', 'landscaping', '(555) 311-3003', 'schedule@evergreencare.com', 4.0, 'expired', 55.00),
      ('Diamond Shine Janitorial', 'cleaning', '(555) 311-4004', 'info@diamondshine.com', 4.5, 'pending', 50.00),
      ('Watchful Eye Security', 'security', '(555) 311-5005', 'contact@watchfuleye.com', 3.8, 'expired', 48.00),
      ('ColorCraft Painting', 'painting', '(555) 311-6006', 'estimate@colorcraft.com', 4.6, 'active', 80.00),
      ('AllWeather Roofing', 'roofing', '(555) 311-7007', 'bids@allweather.com', 4.3, 'pending', 115.00),
      ('Rapid Response Plumbing', 'plumbing', '(555) 312-1001', 'emergency@rapidplumb.com', 4.7, 'active', 125.00),
      ('Terra Firma Landscaping', 'landscaping', '(555) 312-3003', 'design@terrafirma.com', 4.9, 'active', 70.00)
    `);

    // --- COMMUNICATIONS (16) ---
    console.log('Seeding communications...');
    await pool.query(`
      INSERT INTO communications (title, content, type, audience, priority, status) VALUES
      ('Spring Assessment Reminder', 'This is a friendly reminder that Q2 2026 HOA assessments are due on April 1st. Please ensure your payment is submitted on time to avoid late fees. Online payment is available through the resident portal. Contact the management office with any questions.', 'notice', 'residents', 'high', 'sent'),
      ('Pool Season Opening Announcement', 'We are excited to announce that the Sunset Ridge community pool will open for the 2026 season on May 25th! This year we are offering extended hours until 9 PM. New lounge furniture has been ordered and pool resurfacing is complete. See you poolside!', 'announcement', 'all', 'normal', 'scheduled'),
      ('April Community Newsletter', 'Sunset Ridge Monthly Newsletter - April 2026. In this issue: Board election nominations now open, roof repair update for Building A, new fitness center equipment preview, upcoming community BBQ details, landscaping improvement plans for Building B common area, and a spotlight on our newest residents.', 'newsletter', 'all', 'normal', 'sent'),
      ('Emergency - Water Main Repair', 'URGENT: A water main break has been detected near Building B. Water service will be temporarily interrupted from 10 PM tonight until approximately 6 AM tomorrow morning. Please store water for essential needs. Bottled water will be available in the clubhouse lobby. We apologize for the inconvenience.', 'alert', 'all', 'urgent', 'sent'),
      ('Board Election Nominations Open', 'The annual board election will take place at the June 20th Annual General Meeting. We have three open seats this year. If you are interested in serving on the board, please submit your nomination by May 15th. Nomination forms are available at the management office and online.', 'announcement', 'residents', 'normal', 'sent'),
      ('Board Meeting Summary - April', 'Summary of the April 15 board meeting: Roof repair contractor selected for Building A, pool season preparation approved, Q1 financial review completed showing positive variance, parking lot resurfacing special assessment discussion tabled to next meeting. Full minutes will be posted to the document portal within 7 days.', 'notice', 'board', 'normal', 'draft'),
      ('Security Alert - Package Theft', 'We have received reports of package theft near the Building A entrance. Please consider having packages delivered to the management office for safekeeping. We are reviewing security camera footage and working with local police. If you have any information, please contact the management office immediately.', 'alert', 'residents', 'high', 'sent'),
      ('Fitness Center Equipment Upgrade', 'Great news! New fitness center equipment will be arriving during the first week of May. The fitness center will be closed May 4-6 for installation. New additions include two Peloton bikes, a cable machine, and updated free weight sets. Thank you for your patience during the upgrade.', 'announcement', 'all', 'normal', 'scheduled'),
      ('Landscaping Schedule Update', 'Attention residents: The spring landscaping maintenance schedule begins April 14. Crews will be working Monday through Friday, 8 AM to 4 PM. Building A grounds will be completed first, followed by Building B and then the townhome section. Please keep pets and children away from active work areas.', 'notice', 'residents', 'normal', 'sent'),
      ('Annual BBQ Save the Date', 'Save the date! The Sunset Ridge Annual Summer BBQ will be held on Saturday, June 15th from 12 PM to 5 PM at the BBQ Pavilion and pool area. Burgers, hot dogs, and drinks provided. Bring a side dish or dessert to share. RSVP by June 1st to the management office. Family and friends welcome!', 'announcement', 'all', 'normal', 'scheduled'),
      ('Maintenance Staff Update', 'We are pleased to welcome Carlos Mendez as our new on-site maintenance technician. Carlos brings 15 years of building maintenance experience. He will be available Monday through Friday, 8 AM to 4 PM. After-hours emergencies should still be directed to the emergency hotline at (555) 200-1001.', 'notice', 'staff', 'normal', 'sent'),
      ('Trash Collection Schedule Change', 'Please note that trash collection for the week of April 20th will be shifted by one day due to the Monday holiday. Regular trash pickup will occur on Tuesday and Friday instead of Monday and Thursday. Recycling pickup remains on Wednesday as usual. Please adjust your bin placement accordingly.', 'notice', 'residents', 'normal', 'sent'),
      ('Budget Planning Input Request', 'The Budget Planning Committee is requesting resident input for the 2027 fiscal year budget. If you have suggestions for community improvements or concerns about current spending, please submit your feedback in writing to the management office by May 1st, or attend the Budget Committee meeting on May 10th.', 'announcement', 'residents', 'normal', 'sent'),
      ('Elevator Maintenance Notice', 'The Building A elevator will undergo scheduled maintenance on April 25th from 9 AM to 12 PM. The elevator will be out of service during this time. Residents with mobility concerns should contact the management office in advance to arrange assistance. We recommend planning accordingly.', 'notice', 'residents', 'high', 'scheduled'),
      ('Welcome New Residents - Q1 2026', 'The Sunset Ridge community would like to welcome our newest residents who moved in during Q1 2026: Emily Davis (Unit 303A) and Daniel Foster (Unit 204B). If you see them around the community, please give them a warm welcome! New resident orientation packets are available at the management office.', 'newsletter', 'all', 'low', 'sent'),
      ('Holiday Office Hours', 'The Sunset Ridge management office will observe modified hours during the upcoming holiday weekend. Friday April 17th: Closed. Saturday April 18th: Closed. Regular hours resume Monday April 20th at 8 AM. For emergencies during the closure, please call the after-hours line at (555) 200-1001.', 'notice', 'all', 'normal', 'sent')
    `);

    // --- ARCHITECTURAL REVIEWS (16) ---
    console.log('Seeding architectural_reviews...');
    await pool.query(`
      INSERT INTO architectural_reviews (title, description, unit_number, requested_by, modification_type, estimated_cost, status) VALUES
      ('Patio deck addition', 'Requesting approval to build a 12x14 composite deck attached to the rear of the townhouse unit. Materials: Trex composite decking in Saddle color with aluminum railing.', '201A', 'Karen Nguyen', 'deck', 8500.00, 'approved'),
      ('Front door replacement', 'Replace existing wooden front door with a fiberglass door in mahogany finish. Includes new brushed nickel hardware and matching sidelight panel.', '104B', 'Michael O''Brien', 'exterior', 2200.00, 'approved'),
      ('Bathroom remodel', 'Full master bathroom renovation including new tile, vanity, toilet, and walk-in shower conversion from bathtub. All work interior only.', '102A', 'Robert Kim', 'interior', 15000.00, 'approved'),
      ('Privacy fence installation', 'Install 6-foot vinyl privacy fence around the rear patio area. White vinyl material to match community standards. Professional installation.', '203A', 'Patricia Hayes', 'fence', 4200.00, 'pending'),
      ('Solar panel installation', 'Proposal to install a 5kW rooftop solar panel system on the south-facing roof section. Includes battery storage and grid tie-in. Licensed contractor certified by state energy board.', '301A', 'Rebecca Taylor', 'exterior', 18000.00, 'revision_needed'),
      ('Landscape redesign', 'Complete front yard redesign replacing grass with drought-tolerant native plants, decorative gravel, and drip irrigation system. Includes removal of two dead shrubs.', '303A', 'Emily Davis', 'landscaping', 3500.00, 'approved'),
      ('Window replacement', 'Replace all 8 single-pane windows with double-pane energy-efficient vinyl windows. White frame to match existing building exterior.', '106B', 'William Garcia', 'exterior', 12000.00, 'pending'),
      ('Kitchen renovation', 'Remodel kitchen including new cabinetry, granite countertops, tile backsplash, and updated lighting fixtures. No structural modifications.', '205B', 'Angela Brooks', 'interior', 22000.00, 'approved'),
      ('Retaining wall construction', 'Build a 30-foot decorative stone retaining wall along the sloped side yard to prevent soil erosion and create a level garden area.', '301A', 'Rebecca Taylor', 'structural', 6800.00, 'pending'),
      ('Balcony enclosure', 'Enclose the existing 8x6 balcony with aluminum-framed glass panels to create a three-season sunroom. Removable panels for summer use.', '202A', 'Thomas Rivera', 'exterior', 9500.00, 'denied'),
      ('Wooden fence replacement', 'Replace deteriorating 20-year-old wooden fence with new cedar fence, same height and style. Stain color: Natural Cedar.', '204B', 'Daniel Foster', 'fence', 3800.00, 'approved'),
      ('Composite deck resurfacing', 'Remove and replace worn deck boards on existing 10x12 deck with new composite material. Keep existing frame and railing structure.', '202A', 'Thomas Rivera', 'deck', 4500.00, 'approved'),
      ('Exterior paint update', 'Repaint entire exterior of townhouse unit. Proposed colors: Benjamin Moore Revere Pewter (body), White Dove (trim), Wrought Iron (front door).', '304B', 'Jason Martinez', 'exterior', 5500.00, 'pending'),
      ('Garden shed installation', 'Install a 6x8 prefabricated storage shed in the backyard for garden tool storage. Material: wood with shingle roof to match house.', '303A', 'Emily Davis', 'landscaping', 2800.00, 'revision_needed'),
      ('Load-bearing wall removal', 'Remove the load-bearing wall between the kitchen and living room to create an open floor plan. Structural engineer assessment and permit included.', '105B', 'Jennifer Wu', 'structural', 8500.00, 'denied'),
      ('Pergola construction', 'Build a 10x10 cedar pergola over the back patio with climbing vine support. Natural stain finish. Anchored to existing concrete patio.', '201A', 'Karen Nguyen', 'deck', 5200.00, 'pending')
    `);

    // --- EMERGENCY PLANS (16) ---
    console.log('Seeding emergency_plans...');
    await pool.query(`
      INSERT INTO emergency_plans (title, description, emergency_type, severity, contact_person, contact_phone, status) VALUES
      ('Building Fire Evacuation Plan', 'Complete fire evacuation procedures for all three buildings. Exit routes posted on each floor. Assembly points designated in the main parking lot, south side. Fire extinguishers located on each floor near elevators and stairwells. Annual fire drill required. Smoke detectors tested quarterly. Fire department response time: estimated 4 minutes from Station 12.', 'fire', 'critical', 'David Chen', '(555) 200-1010', 'active'),
      ('Flood Response Protocol', 'Procedures for responding to flooding events including heavy rainfall, pipe bursts, and storm surge. Sandbags stored in maintenance shed B. Sump pumps available for basement units. Residents in ground-floor units should elevate valuables. Emergency water extraction service on retainer with AquaDry Services. Insurance documentation procedures outlined for affected residents.', 'flood', 'high', 'Maria Santos', '(555) 200-1011', 'active'),
      ('Earthquake Safety Procedures', 'Drop, Cover, and Hold On protocol for all residents. Structural assessment team on call through Summit Engineering. Gas shut-off valve locations marked with yellow tags on each building. Post-quake inspection checklist maintained by facilities manager. Emergency supply kits located in each building lobby. Communication plan uses text alert system for all registered residents.', 'earthquake', 'critical', 'David Chen', '(555) 200-1010', 'active'),
      ('Extended Power Outage Plan', 'Protocol for power outages exceeding 4 hours. Emergency generator powers common area lighting, elevators (limited), and sump pumps. Generator fuel supply: 48 hours at current capacity. Portable charging stations available in the clubhouse. Refrigeration advisory issued after 4 hours. Elderly and medical-dependent residents identified and prioritized for wellness checks.', 'power_outage', 'high', 'James Mitchell', '(555) 200-1012', 'active'),
      ('Gas Leak Emergency Response', 'Immediate evacuation protocol for suspected gas leaks. Do not use light switches, phones, or any electrical devices. Exit building immediately. Assembly at the tennis courts (upwind location). Call 911 first, then City Gas Co emergency line. Maintenance team trained in main gas shut-off locations for each building. Gas detectors installed in all basement and utility areas, tested monthly.', 'gas_leak', 'critical', 'David Chen', '(555) 200-1010', 'active'),
      ('Severe Weather Preparedness', 'Tornado, hurricane-force wind, and severe thunderstorm procedures. Shelter-in-place locations: Building A basement, Building B interior hallways, clubhouse lower level. Weather radio in management office monitored during watches and warnings. Tree trimming maintained to reduce wind damage risk. Loose outdoor items must be secured when warnings are issued.', 'severe_weather', 'high', 'Maria Santos', '(555) 200-1011', 'active'),
      ('Security Threat Response', 'Procedures for responding to active security threats, suspicious persons, or criminal activity. Lockdown protocol: secure all building entrances, residents shelter in units. Security camera monitoring activated at management office. Direct communication line to local police precinct. Panic buttons installed at management office and clubhouse front desk. Annual security awareness training offered to residents.', 'security', 'critical', 'James Mitchell', '(555) 200-1012', 'active'),
      ('Annual Fire Drill - Spring 2026', 'Scheduled fire drill for all buildings on May 15, 2026 at 2:00 PM. Coordination with Fire Station 12 confirmed. All residents will be notified 48 hours in advance. Elevator recall systems will be tested. Fire alarm systems will sound for approximately 10 minutes. Board members and volunteers to serve as floor wardens. Post-drill assessment meeting at 3:00 PM in the clubhouse.', 'fire', 'medium', 'Maria Santos', '(555) 200-1011', 'drill_scheduled'),
      ('Flood Sensor System Update', 'Current flood sensors in the Building A basement are past their recommended replacement date. Sensors were installed in 2019 and have a 5-year recommended lifespan. Budget request submitted for replacement cost of $2,400. Temporary manual monitoring checklist in place for maintenance staff. Weekly basement inspections increased to twice weekly during rainy season.', 'flood', 'medium', 'James Mitchell', '(555) 200-1012', 'needs_update'),
      ('Emergency Generator Maintenance', 'The community emergency generator requires scheduled maintenance and load testing. Last test: January 2026. Manufacturer recommends quarterly testing under full load. Diesel fuel supply to be verified and topped off monthly. Current fuel level: 75%. Automatic transfer switch tested satisfactorily. Battery backup for generator start: replaced December 2025.', 'power_outage', 'medium', 'James Mitchell', '(555) 200-1012', 'active'),
      ('Earthquake Drill - Summer 2026', 'Earthquake preparedness drill planned for July 2026 in conjunction with the statewide ShakeOut event. All residents encouraged to participate. Drill will include Drop-Cover-Hold practice, building evacuation, and communication system test. First aid stations will be set up at assembly points. Volunteers needed for search and rescue simulation.', 'earthquake', 'medium', 'David Chen', '(555) 200-1010', 'drill_scheduled'),
      ('Gas Detection System Upgrade', 'Proposal to upgrade all gas detection sensors to smart-connected models that send instant alerts to the management office and local fire department. Current system requires manual checking. Estimated cost: $8,500 for all three buildings. Vendor quote received from SafeAir Detection Systems. Board review pending at next meeting.', 'gas_leak', 'high', 'Maria Santos', '(555) 200-1011', 'needs_update'),
      ('Winter Storm Preparedness', 'Cold weather and ice storm procedures. Salt and sand reserves maintained in maintenance shed A (current stock: 4 tons). Snow removal contract active with Peterson Plowing. Priority clearance: emergency exits, main walkways, parking lot entrances. Pipe freeze prevention: heat tape on all exposed pipes, cabinet advisory sent to residents when temps drop below 20F.', 'severe_weather', 'medium', 'James Mitchell', '(555) 200-1012', 'active'),
      ('Suspicious Activity Protocol', 'Step-by-step guide for residents and staff when observing suspicious activity. Do not confront individuals. Note physical descriptions, vehicle information, and direction of travel. Call management office during business hours or police non-emergency line. If immediate danger, call 911. Security camera footage preservation procedure: contact management office within 24 hours to ensure footage is saved before auto-delete cycle.', 'security', 'medium', 'David Chen', '(555) 200-1010', 'active'),
      ('Medical Emergency Response', 'While not a community-wide emergency, protocol for assisting residents with medical emergencies. AED units located in Building A lobby, Building B lobby, clubhouse entrance, and fitness center. CPR-trained staff on duty during business hours. Emergency medical information forms on file for consenting residents. Nearest hospital: Sunset Memorial, 2.3 miles, average ambulance response time 6 minutes.', 'security', 'high', 'Maria Santos', '(555) 200-1011', 'active'),
      ('Community Communication During Emergencies', 'Multi-channel emergency communication plan. Primary: Mass text alert system (residents must opt in via portal). Secondary: Email blast to all registered addresses. Tertiary: Physical notices posted at building entrances and clubhouse. Social media: Updates posted to private Sunset Ridge Facebook group. Bullhorn available in management office for on-site announcements. All communications to be authorized by board president or property manager.', 'severe_weather', 'low', 'Maria Santos', '(555) 200-1011', 'active')
    `);

    // --- PARKING (16) ---
    console.log('Seeding parking...');
    await pool.query(`
      INSERT INTO parking (spot_number, unit_number, vehicle_make, vehicle_model, vehicle_color, license_plate, permit_type, status) VALUES
      ('A-01', '101A', 'Toyota', 'Camry', 'Silver', 'ABC-1234', 'resident', 'active'),
      ('A-02', '102A', 'Honda', 'Accord', 'Black', 'DEF-5678', 'resident', 'active'),
      ('A-03', '103A', 'Hyundai', 'Elantra', 'White', 'GHI-9012', 'resident', 'active'),
      ('A-04', '104B', 'Ford', 'F-150', 'Blue', 'JKL-3456', 'resident', 'active'),
      ('A-05', '105B', 'Tesla', 'Model 3', 'Red', 'MNO-7890', 'resident', 'active'),
      ('A-06', '106B', 'Chevrolet', 'Malibu', 'Gray', 'PQR-1122', 'resident', 'active'),
      ('B-01', '201A', 'BMW', '3 Series', 'White', 'STU-3344', 'resident', 'active'),
      ('B-02', '202A', 'Subaru', 'Outback', 'Green', 'VWX-5566', 'resident', 'active'),
      ('B-03', '203A', 'Nissan', 'Rogue', 'Silver', 'YZA-7788', 'resident', 'active'),
      ('B-04', '204B', 'Jeep', 'Cherokee', 'Black', 'BCD-9900', 'resident', 'active'),
      ('B-05', '205B', 'Mazda', 'CX-5', 'Red', 'EFG-2211', 'resident', 'active'),
      ('B-06', '206B', 'Volkswagen', 'Jetta', 'Blue', 'HIJ-4433', 'resident', 'active'),
      ('C-01', '301A', 'Lexus', 'RX 350', 'Pearl White', 'KLM-6655', 'resident', 'active'),
      ('V-01', NULL, 'Kia', 'Sportage', 'Orange', 'NOP-8877', 'visitor', 'active'),
      ('V-02', NULL, 'Chevrolet', 'Equinox', 'Gray', 'QRS-0099', 'visitor', 'expired'),
      ('H-01', '303A', 'Toyota', 'RAV4', 'Silver', 'TUV-2244', 'handicap', 'active'),
      ('R-01', '104B', 'Harley-Davidson', 'Sportster', 'Black', 'WXY-6688', 'reserved', 'active'),
      ('A-07', '304B', 'Honda', 'Civic', 'White', 'ZAB-8800', 'resident', 'suspended')
    `);

    console.log('Seed completed successfully!');
    console.log('Admin login: admin@hoamanager.com / password123');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seed();
