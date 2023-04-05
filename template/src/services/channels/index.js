import { AsyncAPIDocument } from "@asyncapi/parser";
import { ClassHierarchy } from "../../../../src/class-hierarchy-evaluator/class-hierarchy";
import { ClassHierarchyEvaluator } from "../../../../src/class-hierarchy-evaluator/class-hierrachy-evaluator";

import { File, Text } from "@asyncapi/generator-react-sdk";
import { render } from "ejs";

const fs = require('fs');

export default function ({ asyncapi, params, originalAsyncAPI }) {
    const classHierarchyEvaluator = new ClassHierarchyEvaluator(asyncapi);

    const classHierarchy = classHierarchyEvaluator.evaluate();

    return evaluate(asyncapi, classHierarchy);
}

/**
 *
 * @param {AsyncAPIDocument} asyncapi
 * @param {ClassHierarchy} classHierarchy
 * @returns {JSX.Element[]}
 */
function evaluate(asyncapi, classHierarchy) {
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
        const data = buildTemplateData(
            channelName,
            channel.publish().id(),
            channel.subscribe().id(),
            'AsyncAPI\\\\Models',
            payloadClass
        );

        const file = renderChannelClassFile(data);

        files.push(file);
    }

    return files;
}

function buildTemplateData(
    channelName,
    publishOperationId,
    subscribeOperationId,
    modelsNamespace,
    payloadClass
) {
    return {
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
        modelsNamespace: modelsNamespace,
        publishOperationId: publishOperationId,
        subscribeOperationId: subscribeOperationId
    };
}

function renderChannelClassFile(data) {
    const template = fs.readFileSync(
        __dirname + '/../../../../src/ejs-templates/channel-class.ejs',
        { encoding: 'utf8', flag: 'r' }
    );

    const output = render(template, data);

    const upperCasedChannelName = data.channel.name.charAt(0).toUpperCase() + data.channel.name.slice(1);
    const fileName = `${upperCasedChannelName}Channel.class.php`;

    return (
        <File name={fileName}>
            <Text>{output}</Text>
        </File>
    );
}
