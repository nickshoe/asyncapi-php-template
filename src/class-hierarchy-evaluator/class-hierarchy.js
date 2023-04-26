import { Class } from "./class";

export class ClassHierarchy {
  /**
   * @type {Class}
   */
  #rootClass;
  
  /**
   * @type {Map<string, Class>}
   */
  #classes;

  /**
   *
   * @param {Class} rootClass
   */
  constructor(rootClass) {
    this.#rootClass = rootClass;
    this.#classes = new Map();

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
    return Array.from(this.#classes.values());
  }

  /**
   *
   * @param {Class} aClass
   */
  addClass(aClass) {
    if (this.#classes.get(aClass.getName()) === undefined) {
      this.#classes.set(aClass.getName(), aClass);
    }
  }

  /**
   *
   * @param {string} className
   * @returns {Class|null}
   */
  getClass(className) {
    if (this.#classes.get(className) === undefined) {
      return null
    }

    return this.#classes.get(className);
  }
}
