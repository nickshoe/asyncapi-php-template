import { Class } from "./class";


export class Variable {
  _name;
  _type;

  constructor(name, type) {
    this._name = name;
    this._type = type;
  }

  /**
   * 
   * @returns {string}
   */
  getName() {
    return this._name;
  }

  /**
   * 
   * @returns {Class}
   */
  getType() {
    return this._type;
  }
}

export class MemberVariable extends Variable {
  /**
   * @type {string}
   */
  _accessibility;

  /**
   *
   * @param {string} name
   * @param {Class} type
   * @param {string} accessibility
   */
  constructor(name, type, accessibility = 'private') {
    super(name, type);

    this._accessibility = accessibility; // TODO: use enum
  }

  /**
   * 
   * @returns {string}
   */
  getAccessibility() {
    return this._accessibility;
  }

  /**
   * 
   * @returns {boolean}
   */
  isPrivate() {
    return this._accessibility === 'private';
  }
}

export class InstanceVariable extends MemberVariable {
  /**
   * @type {boolean}
   */
  _isDiscriminator;

  /**
   * 
   * @param {boolean} isDiscriminator 
   */
  setIsDiscrimnator(isDiscriminator) {
    this._isDiscriminator = isDiscriminator;
  }

  /**
   * 
   * @returns {boolean}
   */
  isDiscriminator() {
    return this._isDiscriminator;
  }
}

export class TypeVariable extends Variable { }