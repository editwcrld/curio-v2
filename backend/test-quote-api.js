/**
 * TEST SCRIPT - Quote API Aggregator
 * Run: node TEST-QUOTE-API.js
 */

require('dotenv').config();
const { fetchRandomQuote, fetchMultipleQuotes } = require('./services/api-aggregator');

async function testQuoteAPI() {
    console.log('🧪 TESTING QUOTE API AGGREGATOR\n');
    console.log('='.repeat(50));
    
    // Test 1: Single Quote
    console.log('\n📝 TEST 1: Fetch Single Quote');
    console.log('-'.repeat(50));
    
    try {
        const quote = await fetchRandomQuote();
        console.log('\n✅ SUCCESS!');
        console.log('Text:', quote.text);
        console.log('Author:', quote.author);
        console.log('Source:', quote.source);
        console.log('Category:', quote.category);
    } catch (error) {
        console.error('\n❌ FAILED:', error.message);
    }
    
    // Test 2: Multiple Quotes
    console.log('\n\n📝 TEST 2: Fetch 3 Quotes');
    console.log('-'.repeat(50));
    
    try {
        const quotes = await fetchMultipleQuotes(3);
        console.log(`\n✅ Got ${quotes.length} quotes:`);
        
        quotes.forEach((q, i) => {
            console.log(`\n${i + 1}. "${q.text}"`);
            console.log(`   - ${q.author} (${q.source})`);
        });
    } catch (error) {
        console.error('\n❌ FAILED:', error.message);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 TESTS COMPLETE!\n');
}

// Run tests
testQuoteAPI().catch(console.error);