import { File, Text } from "@asyncapi/generator-react-sdk";
import { AsyncAPIDocument } from "@asyncapi/parser";
import { render } from "ejs";
import { ChannelDTOEvaluator } from "../src/channel-dto-evaluator/channel-dto-evaluator";
import { ClassHierarchyEvaluator } from "../src/class-hierarchy-evaluator/class-hierrachy-evaluator";
import { Utils } from "../src/utils";
import { faker } from "@faker-js/faker";
import { Class } from "../src/class-hierarchy-evaluator/class";
import { InstanceVariable } from "../src/class-hierarchy-evaluator/member-variable";

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

  // TODO: refactor - synthesize a template data DTO using the following logic
  for (const channelDTO of channelDTOs) {
    let channelParameters = {};
    if (channelDTO.channel.hasParameters()) {
      for (const parameterName in channelDTO.channel.parameters()) {
        const parameter = channelDTO.channel.parameter(parameterName);

        let parameterValue = '<parameter-value>';
        if (parameter.schema().examples() !== undefined && parameter.schema().examples().length > 0) {
          parameterValue = parameter.schema().examples()[0];
        }

        channelParameters[parameterName] = parameterValue;
      }
    }

    channelDTO.channelParameters = channelParameters;
  }

  const template = fs.readFileSync(
    __dirname + '/../src/ejs-templates/README.ejs',
    { encoding: 'utf8', flag: 'r' }
  );

  const securitySchemes = asyncapi.components().securitySchemes();

  const securitySchemesIds = Object.keys(securitySchemes);

  const serverSecuritySchemes = securitySchemesIds
    .filter((securitySchemaId) => typeof server.security()[0].json(securitySchemaId) !== undefined)
    .map((securitySchemaId) => securitySchemes[securitySchemaId]);



  // TODO: refactor - create evaluator class
  /**
   * @type {Map<string, object>}
   */
  const classInstanceExamples = new Map();

  const channelDTO = channelDTOs[0];
  if (channelDTO.publishOperation !== null) {
    const payloadClass = classHierarchy.getClass(channelDTO.publishOperation.payload.name);

    classInstanceExamples.set(payloadClass.getName(), buildExampleInstance(payloadClass));

    if (payloadClass.hasSubClasses()) {
      classInstanceExamples.set(payloadClass.getName(), buildExampleInstance(payloadClass.getSubClasses()[0]));

      for (const subClass of payloadClass.getSubClasses()) {
        classInstanceExamples.set(subClass.getName(), buildExampleInstance(subClass));
      }
    }
  }



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
    classHierarchy: classHierarchy,
    classInstanceExamples: classInstanceExamples,
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

/**
 * 
 * @param {Class} clazz 
 * @returns 
 */
function buildExampleInstance(clazz) {
  const exampleInstance = {};

  for (const instanceVariable of clazz.getInheritedInstanceVariables().concat(clazz.getInstanceVariables())) {
    let propertyValue = undefined;

    if (instanceVariable.isDiscriminator()) {
      propertyValue = clazz.getName();
    } else {
      propertyValue = generateExampleValue(instanceVariable);
    }

    const propertyName = Utils.camelToSnakeCase(instanceVariable.getName());
    exampleInstance[propertyName] = propertyValue;
  }

  return exampleInstance;
}

/**
 * 
 * @param {InstanceVariable} instanceVariable 
 * @returns {any}
 */
function generateExampleValue(instanceVariable) {
  // TODO - refactor: use strategy pattern, construct an instance value from the characteristics of the instance variable

  if (instanceVariable.isDiscriminator()) {
    throw new Error('Example value for discriminator instance variable should already be handled at a higher level.');
  } else {
    if (instanceVariable.getType().isUserDefinedClass()) {
      return buildExampleInstance(instanceVariable.getType());
    } else {
      switch (instanceVariable.getType().getName()) {
        case ClassHierarchyEvaluator.INTEGER_CLASS_NAME:
          switch (instanceVariable.getName()) {
            case 'id':
              return faker.datatype.number(100);
            default:
              return faker.datatype.number();
          }
        case ClassHierarchyEvaluator.STRING_CLASS_NAME:
          switch (instanceVariable.getName()) {
            case 'id':
              return faker.datatype.uuid();
            case 'email':
              return faker.internet.email(); // TODO: use firstName and lastName if available
            case 'user':
            case 'username':
              return faker.internet.userName();
            case 'firstName':
              return faker.name.firstName();
            case 'lastName':
              return faker.name.lastName();
            default:
              return faker.datatype.string();
          }
        case ClassHierarchyEvaluator.INSTANT_CLASS_NAME:
          return faker.datatype.datetime();
        default:
          return faker.datatype.string();
      }
    }
  }
}