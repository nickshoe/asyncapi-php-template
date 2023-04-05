import { Class } from "./class";

export class ClassHierarchy {
  #rootClass;
  #classes;

  /**
   *
   * @param {Class} rootClass
   */
  constructor(rootClass) {
    this.#rootClass = rootClass;
    this.#classes = [];

    this.addClass(rootClass);
  }

  /**
   *
   * @returns {Class}
   */
  getRootClass() {
    return this.#rootClass;
  }

  /**
   * 
   * @returns {Class[]}
   */
  getClasses() {
    return this.#classes;
  }

  /**
   *
   * @param {Class} aClass
   */
  addClass(aClass) {
    if (this.getClass(aClass.getName()) === null) {
      this.#classes.push(aClass);
    }
  }

  /**
   *
   * @param {string} className
   * @returns {Class}
   */
  getClass(className) {
    const matchingClasses = this.getClasses().filter((currentClass) => currentClass.getName() === className);

    if (matchingClasses.length > 1) {
      throw new Error(`Found more than one class having the name ${className}.`);
    }

    if (matchingClasses.length === 0) {
      return null;
    }

    return matchingClasses[0];
  }
}
