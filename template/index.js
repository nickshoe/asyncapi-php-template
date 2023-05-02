import { AsyncAPIDocument } from "@asyncapi/parser";
import { ComposerFileRenderer } from "../src/composer-file-renderer";
import { ReadmeFileRenderer } from "../src/readme-file-renderer";

/**
 * 
 * @param {InputObject} param0 
 * @returns 
 */
export default function ({ asyncapi, params, originalAsyncAPI }) {
  const readmeFileRenderer = new ReadmeFileRenderer();
  const readmeFile = readmeFileRenderer.render(asyncapi, params);

  const composerFileRenderer = new ComposerFileRenderer();
  const composerFile = composerFileRenderer.render(asyncapi, params);

  return [readmeFile, composerFile];
}

class InputObject {
  /**
   * @type {AsyncAPIDocument} 
   */
  asyncapi;

  /**
   * @type { object }
   */
  params;

  /**
   * @type { string }
   */
  originalAsyncAPI;
}

