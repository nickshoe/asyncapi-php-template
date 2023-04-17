import { AsyncAPIDocument, Schema } from "@asyncapi/parser";
import { Class } from "./class";
import { ClassHierarchy } from "./class-hierarchy";
import { InstanceVariable, TypeVariable, Variable } from "./member-variable";

const OBJECT_CLASS_NAME = "Object";
const ARRAY_CLASS_NAME = "Array";
const STRING_CLASS_NAME = "String";
const INTEGER_CLASS_NAME = "Integer";
const NUMBER_CLASS_NAME = "Number";

export class ClassHierarchyEvaluator {

  static get OBJECT_CLASS_NAME() {
    return OBJECT_CLASS_NAME;
  }

  static get ARRAY_CLASS_NAME() {
    return ARRAY_CLASS_NAME;
  }

  static get STRING_CLASS_NAME() {
    return STRING_CLASS_NAME;
  }

  static get INTEGER_CLASS_NAME() {
    return INTEGER_CLASS_NAME;
  }

  static get NUMBER_CLASS_NAME() {
    return NUMBER_CLASS_NAME;
  }

  /**
   *
   * @param {AsyncAPIDocument} asyncapi
   * @param {string}
   */
  constructor(asyncapi, modelsNamespace) {
    this.debug = false;

    this.asyncapi = asyncapi;
    this.modelsNamespace = modelsNamespace;

    const objectClass = new Class(ClassHierarchyEvaluator.OBJECT_CLASS_NAME);

    this.classHierarchy = new ClassHierarchy(objectClass);

    // TODO: refactor - create method in ClassHierarchy
    const arrayClass = new Class(ClassHierarchyEvaluator.ARRAY_CLASS_NAME);
    arrayClass.setSuperClass(objectClass);
    objectClass.addSubClass(arrayClass);
    this.classHierarchy.addClass(arrayClass);

    const stringClass = new Class(ClassHierarchyEvaluator.STRING_CLASS_NAME);
    stringClass.setSuperClass(objectClass);
    objectClass.addSubClass(stringClass);
    this.classHierarchy.addClass(stringClass);

    const integerClass = new Class(ClassHierarchyEvaluator.INTEGER_CLASS_NAME);
    integerClass.setSuperClass(objectClass);
    objectClass.addSubClass(integerClass);
    this.classHierarchy.addClass(integerClass);

    const numberClass = new Class(ClassHierarchyEvaluator.NUMBER_CLASS_NAME);
    numberClass.setSuperClass(objectClass);
    objectClass.addSubClass(numberClass);
    this.classHierarchy.addClass(numberClass);
  }

  /**
   * 
   * @param {boolean} debug 
   */
  setDebug(debug) {
    this.debug = debug;
  }

  /**
   *
   * @returns {ClassHierarchy}
   */
  evaluate() {
    const schemasMap = this.asyncapi.allSchemas();

    for (const [key, schema] of schemasMap) {
      if (schema.type() === "object") {
        this.#evaluateObjectSchema(schema);
      }

      if (schema.type() === undefined) {
        this.#evaluateCompositeObjectSchema(schema);
      }

      // TODO: asyncapi.allSchemas() includes also schemas properties: handle them here instead of in the objects evaluators?
    }

    return this.classHierarchy;
  }

  /**
   *
   * @param {Schema} schema
   */
  #evaluateObjectSchema(schema) {
    if (schema.discriminator() !== undefined) {
      this.#log(`schema '${schema.uid()}' is a super class`);
    } else {
      this.#log(`schema '${schema.uid()}' is a class`);
    }

    let schemaClass = this.#setupSchemaClassIfNotPresent(schema);

    const instanceVariables = this.#evaluateSchemaProperties(schema);

