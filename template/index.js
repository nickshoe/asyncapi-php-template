import { File, Text } from "@asyncapi/generator-react-sdk";
import { AsyncAPIDocument } from "@asyncapi/parser";
import { render } from "ejs";
import { ChannelDTOEvaluator } from "../src/channel-dto-evaluator/channel-dto-evaluator";
import { ClassHierarchyEvaluator } from "../src/class-hierarchy-evaluator/class-hierrachy-evaluator";
import { Utils } from "../src/utils";

const fs = require('fs');

/**
 * 
 * @param {InputObject} param0 
 * @returns 
 */
export default function ({ asyncapi, params, originalAsyncAPI }) {
  const serverName = params.server;
  const modelsNamespace = params.modelsNamespace;
  const servicesNamespace = params.servicesNamespace;

  const server = asyncapi.server(serverName);

  const classHierarchyEvaluator = new ClassHierarchyEvaluator(asyncapi, modelsNamespace);
  const classHierarchy = classHierarchyEvaluator.evaluate();

  const channelDTOEvaluator = new ChannelDTOEvaluator(classHierarchy, servicesNamespace, modelsNamespace);
  const channelDTOs = channelDTOEvaluator.evaluate(asyncapi);

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
    CONSTANTS: {
      AMQP_PROTOCOL: 'amqp',
      AMQP_PROTOCOL_VERSION: '0.9.1',
      USER_PASSWORD_SECURITY_SCHEME_TYPE: 'userPassword'
    },
    server: server,
    serverSecuritySchemes: serverSecuritySchemes,
    appTitle: asyncapi.info().title(),
    channelDTOs: channelDTOs,
    channels: asyncapi.channels(),
    servicesNamespace: servicesNamespace,
    modelsNamespace: modelsNamespace,
    upperCaseFirst: Utils.upperCaseFirst,
    lowerCaseFirst: Utils.lowerCaseFirst,
    buildSchemaClassName: ClassHierarchyEvaluator.buildSchemaClassName
  });

  const readmeFile = <File name="README.md">
    <Text>{output}</Text>
  </File>;

  const composerBlock = `
{
  "require": {
    "jms/serializer": "^3.23",
    "php-amqplib/php-amqplib": "^3.5"
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

