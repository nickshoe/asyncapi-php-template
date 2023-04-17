import { AsyncAPIDocument } from "@asyncapi/parser";
import { ClassHierarchy } from "../../../../src/class-hierarchy-evaluator/class-hierarchy";
import { ClassHierarchyEvaluator } from "../../../../src/class-hierarchy-evaluator/class-hierrachy-evaluator";

import { File, Text } from "@asyncapi/generator-react-sdk";
import { render } from "ejs";
import { Class } from "../../../../src/class-hierarchy-evaluator/class";

const fs = require('fs');

export default function ({ asyncapi, params, originalAsyncAPI }) {
    const modelsNamespace = params.modelsNamespace;

    const classHierarchyEvaluator = new ClassHierarchyEvaluator(asyncapi, modelsNamespace);

    const classHierarchy = classHierarchyEvaluator.evaluate();

    const servicesNamespace = params.servicesNamespace;

    return evaluate(asyncapi, classHierarchy, servicesNamespace);
}

/**
 *
 * @param {AsyncAPIDocument} asyncapi
 * @param {ClassHierarchy} classHierarchy
 * @param {string} servicesNamespace
 * @returns {JSX.Element[]}
 */
function evaluate(asyncapi, classHierarchy, servicesNamespace) {
    const files = [];

    for (const channelName of asyncapi.channelNames()) {
        const channel = asyncapi.channel(channelName);

        if (!channel.hasPublish()) {
            return;
        }

        const publishOperation = channel.publish();

        if (publishOperation.hasMultipleMessages()) {
            throw new Error('Channel publish operation with multiple messages is not supported. Please use a single message with a polymorphic payload instead.');
        }

        const message = publishOperation.message();

        const payloadSchema = message.payload();

        const payloadClass = classHierarchy.getClass(payloadSchema.uid());

        // TODO: create a DTO class
        const templateData = buildTemplateData(
            servicesNamespace,
            channelName,
            channel.publish().id(),
            channel.subscribe().id(),
            payloadClass
        );

        const file = renderChannelClassFile(templateData);

        files.push(file);
    }

    return files;
}

/**
 * 
 * @param {string} servicesNamespace 
 * @param {string} channelName 
 * @param {string} publishOperationId 
 * @param {string} subscribeOperationId 
 * @param {Class} payloadClass 
 * @returns 
 */
function buildTemplateData(
    servicesNamespace,
    channelName,
    publishOperationId,
    subscribeOperationId,
    payloadClass
) {
    return {
        servicesNamespace: servicesNamespace,
        channel: {
            name: channelName
        },
        payload: {
            name: payloadClass.getName(),
            subClasses: payloadClass.getSubClasses().map((subClass) => ({
                name: subClass.getName()
            })),
            discriminator: payloadClass.getInstanceVariables().filter((variable) => variable.isDiscriminator())[0].getName()
        },
        modelsNamespace: payloadClass.getPackageName(),
        publishOperationId: publishOperationId,
        subscribeOperationId: subscribeOperationId
    };
}

function renderChannelClassFile(templateData) {
    const template = fs.readFileSync(
        __dirname + '/../../../../src/ejs-templates/channel-class.ejs',
        { encoding: 'utf8', flag: 'r' }
    );

    const output = render(template, templateData);

    const upperCasedChannelName = templateData.channel.name.charAt(0).toUpperCase() + templateData.channel.name.slice(1);
    const fileName = `${upperCasedChannelName}Channel.class.php`;

    return (
        <File name={fileName}>
            <Text>{output}</Text>
        </File>
    );
}
