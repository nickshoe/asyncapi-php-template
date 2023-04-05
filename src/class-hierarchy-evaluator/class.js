import { InstanceVariable, TypeVariable, Variable } from "./member-variable";

export const DEFAULT_PACKAGE_NAME = 'default';

export class Class {
  #packageName;
  #name;
  #superClass;
  #subClasses;

  // TODO: use a map
  #instanceVariables;

  /**
   * @type {Map<string, Variable>}
   */
  #typeVariables;

  /**
   *
   * @param {string} name
   * @param {string} packageName
   */
  constructor(name, packageName = DEFAULT_PACKAGE_NAME) {
    this.#packageName = packageName;
    this.#name = name;
    this.#superClass = null;
    this.#subClasses = [];
    this.#instanceVariables = [];
    this.#typeVariables = new Map();
  }

  /**
   *
   * @returns {string}
   */
  getPackageName() {
    return this.#packageName;
  }

  /**
   * 
   * @returns {boolean}
   */
  isBuiltInClass() {
    return this.getPackageName() === DEFAULT_PACKAGE_NAME;
  }

  /**
   * 
   * @returns {boolean}
   */
  isUserDefinedClass() {
    return !this.isBuiltInClass();
  }

  /**
   * 
   * @returns {boolean}
   */
  extendsUserDefinedSuperClass() {
    return this.getSuperClass() !== null && this.getSuperClass().isUserDefinedClass();
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
  getSuperClass() {
    return this.#superClass;
  }

  /**
   *
   * @param {Class} superClass
   */
  setSuperClass(superClass) {
    this.#superClass = superClass;
  }

  /**
   *
   * @returns {Class[]}
   */
  getSubClasses() {
    return this.#subClasses;
  }

  /**
   * 
   * @returns {boolean}
   */
  hasSubClasses() {
    return this.#subClasses.length > 0;    
  }

  /**
   *
   * @returns {InstanceVariable[]}
   */
  getInstanceVariables() {
    return this.#instanceVariables;
  }

  /**
   * 
   * @returns {TypeVariable[]}
   */
  getTypeVariables() {
    return Array.from(this.#typeVariables.values());
  }

  /**
   *
   * @param {Class} subClass
   */
  addSubClass(subClass) {
    const matchingSubClasses = this.getSubClasses().filter(
      (currentClass) => currentClass.getName() === subClass.getName()
    );

    if (matchingSubClasses.length > 1) {
      throw new Error(`Found more than one sub class with name ${subClass.getName()}.`);
    }

    if (matchingSubClasses.length === 1) {
      return;
    }

    this.#subClasses.push(subClass);
  }

  /**
   *
   * @param {InstanceVariable} instanceVariable
   */
  addInstanceVariable(instanceVariable) {
    const matchingVariables = this.getInstanceVariables().filter((variable) => variable.getName() === instanceVariable.getName());

    if (matchingVariables.length > 1) {
      throw new Error(`Found more than one instance variable named ${instanceVariable.getName()}`);
    }

    if (matchingVariables.length === 1) {
      throw new Error(`There already exist an instance variable named ${instanceVariable.getName()}`);
    }

    this.#instanceVariables.push(instanceVariable);
  }

  /**
   * 
   * @param {TypeVariable} typeVariable 
   */
  addTypeVariable(typeVariable) {
    if (this.#typeVariables.get(typeVariable.getName()) !== undefined) {
      throw new Error(`There already exist a type variable named ${typeVariable.getName()}`);
    }

    this.#typeVariables.set(typeVariable.getName(), typeVariable);
  }
}
