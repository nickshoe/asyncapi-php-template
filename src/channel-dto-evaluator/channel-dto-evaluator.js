import { AsyncAPIDocument, Channel } from "@asyncapi/parser";
import { faker } from "@faker-js/faker";
import { Class } from "../class-hierarchy-evaluator/class";
import { ClassHierarchy } from "../class-hierarchy-evaluator/class-hierarchy";
import { ClassHierarchyEvaluator } from "../class-hierarchy-evaluator/class-hierrachy-evaluator";
import { InstanceVariable } from "../class-hierarchy-evaluator/member-variable";
import { Utils } from "../utils";

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

            const payloadDTO = this.#buildChannelPayloadDTO(payloadClass);

            const usedClasses = new Map();
            usedClasses.set(payloadDTO.name, payloadDTO.name);
            for (const payloadSubClass of payloadDTO.subClasses) {
                usedClasses.set(payloadSubClass.name, payloadSubClass.name);
            }

            publishOperation = {
                name: channel.publish().id() ? channel.publish().id() : `publish${this.buildChannelClassNamePrefix(channelName)}`,
                payload: payloadDTO,
                usedClasses: usedClasses
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

            const payloadDTO = this.#buildChannelPayloadDTO(payloadClass);

            const usedClasses = new Map();
            usedClasses.set(payloadDTO.name, payloadDTO.name);
            for (const payloadSubClass of payloadDTO.subClasses) {
                usedClasses.set(payloadSubClass.name, payloadSubClass.name);
            }

            subscribeOperation = {
                name: channel.subscribe().id() ? channel.subscribe().id() : `on${this.buildChannelClassNamePrefix(channelName)}`,
                payload: payloadDTO,
                usedClasses: usedClasses
            };
        }

        let channelParameters = {};
        if (channel.hasParameters()) {
            for (const parameterName in channel.parameters()) {
                const parameter = channel.parameter(parameterName);

                let parameterValue = '<parameter-value>';
                if (parameter.schema().examples() !== undefined && parameter.schema().examples().length > 0) {
                    parameterValue = parameter.schema().examples()[0];
                }

                channelParameters[parameterName] = parameterValue;
            }
        }


        let usedClasses = new Map();
        if (subscribeOperation !== null) {
            subscribeOperation.usedClasses.forEach(usedClass => usedClasses.set(usedClass, usedClass));
        }
        if (publishOperation !== null) {
            publishOperation.usedClasses.forEach(usedClass => usedClasses.set(usedClass, usedClass));
        }


        const classInstanceExamples = new Map();
        if (subscribeOperation !== null) {
            const payloadClass = this.#classHierarchy.getClass(subscribeOperation.payload.name);

            classInstanceExamples.set(payloadClass.getName(), this.#buildExampleInstance(payloadClass));

            if (payloadClass.hasSubClasses()) {
                classInstanceExamples.set(payloadClass.getName(), this.#buildExampleInstance(payloadClass.getSubClasses()[0])); // TODO: refactor

                for (const payloadClassSubClass of payloadClass.getSubClasses()) {
                    classInstanceExamples.set(payloadClassSubClass.getName(), this.#buildExampleInstance(payloadClassSubClass));
                }
            }
        }

        return {
            servicesNamespace: this.#servicesNamespace,
            modelsNamespace: this.#modelsNamespace,
            channel: channel,
            channelName: channelName,
            channelClassNamePrefix: this.buildChannelClassNamePrefix(channelName),
            publishOperation: publishOperation,
            subscribeOperation: subscribeOperation,
            channelParameters: channelParameters,
            usedClasses: usedClasses,
            classInstanceExamples: classInstanceExamples
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
            subClasses: payloadClass.getSubClasses().map((subClass) => ({ name: subClass.getName() })),
            discriminator: payloadClass.getInstanceVariables().filter((variable) => variable.isDiscriminator())[0]?.getName() // TODO: refactor
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

    /**
     * 
     * @param {Class} clazz 
     * @returns {object}
     */
    #buildExampleInstance(clazz) {
        const exampleInstance = {};

        for (const instanceVariable of clazz.getInheritedInstanceVariables().concat(clazz.getInstanceVariables())) {
            let propertyValue = undefined;

            if (instanceVariable.isDiscriminator()) {
                propertyValue = clazz.getName();
            } else {
                propertyValue = this.#generateExampleValue(instanceVariable);
            }

            const propertyName = Utils.camelToSnakeCase(instanceVariable.getName()); // TODO: refactor - this is a view (i.e. target language dependenant) concern
            exampleInstance[propertyName] = propertyValue;
        }

        return exampleInstance;
    }

    /**
     * 
     * @param {InstanceVariable} instanceVariable 
     * @returns {any}
     */
    #generateExampleValue(instanceVariable) {
        // TODO - refactor: use strategy pattern, construct an instance value from the characteristics of the instance variable

        if (instanceVariable.isDiscriminator()) {
            throw new Error('Example value for discriminator instance variable should already be handled at a higher level.');
        } else {
            if (instanceVariable.getType().isUserDefinedClass()) {
                return this.#buildExampleInstance(instanceVariable.getType());
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

    /**
     * @type {Map<string, string>}
     */
    usedClasses;

    /**
     * @type {Map<string, object>}
     */
    classInstanceExamples;

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

    /**
     * @type {Map<string, string>}
     */
    usedClasses;
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

    /**
     * @type {Map<string, string>}
     */
    usedClasses;
}

export class Payload {
    /**
     * @type {string}
     */
    name;

    /**
     * @type {PayloadSubClass[]}
     */
    subClasses;

    /**
     * @type {string|null}
     */
    discriminator;
}

export class PayloadSubClass {
    /**
     * @type {string}
     */
    name;
}