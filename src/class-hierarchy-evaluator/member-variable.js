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

  constructor(name, type) {
    this.#name = name;
    this.#type = type;
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

}

export class MemberVariable extends Variable {

  /**
   * @type {string}
   */
  #accessibility;

  /**
   * @type {boolean}
   */
  #isReadOnly;

  /**
   *
   * @param {string} name
   * @param {Class} type
   * @param {string} accessibility
   * @param {boolean} isReadOnly
   */
  constructor(
    name,
    type,
    accessibility = ClassHierarchyEvaluator.PRIVATE_ACCESS_MODIFIER,
    isReadOnly = false
  ) {
    super(name, type);

    this.#accessibility = accessibility;

    this.#isReadOnly = isReadOnly;
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
    return this.#isReadOnly;
  }

  /**
   * 
   * @param {boolean} isReadOnly 
   */
  setIsReadOnly(isReadOnly) {
    this.#isReadOnly = isReadOnly;
  }

}

export class InstanceVariable extends MemberVariable {

  /**
   * @type {boolean}
   */
  #isDiscriminator;

  /**
   *
   * @param {string} name
   * @param {Class} type
   * @param {string} accessibility
   * @param {boolean} isReadOnly
   * @param {boolean} isDiscriminator
   */
  constructor(
    name,
    type,
    accessibility = ClassHierarchyEvaluator.PRIVATE_ACCESS_MODIFIER,
    isReadOnly = false,
    isDiscriminator = false
  ) {
    super(name, type, accessibility, isReadOnly);

    this.#isDiscriminator = isDiscriminator;
  }

  /**
   * 
   * @returns {boolean}
   */
  isDiscriminator() {
    return this.#isDiscriminator;
  }

  /**
   * 
   * @param {boolean} isDiscriminator 
   */
  setIsDiscrimnator(isDiscriminator) {
    this.#isDiscriminator = isDiscriminator;
  }

}

export class TypeVariable extends Variable { }