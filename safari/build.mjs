// Assembles a Safari-ready copy of the extension in build/safari/. Feed that
// folder to `xcrun safari-web-extension-converter` on a Mac (see docs/safari.md).
import { assemble } from '../packaging/assemble.mjs';
import { toSafariManifest } from './manifest.mjs';

console.log(`Safari extension folder written to ${assemble('safari', toSafariManifest)}`);
