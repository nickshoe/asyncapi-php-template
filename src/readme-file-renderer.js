import { File, Text } from "@asyncapi/generator-react-sdk";
import { AsyncAPIDocument } from "@asyncapi/parser";
import { render } from "ejs";
import * as fs from "fs";
import { Utils } from "../src/utils";
import { ChannelDTOEvaluator } from "./channel-dto-evaluator/channel-dto-evaluator";
import { ClassHierarchyEvaluator } from "./class-hierarchy-evaluator/class-hierrachy-evaluator";
import { AMQP_PROTOCOL, AMQP_PROTOCOL_VERSION, KAFKA_PROTOCOL, KAFKA_PROTOCOL_VERSION } from "./constants";

export class ReadmeFileRenderer {

    /**
     * 
     * @param {AsyncAPIDocument} asyncapi 
     * @param {Object} params
     * @returns {JSX.Element}
     */
    render(asyncapi, params) {
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

        let serverSecuritySchemes = [];
        if (server.security() !== null && server.security().length > 0) {
            const securitySchemes = asyncapi.components().securitySchemes();

            const securitySchemesIds = Object.keys(securitySchemes);

            serverSecuritySchemes = securitySchemesIds
                .filter((securitySchemaId) => typeof server.security()[0].json(securitySchemaId) !== undefined) // TODO: refactor
                .map((securitySchemaId) => securitySchemes[securitySchemaId]);
        }

        const output = render(template, {
            CONSTANTS: {
                AMQP_PROTOCOL: AMQP_PROTOCOL,
                AMQP_PROTOCOL_VERSION: AMQP_PROTOCOL_VERSION,
                KAFKA_PROTOCOL: KAFKA_PROTOCOL,
                KAFKA_PROTOCOL_VERSION: KAFKA_PROTOCOL_VERSION,
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

        return <File name="README.md">
            <Text>{output}</Text>
        </File>;
    }
}