const { execSync } = require('child_process');
const colors = require('colors');

console.log('\n' + '='.repeat(70).cyan);
console.log('🧪 RODAÊ - Suite de Testes E2E (Selenium Puro)'.cyan.bold);
console.log('='.repeat(70).cyan + '\n');

const tests = [
  { name: 'Testes de Passageiro', file: 'passageiro-standalone.test.js' },
  { name: 'Testes de Motorista', file: 'motorista-standalone.test.js' },
  { name: 'Testes de Admin', file: 'admin-standalone.test.js' }
];

let totalPassed = 0;
let totalFailed = 0;

console.log('📋 Pré-requisitos:'.yellow.bold);
console.log('  ✓ Backend rodando em http://localhost:3000');
console.log('  ✓ Frontend rodando em http://localhost:8080');
console.log('  ✓ Google Chrome instalado\n');

console.log('🚀 Iniciando testes...\n'.green.bold);

tests.forEach((test, index) => {
  console.log(`\n${'━'.repeat(70)}`.gray);
  console.log(`📝 ${index + 1}/${tests.length} - ${test.name}`.yellow.bold);
  console.log('━'.repeat(70).gray + '\n');

  try {
    execSync(`node tests/${test.file}`, {
      stdio: 'inherit'
    });
    totalPassed++;
  } catch (error) {
    totalFailed++;
  }
});

console.log('\n' + '='.repeat(70).cyan);
console.log('📊 RESULTADOS FINAIS'.cyan.bold);
console.log('='.repeat(70).cyan);
console.log(`✅ Suites Passou: ${totalPassed}`.green);
console.log(`❌ Suites Falhou: ${totalFailed}`.red);
console.log(`📈 Total: ${tests.length}`);
console.log('='.repeat(70).cyan + '\n');

if (totalFailed === 0) {
  console.log('🎉 Todos os testes passaram! 🎉\n'.green.bold);
  process.exit(0);
} else {
  console.log('⚠️  Alguns testes falharam. Verifique os logs acima.\n'.yellow.bold);
  process.exit(1);
}
