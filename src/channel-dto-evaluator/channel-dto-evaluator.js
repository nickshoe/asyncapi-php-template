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

        const channelParameters = {};
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


        const usedClasses = new Map();
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
     * @param {Class} theClass 
     * @returns {object}
     */
    #buildExampleInstance(theClass) {
        const exampleInstance = {};

        for (const instanceVariable of theClass.getInheritedInstanceVariables().concat(theClass.getInstanceVariables())) {
            let propertyValue = undefined;

            if (instanceVariable.isDiscriminator()) {
                propertyValue = theClass.getName();
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
        if (instanceVariable.isDiscriminator()) {
            throw new Error('Example value for discriminator instance variable should already be handled at a higher level.');
        }

        if (instanceVariable.getType().isUserDefinedClass()) {
            return this.#buildExampleInstance(instanceVariable.getType());
        }

        switch (instanceVariable.getType().getName()) {
            case ClassHierarchyEvaluator.INTEGER_CLASS_NAME:
                return GeneratorFactory.NUMBER_GENERATOR().apply(instanceVariable.getName());
            case ClassHierarchyEvaluator.STRING_CLASS_NAME:
                return GeneratorFactory.STRING_GENERATOR().apply(instanceVariable.getName());
            case ClassHierarchyEvaluator.INSTANT_CLASS_NAME:
                return faker.datatype.datetime();
            case ClassHierarchyEvaluator.BOOLEAN_CLASS_NAME:
                return faker.datatype.boolean();
            default:
                return faker.datatype.string();
        }
    }

}

class TypedExampleGenerator {

    /**
     * @type {Map<RegExp, Function>}
     */
    #strategies;

    /**
     * @type {Function|null}
     */
    #fallbackStrategy;

    /**
     * @param {Map<RegExp, Function>} strategies
     * @param {Function|null} fallbackStrategy
     */
    constructor(strategies, fallbackStrategy = null) {
        this.#strategies = strategies;
        this.#fallbackStrategy = fallbackStrategy;
    }

    /**
     * 
     * @param {string} input 
     * @returns {any}
     */
    apply(input) {
        if (this.#strategies.size === 0) {
            throw new Error('No strategies available');
        }

        for (const [regExp, generator] of this.#strategies.entries()) {
            if (regExp.test(input)) {
                return generator();
            }
        }

        if (this.#fallbackStrategy === null) {
            throw new Error(`No strategy could be applied for '${input}'`);
        }

        return this.#fallbackStrategy();
    }
}

class GeneratorFactory {

    /**
     * @type {TypedExampleGenerator|null}
     */
    static #numberGenerator = null;
    /**
     * @type {TypedExampleGenerator|null}
     */
    static #stringGenerator = null;

    static NUMBER_GENERATOR() {
        if (this.#numberGenerator === null) {
            const strategies = new Map();
            strategies.set(/id/i, () => faker.datatype.number({ min: 1, max: 100, precision: 1 }));

            this.#numberGenerator = new TypedExampleGenerator(strategies, faker.datatype.number);
        }

        return this.#numberGenerator;
    }

    static STRING_GENERATOR() {
        if (this.#stringGenerator === null) {
            const strategies = new Map();
            strategies.set(/id/i, faker.datatype.uuid);
            strategies.set(/email/i, faker.internet.email);// TODO: use firstName and lastName if available
            strategies.set(/user(name)?/i, faker.internet.userName);
            strategies.set(/[a-z|A-Z]*password/i, faker.internet.password);
            strategies.set(/firstname/i, faker.name.firstName);
            strategies.set(/lastname/i, faker.name.lastName);

            this.#stringGenerator = new TypedExampleGenerator(strategies, faker.datatype.string);
        }

        return this.#stringGenerator;
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