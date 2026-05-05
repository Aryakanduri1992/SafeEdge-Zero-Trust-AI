-- ============================================================================
-- LumeEdge Azure SQL Schema
-- Zero-Trust IoT Security Platform for Imagine Cup 2026
-- ============================================================================
-- Design Principles:
-- 1. Zero Trust: Every device has cryptographic identity
-- 2. Cost Optimized: Store ONLY aggregated data + security events
-- 3. No raw telemetry stored long-term
-- 4. Secure-by-design with least privilege
-- ============================================================================

-- ============================================================================
-- DEVICES TABLE
-- Stores registered IoT devices with their security status
-- ============================================================================
CREATE TABLE devices (
    id INT IDENTITY(1,1) PRIMARY KEY,
    device_id NVARCHAR(128) NOT NULL UNIQUE,          -- e.g., 'lumeedge-001'
    device_name NVARCHAR(256),                         -- Human-readable name
    device_type NVARCHAR(64) DEFAULT 'esp32',          -- Device type
    auth_type NVARCHAR(32) DEFAULT 'x509',             -- x509, sas, symmetric
    certificate_thumbprint NVARCHAR(64),               -- X.509 cert thumbprint
    organization_id NVARCHAR(128),                     -- Multi-org support
    location NVARCHAR(256),                            -- Physical location
    floor_id NVARCHAR(64),                             -- Floor plan reference
    
    -- Security Status
    status NVARCHAR(32) DEFAULT 'active',              -- active, blocked, quarantine
    trust_score DECIMAL(5,2) DEFAULT 100.00,           -- 0-100 trust score
    blocked_at DATETIME2,                              -- When device was blocked
    blocked_reason NVARCHAR(512),                      -- Why device was blocked
    quarantine_until DATETIME2,                        -- Auto-unblock time
    
    -- Rate Limiting
    message_count_minute INT DEFAULT 0,                -- Messages in current minute
    message_count_reset_at DATETIME2,                  -- When to reset counter
    
    -- Metadata
    firmware_version NVARCHAR(64),
    last_seen_at DATETIME2,
    last_ip_address NVARCHAR(45),                      -- IPv4 or IPv6
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    
    -- Indexes for common queries
    INDEX idx_device_status (status),
    INDEX idx_device_org (organization_id),
    INDEX idx_device_last_seen (last_seen_at DESC)
);

-- ============================================================================
-- TELEMETRY_AGGREGATES TABLE (Cost Optimized)
-- Stores ONLY aggregated telemetry data (1-minute / 5-minute windows)
-- Raw telemetry is processed in-memory and discarded
-- ============================================================================
CREATE TABLE telemetry_aggregates (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    device_id NVARCHAR(128) NOT NULL,
    
    -- Time Window
    window_start DATETIME2 NOT NULL,                   -- Start of aggregation window
    window_end DATETIME2 NOT NULL,                     -- End of aggregation window
    window_minutes INT DEFAULT 1,                      -- Window size (1 or 5 min)
    
    -- Aggregated Temperature
    temp_avg DECIMAL(6,2),
    temp_min DECIMAL(6,2),
    temp_max DECIMAL(6,2),
    
    -- Aggregated Humidity
    humidity_avg DECIMAL(5,2),
    humidity_min DECIMAL(5,2),
    humidity_max DECIMAL(5,2),
    
    -- Event Counts
    motion_events INT DEFAULT 0,                       -- Motion detections in window
    door_events INT DEFAULT 0,                         -- Door open/close events
    message_count INT DEFAULT 0,                       -- Total messages in window
    anomaly_count INT DEFAULT 0,                       -- Anomalies detected
    
    -- Signal Quality
    signal_avg INT,                                    -- Average RSSI
    signal_min INT,                                    -- Worst signal
    
    -- Battery
    battery_avg DECIMAL(5,2),
    battery_min DECIMAL(5,2),
    
    -- Metadata
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    
    -- Indexes
    INDEX idx_agg_device_window (device_id, window_start DESC),
    INDEX idx_agg_time (window_start DESC)
);

