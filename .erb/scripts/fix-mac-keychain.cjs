// electron-builder 25.1.8 passes the certificate password to a command that
// requires the temporary keychain password. Keep these two passwords separate.
const fs = require('fs');

const target = require.resolve('app-builder-lib/out/codeSign/macCodeSign.js');
const version = require('app-builder-lib/package.json').version;
if (version !== '25.1.8') {
  throw new Error(`Review the macOS keychain workaround for app-builder-lib ${version}`);
}

const replacements = [
  [
    'return await importCerts(keychainFile, certPaths, cscPasswords);',
    'return await importCerts(keychainFile, certPaths, cscPasswords, keychainPassword);',
  ],
  [
    'async function importCerts(keychainFile, paths, keyPasswords) {',
    'async function importCerts(keychainFile, paths, keyPasswords, keychainPassword) {',
  ],
  [
    '["set-key-partition-list", "-S", "apple-tool:,apple:", "-s", "-k", password, keychainFile]',
    '["set-key-partition-list", "-S", "apple-tool:,apple:", "-s", "-k", keychainPassword, keychainFile]',
  ],
];

let source = fs.readFileSync(target, 'utf8');
for (const [before, after] of replacements) {
  if (source.includes(after)) continue;
  if (source.split(before).length !== 2) {
    throw new Error('Unexpected macCodeSign implementation; refusing to patch');
  }
  source = source.replace(before, after);
}
fs.writeFileSync(target, source);
console.log('Applied electron-builder 25.1.8 macOS keychain password workaround');
