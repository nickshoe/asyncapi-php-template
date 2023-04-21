import { AsyncAPIDocument, Channel } from "@asyncapi/parser";
import { Class } from "../class-hierarchy-evaluator/class";
import { ClassHierarchy } from "../class-hierarchy-evaluator/class-hierarchy";
import { ClassHierarchyEvaluator } from "../class-hierarchy-evaluator/class-hierrachy-evaluator";

export class ChannelDTOEvaluator {

    /**
     * @type {ClassHierarchy}
     */
    #classHierarchy;

    /**
     * @type {string}
     */
    #servicesNamespace;

    /**
     * @type {string}
     */
    #modelsNamespace;

    /**
     * 
     * @param {ClassHierarchy} classHierarchy 
     */
    constructor(classHierarchy, servicesNamespace, modelsNamespace) {
        this.#classHierarchy = classHierarchy;
        this.#servicesNamespace = servicesNamespace;
        this.#modelsNamespace = modelsNamespace;
    }

    /**
     *
     * @param {AsyncAPIDocument} asyncapi
     * @returns {ChannelDTO[]}
     */
    evaluate(asyncapi) {
        const dtos = [];

        for (const channelName of asyncapi.channelNames()) {
            const channel = asyncapi.channel(channelName);

            const dto = this.#buildDTO(channelName, channel);

            dtos.push(dto);
        }

        return dtos;
    }

    /**
     * 
     * @param {string} channelName 
     * @param {Channel} channel 
     * @returns {ChannelDTO}
     */
    #buildDTO(channelName, channel) {
        /**
         * @type {PublishOperation|null}
         */
        let publishOperation = null;
        if (channel.hasPublish()) {
            if (channel.publish().hasMultipleMessages()) {
                throw new Error('Channel publish operation with multiple messages is not supported. Please use a single message with a polymorphic payload instead.');
            }

            const message = channel.publish().message();

            const payloadClassName = ClassHierarchyEvaluator.buildSchemaClassName(message.payload());
            const payloadClass = this.#classHierarchy.getClass(payloadClassName);

            publishOperation = {
                name: channel.publish().id() ? channel.publish().id() : `publish${this.buildChannelClassNamePrefix(channelName)}`,
                payload: this.#buildChannelPayloadDTO(payloadClass)
            };
        }

        /**
         * @type {SubscribeOperation|null}
         */
        let subscribeOperation = null;
        if (channel.hasSubscribe()) {
            if (channel.subscribe().hasMultipleMessages()) {
                throw new Error('Channel subscribe operation with multiple messages is not supported. Please use a single message with a polymorphic payload instead.');
            }

            const message = channel.subscribe().message();

            const payloadClassName = ClassHierarchyEvaluator.buildSchemaClassName(message.payload());
            const payloadClass = this.#classHierarchy.getClass(payloadClassName);

            subscribeOperation = {
                name: channel.subscribe().id() ? channel.subscribe().id() : `on${this.buildChannelClassNamePrefix(channelName)}`,
                payload: this.#buildChannelPayloadDTO(payloadClass)
            };
        }

        return {
            servicesNamespace: this.#servicesNamespace,
            modelsNamespace: this.#modelsNamespace,
            channel: channel,
            channelName: channelName,
            channelClassNamePrefix: this.buildChannelClassNamePrefix(channelName),
            publishOperation: publishOperation,
            subscribeOperation: subscribeOperation
        };
    }

    /**
     * 
     * @param {Class} payloadClass 
     * @returns {Payload}
     */
    #buildChannelPayloadDTO(payloadClass) {
        return {
            name: payloadClass.getName(),
            subClasses: payloadClass.getSubClasses().map((subClass) => ({
                name: subClass.getName()
            })),
            discriminator: payloadClass.getInstanceVariables().filter((variable) => variable.isDiscriminator())[0]?.getName()
        };
    }

    /**
     * 
     * @param {string} channelName 
     * @returns {string}
     */
    buildChannelClassNamePrefix(channelName) {
        const nameTokens = channelName.replace(/\/|<|>|\-|\{|\}|\./g, " ").split(" ");

        const className = nameTokens.map((token) => token.charAt(0).toUpperCase() + token.slice(1)).join("");

        return className;
    }

}

export class ChannelDTO {

    /**
     * @type {string}
     */
    servicesNamespace;

    /**
     * @type {string}
     */
    modelsNamespace;

    /**
     * @type {Channel}
     */
    channel;
    
    /**
     * @type {string}
     */
    channelName;

    /**
     * @type {string}
     */
    channelClassNamePrefix;

    /**
     * @type {object}
     */
    channelParameters;

    /**
     * @type {Payload}
     */
    payload;

    /**
     * @type {PublishOperation|null}
     */
    publishOperation;

    /**
     * @type {SubscribeOperation|null}
     */
    subscribeOperation;

}

export class PublishOperation {
    /**
     * @type {string}
     */
    name;

    /**
     * @type {Payload}
     */
    payload;
}

export class SubscribeOperation {
    /**
     * @type {string}
     */
    name;

    /**
     * @type {Payload}
     */
    payload;
}

export class Payload {
    /**
     * @type {string}
     */
    name;

    /**
     * @type {array}
     */
    subClasses;

    /**
     * @type {string}
     */
    discriminator;
}