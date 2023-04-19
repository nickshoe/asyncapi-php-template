import { AsyncAPIDocument, Channel } from "@asyncapi/parser";
import { Class } from "../class-hierarchy-evaluator/class";
import { ClassHierarchy } from "../class-hierarchy-evaluator/class-hierarchy";
import { ClassHierarchyEvaluator } from "../class-hierarchy-evaluator/class-hierrachy-evaluator";

export class ChannelDTOEvaluator {

    /**
     *
     * @param {AsyncAPIDocument} asyncapi
     * @param {ClassHierarchy} classHierarchy
     * @param {string} servicesNamespace
     * @returns {ChannelDTO[]}
     */
    evaluate(asyncapi, classHierarchy, servicesNamespace) {
        const dtos = [];

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

            const payloadClassName = ClassHierarchyEvaluator.buildSchemaClassName(payloadSchema);
            const payloadClass = classHierarchy.getClass(payloadClassName);

            const dto = this.#buildDTO(
                servicesNamespace,
                channelName,
                channel,
                payloadClass
            );

            dtos.push(dto);
        }

        return dtos;
    }

    /**
     * 
     * @param {string} servicesNamespace 
     * @param {string} channelName 
     * @param {Channel} channel 
     * @param {Class} payloadClass 
     * @returns {ChannelDTO}
     */
    #buildDTO(
        servicesNamespace,
        channelName,
        channel,
        payloadClass
    ) {
        return {
            servicesNamespace: servicesNamespace,
            channel: channel,
            channelName: channelName,
            channelClassNamePrefix: this.buildChannelClassNamePrefix(channelName),
            payload: {
                name: payloadClass.getName(),
                subClasses: payloadClass.getSubClasses().map((subClass) => ({
                    name: subClass.getName()
                })),
                discriminator: payloadClass.getInstanceVariables().filter((variable) => variable.isDiscriminator())[0]?.getName()
            },
            modelsNamespace: payloadClass.getPackageName(),
            publishOperationId: channel.publish().id() ? channel.publish().id() : `publish${this.buildChannelClassNamePrefix(channelName)}`,
            subscribeOperationId: channel.subscribe().id() ? channel.subscribe().id() : `on${this.buildChannelClassNamePrefix(channelName)}`
        };
    }

    /**
     * 
     * @param {string} channelName 
     * @returns {string}
     */
    buildChannelClassNamePrefix(channelName) {
        const nameTokens = channelName.replace(/\/|<|>|\-/g, " ").split(" ");

        const className = nameTokens.map((token) => token.charAt(0).toUpperCase() + token.slice(1)).join("");

        return className;
    }

}

export class ChannelDTO {

    servicesNamespace;
    channelName;
    channelClassNamePrefix;
    payload;
    modelsNamespace;
    publishOperationId;
    subscribeOperationId;

}