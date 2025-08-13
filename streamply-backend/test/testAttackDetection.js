/**
 * Test Advanced Attack Detection System
 */

import { analyzeForAttacks } from '../middleware/advancedAttackDetection.js';

export async function testAttackDetection(req, res) {
  console.log('🧪 Testing Advanced Attack Detection System...');
  
  try {
    const testCases = [
      {
        name: 'Clean Input',
        input: 'Hello world, this is a normal string',
        expectedClean: true
      },
      {
        name: 'SQL Injection - UNION',
        input: "admin' UNION SELECT * FROM users--",
        expectedClean: false,
        expectedAttacks: ['sql_injection']
      },
      {
        name: 'SQL Injection - OR condition',
        input: "username=admin&password=' OR '1'='1",
        expectedClean: false,
        expectedAttacks: ['sql_injection']
      },
      {
        name: 'XSS - Script tag',
        input: '<script>alert("XSS")</script>',
        expectedClean: false,
        expectedAttacks: ['xss']
      },
      {
        name: 'XSS - JavaScript URL',
        input: 'javascript:alert(document.cookie)',
        expectedClean: false,
        expectedAttacks: ['xss']
      },
      {
        name: 'NoSQL Injection - MongoDB',
        input: '{"username": {"$ne": null}, "password": {"$ne": null}}',
        expectedClean: false,
        expectedAttacks: ['nosql_injection']
      },
      {
        name: 'Directory Traversal',
        input: '../../../etc/passwd',
        expectedClean: false,
        expectedAttacks: ['directory_traversal']
      },
      {
        name: 'Command Injection',
        input: 'test; ls -la',
        expectedClean: false,
        expectedAttacks: ['command_injection']
      },
      {
        name: 'Multiple Attack Types',
        input: '<script>alert(1)</script>; DROP TABLE users--',
        expectedClean: false,
        expectedAttacks: ['xss', 'sql_injection']
      },
      {
        name: 'Test234! (from your attack logs)',
        input: 'Test234!',
        expectedClean: true // This should be clean
      }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      const analysis = analyzeForAttacks(testCase.input, 'test');
      
      const result = {
        testName: testCase.name,
        input: testCase.input,
        expectedClean: testCase.expectedClean,
        actualClean: analysis.clean,
        expectedAttacks: testCase.expectedAttacks || [],
        actualAttacks: analysis.attacks || [],
        patterns: analysis.patterns || [],
        passed: analysis.clean === testCase.expectedClean &&
               JSON.stringify(analysis.attacks?.sort()) === JSON.stringify(testCase.expectedAttacks?.sort())
      };
      
      results.push(result);
    }
    
    const summary = {
      totalTests: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      passRate: Math.round((results.filter(r => r.passed).length / results.length) * 100)
    };
    
    console.log('✅ Attack Detection Test Complete');
    res.status(200).json({
      status: 'Attack Detection Test Complete',
      summary,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Attack Detection Test Error:', error);
    res.status(500).json({
      error: 'Attack Detection Test Failed',
      message: error.message
    });
  }
}

export default testAttackDetection;
