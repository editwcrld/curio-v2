/**
 * TEST SCRIPT - Quote Cache Service
 * Run: node TEST-QUOTE-CACHE.js
 */

require('dotenv').config();
const { 
    getCacheCount, 
    ensureCacheFilled,
    getQuote,
    clearCache
} = require('./services/quote-cache');

async function testQuoteCache() {
    console.log('🧪 TESTING QUOTE CACHE SERVICE\n');
    console.log('='.repeat(50));
    
    // Test 1: Check cache status
    console.log('\n📊 TEST 1: Check Cache Status');
    console.log('-'.repeat(50));
    
    const initialCount = await getCacheCount();
    console.log(`Cache has ${initialCount} quotes`);
    
    // Test 2: Fill cache
    console.log('\n\n🔄 TEST 2: Fill Cache');
    console.log('-'.repeat(50));
    
    await ensureCacheFilled();
    
    const filledCount = await getCacheCount();
    console.log(`\nCache now has ${filledCount} quotes`);
    
    // Test 3: Get quotes from cache
    console.log('\n\n📝 TEST 3: Get 5 Quotes from Cache');
    console.log('-'.repeat(50));
    
    for (let i = 1; i <= 5; i++) {
        console.log(`\n${i}. Getting quote...`);
        const quote = await getQuote();
        console.log(`   "${quote.text}"`);
        console.log(`   - ${quote.author} (${quote.source_api})`);
    }
    
    // Test 4: Final cache status
    console.log('\n\n📊 TEST 4: Final Cache Status');
    console.log('-'.repeat(50));
    
    const finalCount = await getCacheCount();
    console.log(`Cache has ${finalCount} quotes`);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 TESTS COMPLETE!\n');
    
    // Optional: Clear cache (comment out if you want to keep cache)
    // console.log('🗑️  Clearing cache...');
    // await clearCache();
}

// Run tests
testQuoteCache()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });