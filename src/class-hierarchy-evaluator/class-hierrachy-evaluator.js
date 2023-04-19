import { AsyncAPIDocument, Schema } from "@asyncapi/parser";
import { Class } from "./class";
import { ClassHierarchy } from "./class-hierarchy";
import { InstanceVariable, TypeVariable, Variable } from "./member-variable";

const PRIVATE_ACCESS_MODIFIER = 'private';
const PROTECTED_ACCESS_MODIFIER = 'protected';
const PUBLIC_ACCESS_MODIFIER = 'public';

const OBJECT_CLASS_NAME = "Object";
const ARRAY_CLASS_NAME = "Array";
const STRING_CLASS_NAME = "String";
const INTEGER_CLASS_NAME = "Integer";
const LONG_CLASS_NAME = "Long";
const NUMBER_CLASS_NAME = "Number";
const FLOAT_CLASS_NAME = "Float";
const DOUBLE_CLASS_NAME = "Double";
const INSTANT_CLASS_NAME = "Instant";

export class ClassHierarchyEvaluator {

  static get PRIVATE_ACCESS_MODIFIER() {
    return PRIVATE_ACCESS_MODIFIER;
  }

  static get PROTECTED_ACCESS_MODIFIER() {
    return PROTECTED_ACCESS_MODIFIER;
  }

  static get PUBLIC_ACCESS_MODIFIER() {
    return PUBLIC_ACCESS_MODIFIER;
  }

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

  static get LONG_CLASS_NAME() {
    return LONG_CLASS_NAME;
  }

  static get NUMBER_CLASS_NAME() {
    return NUMBER_CLASS_NAME;
  }

  static get FLOAT_CLASS_NAME() {
    return FLOAT_CLASS_NAME;
  }

  static get DOUBLE_CLASS_NAME() {
    return DOUBLE_CLASS_NAME;
  }

  static get INSTANT_CLASS_NAME() {
    return INSTANT_CLASS_NAME;
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

    const longClass = new Class(ClassHierarchyEvaluator.LONG_CLASS_NAME);
    longClass.setSuperClass(objectClass);
    objectClass.addSubClass(longClass);
    this.classHierarchy.addClass(longClass);

    const numberClass = new Class(ClassHierarchyEvaluator.NUMBER_CLASS_NAME);
    numberClass.setSuperClass(objectClass);
    objectClass.addSubClass(numberClass);
    this.classHierarchy.addClass(numberClass);

    const floatClass = new Class(ClassHierarchyEvaluator.FLOAT_CLASS_NAME);
    floatClass.setSuperClass(objectClass);
    objectClass.addSubClass(floatClass);
    this.classHierarchy.addClass(floatClass);

    const doubleClass = new Class(ClassHierarchyEvaluator.DOUBLE_CLASS_NAME);
    doubleClass.setSuperClass(objectClass);
    objectClass.addSubClass(doubleClass);
    this.classHierarchy.addClass(doubleClass);

    const instantClass = new Class(ClassHierarchyEvaluator.INSTANT_CLASS_NAME);
    instantClass.setSuperClass(objectClass);
    objectClass.addSubClass(instantClass);
    this.classHierarchy.addClass(instantClass);
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

    return new InstanceVariable(
      propertyName,
      variableClass,
      ClassHierarchyEvaluator.PRIVATE_ACCESS_MODIFIER,
      propertySchema.readOnly()
    );
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
        if (propertySchema.format() === undefined) {
          variableClass = this.classHierarchy.getClass(ClassHierarchyEvaluator.STRING_CLASS_NAME);
        } else {
          switch (propertySchema.format()) {
            case 'date':
            case 'date-time':
              variableClass = this.classHierarchy.getClass(ClassHierarchyEvaluator.INSTANT_CLASS_NAME);
              break;
            default:
              console.warn(`Treating unknown type '${propertySchemaType}' format '${propertySchema.format()}' as a generic string.`);
              variableClass = this.classHierarchy.getClass(ClassHierarchyEvaluator.STRING_CLASS_NAME);
          }
        }
        break;
      case "integer":
        if (propertySchema.format() === undefined) {
          variableClass = this.classHierarchy.getClass(ClassHierarchyEvaluator.INTEGER_CLASS_NAME);
        } else {
          switch (propertySchema.format()) {
            case 'int32':
              variableClass = this.classHierarchy.getClass(ClassHierarchyEvaluator.INTEGER_CLASS_NAME);
            case 'int64':
              variableClass = this.classHierarchy.getClass(ClassHierarchyEvaluator.LONG_CLASS_NAME);
              break;
            default:
              console.warn(`Treating unknown type '${propertySchemaType}' format '${propertySchema.format()}' as an integer.`);
              variableClass = this.classHierarchy.getClass(ClassHierarchyEvaluator.INTEGER_CLASS_NAME);
          }
        }
        break;
      case "number":
        if (propertySchema.format() === undefined) {
          variableClass = this.classHierarchy.getClass(ClassHierarchyEvaluator.NUMBER_CLASS_NAME);
        } else {
          switch (propertySchema.format()) {
            case 'float':
              variableClass = this.classHierarchy.getClass(ClassHierarchyEvaluator.FLOAT_CLASS_NAME);
            case 'double':
              variableClass = this.classHierarchy.getClass(ClassHierarchyEvaluator.DOUBLE_CLASS_NAME);
              break;
            default:
              console.warn(`Treating unknown type '${propertySchemaType}' format '${propertySchema.format()}' as a generic number.`);
              variableClass = this.classHierarchy.getClass(ClassHierarchyEvaluator.NUMBER_CLASS_NAME);
          }
        }
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
    return this.modelsNamespace;
  }

  #log(message) {
    if (this.debug === true) {
      console.log(message);
    }
  }
}
