import { InstanceVariable, TypeVariable, Variable } from "./member-variable";

export const DEFAULT_PACKAGE_NAME = 'default';

export class Class {
  #packageName;
  #name;

  /**
   * @type {Class|null}
   */
  #superClass;

  /**
   * @type {Map<string, Class>}
   */
  #subClasses;

  /**
   * @type {Map<string, Variable>}
   */
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
    this.#subClasses = new Map();
    this.#instanceVariables = new Map();
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
   * @returns {Class|null}
   */
  getSuperClass() {
    return this.#superClass;
  }

  /**
   *
   * @param {Class|null} superClass
   */
  setSuperClass(superClass) {
    this.#superClass = superClass;
  }

  /**
   *
   * @returns {Class[]}
   */
  getSubClasses() {
    return Array.from(this.#subClasses.values());
  }

  /**
   * 
   * @returns {boolean}
   */
  hasSubClasses() {
    return this.#subClasses.size > 0;
  }

  /**
   *
   * @returns {InstanceVariable[]}
   */
  getInstanceVariables() {
    return Array.from(this.#instanceVariables.values());
  }

  /**
   * 
   * @returns {InstanceVariable[]}
   */
  getInheritedInstanceVariables() {
    if (this.#superClass === null) {
      return [];
    }

    return this.#superClass.getInstanceVariables().concat(this.#superClass.getInheritedInstanceVariables());
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
    if (this.#subClasses.get(subClass.getName()) !== undefined) {
      throw new Error(`There already exist a sub class named ${subClass.getName()}`);
    }

    this.#subClasses.set(subClass.getName(), subClass);
  }

  /**
   *
   * @param {InstanceVariable} instanceVariable
   */
  addInstanceVariable(instanceVariable) {
    if (this.#instanceVariables.get(instanceVariable.getName()) !== undefined) {
      throw new Error(`There already exist an instance variable named ${instanceVariable.getName()}`);
    }

    this.#instanceVariables.set(instanceVariable.getName(), instanceVariable);
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