    instanceVariables.forEach((instanceVariable) => {
      if (schema.discriminator() === instanceVariable.getName()) {
        instanceVariable.setIsDiscrimnator(true);
      }

      schemaClass.addInstanceVariable(instanceVariable);
    });
  }

  /**
   * 
   * @param {Schema} schema
   */
  #evaluateCompositeObjectSchema(schema) {
    const componentsSchemas = schema.allOf();
    const schemaIsAComposite = componentsSchemas !== null;

    if (!schemaIsAComposite) {
      throw new Error(`Schema '${schema.uid()}' is not a composite schema.`);
    }

    this.#log(`Schema '${schema.uid()}' is composed by multiple schemas.`);

    // TODO: refactor - schemaClass usage is dependand on the execution of the for cycle
    let schemaClass = null;
    for (const componentSchema of componentsSchemas) {
      if (componentSchema.discriminator() !== undefined) {
        this.#log(`Schema '${schema.uid()}' is a sub class of '${componentSchema.uid()}' super class`);

        const superClassName = this.#buildSchemaClassName(componentSchema);

        const baseClass = this.classHierarchy.getClass(superClassName);

        if (baseClass === null) {
          throw new Error(`Super class ${superClassName} not defined.`);
        }

        schemaClass = this.#setupSchemaClassIfNotPresent(schema, baseClass);
      } else {
        this.#log(`Schema '${schema.uid()}' embeds the properties of the '${componentSchema.uid()}' schema`);

        const instanceVariables = this.#evaluateSchemaProperties(componentSchema);

        instanceVariables.forEach((instanceVariable) => schemaClass.addInstanceVariable(instanceVariable));
      }
    }
  }

  /**
   *
   * @param {Schema} schema
   * @returns {InstanceVariable[]}
   */
  #evaluateSchemaProperties(schema) {
    const instanceVariables = [];

    const properties = schema.properties();

    for (const propertyName in properties) {
      const propertySchema = properties[propertyName];

      const instanceVariable = this.buildInstanceVariable(propertySchema, propertyName);

      instanceVariables.push(instanceVariable);
    }

    return instanceVariables;
  }

  /**
   * 
   * @param {Schema} propertySchema
   * @param {string} propertyName
   * @returns {Variable}
   */
  buildInstanceVariable(propertySchema, propertyName) {
    const variableClass = this.determineVariableClass(propertySchema);

    return new InstanceVariable(propertyName, variableClass);
  }

  /**
   * 
   * @param {Schema} propertySchema 
   * @returns {Class}
   */
  determineVariableClass(propertySchema) {
    let variableClass;

    const propertySchemaType = propertySchema.type();
    switch (propertySchemaType) {
      case "object":
        const propertySchemaClassName = this.#buildSchemaClassName(propertySchema);
        variableClass = this.classHierarchy.getClass(propertySchemaClassName);

        if (variableClass === null) {
          variableClass = this.#setupSchemaClassIfNotPresent(propertySchema);
        }
        break;
      case 'array':
        variableClass = this.classHierarchy.getClass(ClassHierarchyEvaluator.ARRAY_CLASS_NAME);

        const itemsSchema = propertySchema.items();

        if (Array.isArray(itemsSchema)) {
          throw new Error('Array of multiple types currently not supported');
        }

        const typeVariableClass = this.determineVariableClass(itemsSchema);
        const typeVariable = new TypeVariable('T', typeVariableClass); // TODO: refactor

        variableClass.addTypeVariable(typeVariable);
        break;
      case "string":
        variableClass = this.classHierarchy.getClass(ClassHierarchyEvaluator.STRING_CLASS_NAME);
        break;
      case "integer":
        variableClass = this.classHierarchy.getClass(ClassHierarchyEvaluator.INTEGER_CLASS_NAME);
        break;
      case "number":
        variableClass = this.classHierarchy.getClass(ClassHierarchyEvaluator.NUMBER_CLASS_NAME);
        break;
      default:
        throw new Error(`Unhandled property type '${propertySchemaType}'`);
    }

    if (variableClass === null) {
      throw new Error(`Could not find class for property '${propertySchema.uid()}' of type '${propertySchemaType}'`);
    }

    return variableClass;
  }

  /**
   *
   * @param {Schema} schema
   * @param {Class} baseClass
   * @returns {Class}
   */
  #setupSchemaClassIfNotPresent(schema, baseClass = null) {
    const className = this.#buildSchemaClassName(schema);

    if (baseClass === null) {
      baseClass = this.classHierarchy.getRootClass();
    }

    let schemaClass = this.classHierarchy.getClass(className);

    if (schemaClass !== null) {
      return schemaClass;
    }

    const packageName = this.buildPackageName();
    schemaClass = new Class(className, packageName);
    schemaClass.setSuperClass(baseClass);
    baseClass.addSubClass(schemaClass);

    this.classHierarchy.addClass(schemaClass);

    return schemaClass;
  }

  /**
   *
   * @param {Schema} schema
   * @returns {string}
   */
  #buildSchemaClassName(schema) {
    const nameTokens = schema.uid().replace(/<|>/g, "").split("-");

    const className = nameTokens.map((token) => token.charAt(0).toUpperCase() + token.slice(1)).join("");

    return className;
  }

  /**
   * 
   * @returns {string}
   */
  buildPackageName() {
    return this.modelsNamespace; // + '\\' + this.asyncapi.info().title().toLowerCase().replace(/\-|\s/g, "\\");
  }

  #log(message) {
    if (this.debug === true) {
      console.log(message);
    }
  }
}
