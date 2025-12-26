/**
 * CURIO BACKEND - Supabase Client
 * Zentrale Datenbankverbindung
 */

const { createClient } = require('@supabase/supabase-js');

// =====================================================
// ENVIRONMENT VARIABLES CHECK
// =====================================================

if (!process.env.SUPABASE_URL) {
    throw new Error('❌ SUPABASE_URL is not defined in .env');
}

if (!process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('❌ SUPABASE_SERVICE_KEY is not defined in .env');
}

// =====================================================
// SUPABASE CLIENT
// =====================================================

/**
 * Supabase Client mit Service Role Key
 * WICHTIG: Nur im Backend verwenden! Service Key hat volle Rechte.
 */
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// =====================================================
// CONNECTION TEST
// =====================================================

/**
 * Testet die Supabase Verbindung
 * @returns {Promise<boolean>}
 */
async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('app_config')
            .select('key')
            .limit(1);
        
        if (error) throw error;
        
        console.log('✅ Supabase connection successful');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
        return false;
    }
}

// Test connection on startup (nur in Development)
if (process.env.NODE_ENV !== 'production') {
    testConnection();
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    supabase,
    testConnection
};