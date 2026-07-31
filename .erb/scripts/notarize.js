const { notarize } = require('@electron/notarize');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { build } = require('../../package.json');

const MAX_NOTARIZATION_ATTEMPTS = 3;
const NOTARIZATION_RETRY_DELAY_MS = 60 * 1000;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isTransientNotarizationError(error) {
  const message = String(error && (error.stack || error.message || error));

  return [
    'NSURLErrorDomain',
    'HTTPError',
    'The Internet connection appears to be offline',
    'The request timed out',
    'Could not connect to the server',
    'network connection was lost',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
    'socket hang up',
  ].some((pattern) => message.includes(pattern));
}

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

  const notarizeOptions = {
    tool: 'notarytool',
    appBundleId: build.appId,
    appPath,
    appleApiKey: apiKeyPath,
    appleApiKeyId: process.env.APPLE_API_KEY_ID,
    appleApiIssuer: process.env.APPLE_API_ISSUER,
  };

  for (let attempt = 1; attempt <= MAX_NOTARIZATION_ATTEMPTS; attempt += 1) {
    try {
      console.log(
        `macOS notarization attempt ${attempt}/${MAX_NOTARIZATION_ATTEMPTS}`,
      );
      await notarize(notarizeOptions);
      console.log(`Completed macOS notarization for ${appPath}`);
      return;
    } catch (error) {
      const shouldRetry =
        attempt < MAX_NOTARIZATION_ATTEMPTS &&
        isTransientNotarizationError(error);

      if (!shouldRetry) {
        throw error;
      }

      console.warn(
        `macOS notarization attempt ${attempt} failed with a transient error. Retrying in ${
          NOTARIZATION_RETRY_DELAY_MS / 1000
        } seconds.`,
      );
      console.warn(error);

      await sleep(NOTARIZATION_RETRY_DELAY_MS);
    }
  }
};
