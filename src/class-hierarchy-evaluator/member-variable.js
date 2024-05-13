import { Class } from "./class";
import { ClassHierarchyEvaluator } from "./class-hierrachy-evaluator";


export class Variable {

  /**
   * @type {string}
   */
  #name;

  /**
   * @type {string}
   */
  #type;

  /**
   * @type {boolean}
   */
  #optional;

  constructor(name, type, optional = false) {
    this.#name = name;
    this.#type = type;
    this.#optional = optional;
  }

  /**
   * 
   * @returns {string}
   */
  getName() {
    return this.#name;
  }

  /**
   * 
   * @returns {Class}
   */
  getType() {
    return this.#type;
  }

  /**
   * 
   * @returns {boolean}
   */
  isOptional() {
    return this.#optional;
  }

}

export class MemberVariable extends Variable {

  /**
   * @type {string}
   */
  #accessibility;

  /**
   * @type {boolean}
   */
  #readOnly;

  /**
   *
   * @param {string} name
   * @param {Class} type
   * @param {boolean} optional
   * @param {string} accessibility
   * @param {boolean} readOnly
   */
  constructor(
    name,
    type,
    optional = false,
    accessibility = ClassHierarchyEvaluator.PRIVATE_ACCESS_MODIFIER,
    readOnly = false,
  ) {
    super(name, type, optional);

    this.#accessibility = accessibility;
    this.#readOnly = readOnly;
  }

  /**
   * 
   * @returns {string}
   */
  getAccessibility() {
    return this.#accessibility;
  }

  /**
   * 
   * @returns {boolean}
   */
  isPrivate() {
    return this.#accessibility === ClassHierarchyEvaluator.PRIVATE_ACCESS_MODIFIER;
  }

  /**
   * 
   * @returns {boolean}
   */
  isReadOnly() {
    return this.#readOnly;
  }

  /**
   * 
   * @param {boolean} readOnly 
   */
  setReadOnly(readOnly) {
    this.#readOnly = readOnly;
  }

}

export class InstanceVariable extends MemberVariable {

  /**
   * @type {boolean}
   */
  #discriminator;

  /**
   *
   * @param {string} name
   * @param {Class} type
   * @param {boolean} optional
   * @param {string} accessibility
   * @param {boolean} readOnly
   * @param {boolean} discriminator
   */
  constructor(
    name,
    type,
    optional = false,
    accessibility = ClassHierarchyEvaluator.PRIVATE_ACCESS_MODIFIER,
    readOnly = false,
    discriminator = false,
  ) {
    super(name, type, optional, accessibility, readOnly);

    this.#discriminator = discriminator;
  }

  /**
   * 
   * @returns {boolean}
   */
  isDiscriminator() {
    return this.#discriminator;
  }

  /**
   * 
   * @param {boolean} discriminator 
   */
  setDiscrimnator(discriminator) {
    this.#discriminator = discriminator;
  }

}

export class TypeVariable extends Variable { }