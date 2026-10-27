import {Config} from '@remotion/cli/config';

// We are an individual / 3-person-or-smaller project: the Remotion Free
// License applies.  Declaring it explicitly keeps telemetry + CI logs honest.
// See https://www.remotion.dev/docs/license/faq
Config.setPublicLicenseKey('free-license');
Config.setEntryPoint('./src/index.ts');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer('angle');