-- ============================================================================
-- DEVICE_HEALTH TABLE
-- Stores device health heartbeats and status
-- ============================================================================
CREATE TABLE device_health (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    device_id NVARCHAR(128) NOT NULL,
    
    -- Health Metrics
    uptime_seconds BIGINT,                             -- Device uptime
    free_memory_bytes BIGINT,                          -- Available memory
    cpu_usage_percent DECIMAL(5,2),                    -- CPU utilization
    battery_level DECIMAL(5,2),
    signal_strength INT,
    firmware_version NVARCHAR(64),
    
    -- Connection Info
    ip_address NVARCHAR(45),
    connection_type NVARCHAR(32),                      -- wifi, ethernet, cellular
    
    -- Status
    status NVARCHAR(32) DEFAULT 'healthy',             -- healthy, degraded, critical
    last_error NVARCHAR(512),
    
    -- Timestamps
    reported_at DATETIME2,                             -- When device reported
    received_at DATETIME2 DEFAULT GETUTCDATE(),
    
    INDEX idx_health_device (device_id, received_at DESC),
    INDEX idx_health_status (status)
);

-- ============================================================================
-- SECURITY_EVENTS TABLE
-- Stores all security-related events and alerts
-- ============================================================================
CREATE TABLE security_events (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    event_id NVARCHAR(64) NOT NULL UNIQUE,             -- UUID for event
    device_id NVARCHAR(128),                           -- Related device (nullable)
    
    -- Event Classification
    event_type NVARCHAR(64) NOT NULL,                  -- attack_detected, device_blocked, etc.
    severity NVARCHAR(16) NOT NULL,                    -- critical, high, medium, low, info
    category NVARCHAR(64),                             -- network, physical, authentication
    
    -- Event Details
    title NVARCHAR(256) NOT NULL,
    description NVARCHAR(MAX),
    source_ip NVARCHAR(45),
    target_resource NVARCHAR(256),
    
    -- Attack-specific fields
    attack_type NVARCHAR(64),                          -- replay, injection, dos, etc.
    attack_vector NVARCHAR(128),
    confidence_score DECIMAL(5,2),                     -- AI confidence 0-100
    
    -- Response Actions
    action_taken NVARCHAR(64),                         -- blocked, quarantined, alerted
    alert_sent BIT DEFAULT 0,
    alert_sent_at DATETIME2,
    phone_call_triggered BIT DEFAULT 0,
    
    -- Metadata
    raw_data NVARCHAR(MAX),                            -- Original event data (JSON)
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    resolved_at DATETIME2,
    resolved_by NVARCHAR(128),
    
    -- Indexes
    INDEX idx_security_device (device_id),
    INDEX idx_security_type (event_type),
    INDEX idx_security_severity (severity, created_at DESC),
    INDEX idx_security_time (created_at DESC)
);

-- ============================================================================
-- ATTACK_INCIDENTS TABLE
-- Stores confirmed attack incidents with full forensic data
-- ============================================================================
CREATE TABLE attack_incidents (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    incident_id NVARCHAR(64) NOT NULL UNIQUE,          -- UUID for incident
    
    -- Incident Classification
    attack_type NVARCHAR(64) NOT NULL,                 -- replay, dos, injection, spoofing
    severity NVARCHAR(16) NOT NULL,                    -- critical, high, medium
    status NVARCHAR(32) DEFAULT 'active',              -- active, mitigated, resolved
    
    -- Target Information
    target_device_id NVARCHAR(128),
    target_resource NVARCHAR(256),
    source_ip NVARCHAR(45),
    source_device_id NVARCHAR(128),                    -- If compromised device
    
    -- Attack Details
    title NVARCHAR(256) NOT NULL,
    description NVARCHAR(MAX),
    attack_vector NVARCHAR(256),
    indicators_of_compromise NVARCHAR(MAX),            -- JSON array of IOCs
    
    -- Detection
    detection_method NVARCHAR(64),                     -- rule_based, ml_model, manual
    detection_rule_id NVARCHAR(64),
    confidence_score DECIMAL(5,2),
    first_detected_at DATETIME2,
    
    -- Impact Assessment
    impact_level NVARCHAR(32),                         -- none, low, medium, high, critical
    affected_devices NVARCHAR(MAX),                    -- JSON array of device IDs
    data_compromised BIT DEFAULT 0,
    
    -- Response
    response_actions NVARCHAR(MAX),                    -- JSON array of actions taken
    blocked_at DATETIME2,
    mitigated_at DATETIME2,
    resolved_at DATETIME2,
    resolved_by NVARCHAR(128),
    
    -- Forensics
    forensic_data NVARCHAR(MAX),                       -- JSON with detailed forensics
    related_events NVARCHAR(MAX),                      -- JSON array of event_ids
    
    -- Timestamps
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    
    -- Indexes
    INDEX idx_incident_type (attack_type),
    INDEX idx_incident_status (status),
    INDEX idx_incident_severity (severity, created_at DESC),
    INDEX idx_incident_device (target_device_id)
);

