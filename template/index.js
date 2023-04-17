import { File, Text } from "@asyncapi/generator-react-sdk";
import { AsyncAPIDocument } from "@asyncapi/parser";
import { render } from "ejs";
import { ClassHierarchyEvaluator } from "../src/class-hierarchy-evaluator/class-hierrachy-evaluator";

const fs = require('fs');

/**
 * 
 * @param {InputObject} param0 
 * @returns 
 */
export default function ({ asyncapi, params, originalAsyncAPI }) {
  const serverName = params.server;
  const modelsNamespace = params.modelsNamespace;

  const server = asyncapi.server(serverName);

  const classHierarchyEvaluator = new ClassHierarchyEvaluator(asyncapi, modelsNamespace);

  const classHierarchy = classHierarchyEvaluator.evaluate();

  const servicesNamespace = params.servicesNamespace;

  const template = fs.readFileSync(
    __dirname + '/../src/ejs-templates/README.ejs',
    { encoding: 'utf8', flag: 'r' }
  );

  const securitySchemes = asyncapi.components().securitySchemes();
  
  const securitySchemesIds = Object.keys(securitySchemes);
    
  const serverSecuritySchemes = securitySchemesIds
      .filter((securitySchemaId) => typeof server.security()[0].json(securitySchemaId) !== undefined)
      .map((securitySchemaId) => securitySchemes[securitySchemaId]);

  const output = render(template, {
    server: server,
    serverSecuritySchemes: serverSecuritySchemes,
    appTitle: asyncapi.info().title(),
    channels: asyncapi.channels(),
    servicesNamespace: servicesNamespace,
    classHierarchy: classHierarchy
  });

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