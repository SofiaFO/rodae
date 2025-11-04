const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Configurando ambiente para Windows...\n');

// Verificar versão do Chrome instalada
console.log('📋 Verificando versão do Chrome...');
try {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (fs.existsSync(chromePath)) {
    console.log('✅ Chrome encontrado!');
  } else {
    console.log('⚠️  Chrome não encontrado no caminho padrão');
    console.log('   Por favor, certifique-se que o Chrome está instalado');
  }
} catch (e) {
  console.log('⚠️  Não foi possível verificar o Chrome');
}

console.log('\n📦 Verificando dependências...');

// Verificar se as dependências estão instaladas
if (!fs.existsSync('node_modules')) {
  console.log('📥 Instalando dependências do npm...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependências instaladas!');
} else {
  console.log('✅ Dependências já instaladas!');
}

console.log('\n🎉 Configuração concluída!\n');
console.log('Para executar os testes, use:');
console.log('  npm test           - Todos os testes');
console.log('  node tests/admin-standalone.test.js       - Teste admin');
console.log('  node tests/passageiro-standalone.test.js  - Teste passageiro');
console.log('  node tests/motorista-standalone.test.js   - Teste motorista');
console.log('\n⚠️  IMPORTANTE: Certifique-se que:');
console.log('  1. Backend está rodando na porta 3000');
console.log('  2. Frontend está rodando na porta 8080');
console.log('  3. Google Chrome está instalado\n');