-- ============================================================================
-- MESSAGE_TRACKING TABLE (For Replay Attack Detection)
-- Tracks recent message IDs to detect replay attacks
-- Auto-purged after 1 hour
-- ============================================================================
CREATE TABLE message_tracking (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    message_id NVARCHAR(128) NOT NULL,
    device_id NVARCHAR(128) NOT NULL,
    message_hash NVARCHAR(64),                         -- SHA-256 of payload
    device_timestamp DATETIME2,                        -- Timestamp from device
    received_at DATETIME2 DEFAULT GETUTCDATE(),
    
    INDEX idx_msg_id (message_id),
    INDEX idx_msg_device (device_id, received_at DESC),
    INDEX idx_msg_hash (message_hash),
    INDEX idx_msg_time (received_at)
);

-- ============================================================================
-- ANOMALY_RULES TABLE
-- Configurable rules for anomaly detection
-- ============================================================================
CREATE TABLE anomaly_rules (
    id INT IDENTITY(1,1) PRIMARY KEY,
    rule_id NVARCHAR(64) NOT NULL UNIQUE,
    rule_name NVARCHAR(128) NOT NULL,
    description NVARCHAR(512),
    
    -- Rule Configuration
    rule_type NVARCHAR(32) NOT NULL,                   -- threshold, pattern, ml_model, rate
    metric NVARCHAR(64) NOT NULL,                      -- temperature, frequency, etc.
    operator NVARCHAR(16),                             -- gt, lt, eq, between, pattern
    threshold_value DECIMAL(12,4),
    threshold_min DECIMAL(12,4),
    threshold_max DECIMAL(12,4),
    pattern_regex NVARCHAR(512),
    
    -- Time-based rules
    time_window_minutes INT DEFAULT 5,                 -- Evaluation window
    min_occurrences INT DEFAULT 1,                     -- Min events to trigger
    
    -- Rate limiting rules
    rate_limit_count INT,                              -- Max messages
    rate_limit_window_seconds INT,                     -- In time window
    
    -- Response Configuration
    severity NVARCHAR(16) DEFAULT 'medium',
    auto_block BIT DEFAULT 0,                          -- Auto-block device
    auto_quarantine_minutes INT,                       -- Auto-quarantine duration
    trigger_alert BIT DEFAULT 1,
    trigger_phone_call BIT DEFAULT 0,
    
    -- Status
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    
    INDEX idx_rule_active (is_active),
    INDEX idx_rule_type (rule_type)
);

-- ============================================================================
-- ALERT_CONTACTS TABLE
-- Phone numbers and contacts for alert notifications
-- ============================================================================
CREATE TABLE alert_contacts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    contact_id NVARCHAR(64) NOT NULL UNIQUE,
    organization_id NVARCHAR(128),
    
    contact_name NVARCHAR(128) NOT NULL,
    phone_number NVARCHAR(20),                         -- E.164 format
    email NVARCHAR(256),
    
    -- Alert preferences
    receive_critical BIT DEFAULT 1,
    receive_high BIT DEFAULT 1,
    receive_medium BIT DEFAULT 0,
    receive_low BIT DEFAULT 0,
    
    -- Quiet hours (UTC)
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    
    INDEX idx_contact_org (organization_id)
);

-- ============================================================================
-- INSERT DEFAULT ANOMALY RULES
-- ============================================================================
INSERT INTO anomaly_rules (rule_id, rule_name, description, rule_type, metric, operator, threshold_value, severity, auto_block, trigger_alert, trigger_phone_call)
VALUES 
    ('RULE_TEMP_HIGH', 'High Temperature Alert', 'Temperature exceeds safe threshold', 'threshold', 'temperature', 'gt', 50.0, 'high', 0, 1, 0),
    ('RULE_TEMP_LOW', 'Low Temperature Alert', 'Temperature below safe threshold', 'threshold', 'temperature', 'lt', -10.0, 'medium', 0, 1, 0),
    ('RULE_SIGNAL_DROP', 'Signal Strength Drop', 'Sudden WiFi signal degradation', 'threshold', 'signal_strength', 'lt', -80.0, 'medium', 0, 1, 0),
    ('RULE_BATTERY_LOW', 'Low Battery Warning', 'Device battery critically low', 'threshold', 'battery_level', 'lt', 10.0, 'low', 0, 1, 0);

-- Rate-based rules (separate insert for rate fields)
INSERT INTO anomaly_rules (rule_id, rule_name, description, rule_type, metric, rate_limit_count, rate_limit_window_seconds, severity, auto_block, trigger_alert, trigger_phone_call)
VALUES 
    ('RULE_FREQ_FLOOD', 'Message Flood Detection', 'Too many messages in short time (DoS)', 'rate', 'message_frequency', 100, 60, 'critical', 1, 1, 1),
    ('RULE_REPLAY_ATTACK', 'Replay Attack Detection', 'Duplicate message IDs detected', 'rate', 'message_id', 2, 300, 'critical', 1, 1, 1);

