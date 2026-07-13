const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-date-picker',
  'package.json',
);

if (!fs.existsSync(packageJsonPath)) {
  process.exit(0);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const iosCodegen = packageJson.codegenConfig?.ios;

// The iOS implementation uses NativeModules and does not implement the
// RCTModuleProvider protocol required by React Native 0.84's provider map.
if (iosCodegen?.modulesProvider) {
  delete iosCodegen.modulesProvider;
  fs.writeFileSync(
    packageJsonPath,
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );
}
