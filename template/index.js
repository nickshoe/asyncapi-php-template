import { File, Text } from "@asyncapi/generator-react-sdk";
import { AsyncAPIDocument } from "@asyncapi/parser";
import { render } from "ejs";

const fs = require('fs');

/**
 * 
 * @param {InputObject} param0 
 * @returns 
 */
export default function ({ asyncapi, params, originalAsyncAPI }) {
  const template = fs.readFileSync(
    __dirname + '/../src/ejs-templates/README.ejs',
    { encoding: 'utf8', flag: 'r' }
  );

  const output = render(template, { appTitle: asyncapi.info().title() });

  const readmeFile = <File name="README.md">
    <Text>{output}</Text>
  </File>;

  const composerBlock = `
{
  "require": {
    "jms/serializer": "^3.23",
    "php-amqplib/php-amqplib": "^3.5",
    "react/event-loop": "^1.3",
    "reactivex/rxphp": "^2.0"
  },
  "autoload": {
    "classmap": [
        "src/"
    ]
  }
}  
`.trim();

  const composerFile = <File name="composer.json">
    <Text>{composerBlock}</Text>
  </File>;

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