-- ============================================================================
-- INSERT DEFAULT DEVICE (lumeedge-001)
-- ============================================================================
INSERT INTO devices (device_id, device_name, device_type, auth_type, status, trust_score)
VALUES ('lumeedge-001', 'LumeEdge Primary Sensor', 'esp32', 'x509', 'active', 100.00);

-- ============================================================================
-- VIEWS FOR DASHBOARD
-- ============================================================================

-- Active threats view
CREATE VIEW vw_active_threats AS
SELECT 
    se.event_id,
    se.device_id,
    d.device_name,
    se.event_type,
    se.severity,
    se.title,
    se.attack_type,
    se.confidence_score,
    se.created_at
FROM security_events se
LEFT JOIN devices d ON se.device_id = d.device_id
WHERE se.resolved_at IS NULL
  AND se.severity IN ('critical', 'high');

-- Device health summary view
CREATE VIEW vw_device_health AS
SELECT 
    d.device_id,
    d.device_name,
    d.status,
    d.trust_score,
    d.last_seen_at,
    (SELECT COUNT(*) FROM security_events WHERE device_id = d.device_id AND resolved_at IS NULL) as open_incidents,
    (SELECT TOP 1 received_at FROM device_health WHERE device_id = d.device_id ORDER BY received_at DESC) as last_health_report
FROM devices d;

-- Hourly telemetry aggregation view (from aggregates table)
CREATE VIEW vw_telemetry_hourly AS
SELECT 
    device_id,
    DATEADD(HOUR, DATEDIFF(HOUR, 0, window_start), 0) as hour_bucket,
    SUM(message_count) as message_count,
    AVG(temp_avg) as avg_temperature,
    AVG(humidity_avg) as avg_humidity,
    SUM(motion_events) as motion_events,
    SUM(anomaly_count) as anomaly_count
FROM telemetry_aggregates
WHERE window_start >= DATEADD(DAY, -7, GETUTCDATE())
GROUP BY device_id, DATEADD(HOUR, DATEDIFF(HOUR, 0, window_start), 0);

-- Active incidents view
CREATE VIEW vw_active_incidents AS
SELECT 
    ai.incident_id,
    ai.attack_type,
    ai.severity,
    ai.status,
    ai.target_device_id,
    d.device_name,
    ai.title,
    ai.confidence_score,
    ai.first_detected_at,
    ai.created_at
FROM attack_incidents ai
LEFT JOIN devices d ON ai.target_device_id = d.device_id
WHERE ai.status IN ('active', 'mitigated');

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Cleanup old message tracking records (run hourly)
CREATE PROCEDURE sp_cleanup_message_tracking
AS
BEGIN
    DELETE FROM message_tracking 
    WHERE received_at < DATEADD(HOUR, -1, GETUTCDATE());
END;
GO

-- Aggregate telemetry for a device (called by Azure Function)
CREATE PROCEDURE sp_aggregate_telemetry
    @device_id NVARCHAR(128),
    @window_start DATETIME2,
    @window_end DATETIME2,
    @window_minutes INT,
    @temp_avg DECIMAL(6,2),
    @temp_min DECIMAL(6,2),
    @temp_max DECIMAL(6,2),
    @humidity_avg DECIMAL(5,2),
    @humidity_min DECIMAL(5,2),
    @humidity_max DECIMAL(5,2),
    @motion_events INT,
    @door_events INT,
    @message_count INT,
    @anomaly_count INT,
    @signal_avg INT,
    @signal_min INT,
    @battery_avg DECIMAL(5,2),
    @battery_min DECIMAL(5,2)
AS
BEGIN
    INSERT INTO telemetry_aggregates (
        device_id, window_start, window_end, window_minutes,
        temp_avg, temp_min, temp_max,
        humidity_avg, humidity_min, humidity_max,
        motion_events, door_events, message_count, anomaly_count,
        signal_avg, signal_min, battery_avg, battery_min
    ) VALUES (
        @device_id, @window_start, @window_end, @window_minutes,
        @temp_avg, @temp_min, @temp_max,
        @humidity_avg, @humidity_min, @humidity_max,
        @motion_events, @door_events, @message_count, @anomaly_count,
        @signal_avg, @signal_min, @battery_avg, @battery_min
    );
END;
GO

PRINT 'LumeEdge SQL Schema created successfully!';
