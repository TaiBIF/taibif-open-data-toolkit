const { notarize } = require('@electron/notarize');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { build } = require('../../package.json');

exports.default = async function notarizeMacos(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  if (process.env.CI !== 'true') {
    console.warn('Skipping notarizing step. Packaging is not running in CI');
    return;
  }

  if (
    !(
      'APPLE_API_KEY' in process.env &&
      'APPLE_API_KEY_ID' in process.env &&
      'APPLE_API_ISSUER' in process.env
    )
  ) {
    console.warn(
      'Skipping notarizing step. APPLE_API_KEY, APPLE_API_KEY_ID, and APPLE_API_ISSUER env variables must be set',
    );
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;
  const apiKeyPath = path.join(
    os.tmpdir(),
    `AuthKey_${process.env.APPLE_API_KEY_ID}.p8`,
  );

  fs.writeFileSync(
    apiKeyPath,
    Buffer.from(process.env.APPLE_API_KEY, 'base64'),
    { mode: 0o600 },
  );

  console.log(`Starting macOS notarization for ${appPath}`);

  await notarize({
    tool: 'notarytool',
    appBundleId: build.appId,
    appPath,
    appleApiKey: apiKeyPath,
    appleApiKeyId: process.env.APPLE_API_KEY_ID,
    appleApiIssuer: process.env.APPLE_API_ISSUER,
  });

  console.log(`Completed macOS notarization for ${appPath}`);
};
