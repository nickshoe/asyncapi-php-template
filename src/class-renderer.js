import { File, Text } from "@asyncapi/generator-react-sdk";
import { Class } from "./class-hierarchy-evaluator/class";

export class ClassRenderer {

    constructor() {
        if (this.constructor == ClassRenderer) {
            throw new Error("This class is abstract, thus can't be instantiated.");
        }
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns {JSX.Element}
     */
    renderClassFile(currentClass) {
        const filePath = this.renderClassFilePath(currentClass);

        const phpOpeningTag = '<?php';

        const preambleBlock = this.renderPreambleBlock(currentClass);

        const namespaceBlock = this.renderNamespaceBlock(currentClass);

        const usesBlock = this.renderUsesBlock(currentClass);

        const classCommentBlock = this.renderClassCommentBlock(currentClass);

        const classAccessModifiersBlock = this.getClassAccessModidiers(currentClass).join(' ');

        const classNameBlock = `class ${this.getClassName(currentClass)}`;

        const extendsClause = this.renderExtendsClause(currentClass);

        const instanceVariablesBlock = this.renderInstanceVariablesBlock(currentClass);

        const constructorBlock = this.renderConstructorBlock(currentClass);

        const accessorsBlock = this.renderAccessorsBlock(currentClass);

        return <File name={filePath}>
            <Text>{phpOpeningTag}</Text>
            <Text></Text>

            {preambleBlock !== '' && <Text>{preambleBlock}</Text>}
            {preambleBlock !== '' && <Text></Text>}

            {namespaceBlock !== '' && <Text>{namespaceBlock}</Text>}
            {namespaceBlock !== '' && <Text></Text>}

            {usesBlock !== '' && <Text>{usesBlock}</Text>}
            {usesBlock !== '' && <Text></Text>}

            {classCommentBlock !== '' && <Text>{classCommentBlock}</Text>}
            <Text>{classAccessModifiersBlock !== '' && `${classAccessModifiersBlock} `}{classNameBlock}{extendsClause !== '' && ` ${extendsClause}`}</Text>
            <Text>{"{"}</Text>

            <Text></Text>

            {instanceVariablesBlock !== '' && <Text>{instanceVariablesBlock}</Text>}
            {instanceVariablesBlock !== '' && <Text></Text>}

            {constructorBlock !== '' && <Text>{constructorBlock}</Text>}
            {constructorBlock !== '' && <Text></Text>}

            {accessorsBlock !== '' && <Text>{accessorsBlock}</Text>}
            {accessorsBlock !== '' && <Text></Text>}

            <Text>{"}"}</Text>
        </File>;
    }

    /**
     * 
     * @param {Class} currentClass
     * @returns {string[]}
     */
    getClassAccessModidiers(currentClass) {
        throw new Error('Not implemented.');
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns {string}
     */
    getClassName(currentClass) {
        throw new Error('Not implemented.');
    }

    /**
     * 
     * @param {Class} currentClass
     * @returns {string}
     */
    renderClassFilePath(currentClass) {
        throw new Error('Not implemented.');
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns 
     */
    renderPreambleBlock(currentClass) {
        throw new Error('Not implemented.');
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns {string}
     */
    renderNamespaceBlock(currentClass) {
        throw new Error('Not implemented.');
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns {string}
     */
    renderUsesBlock(currentClass) {
        throw new Error('Not implemented.');
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns {string}
     */
    renderClassCommentBlock(currentClass) {
        throw new Error('Not implemented.');
    }

    /**
     *
     * @param {Class} currentClass
     * @returns {string}
     */
    renderExtendsClause(currentClass) {
        throw new Error('Not implemented.');
    }

    /**
     *
     * @param {Class} currentClass
     * @returns {string}
     */
    renderInstanceVariablesBlock(currentClass) {
        throw new Error('Not implemented.');
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns {string}
     */
    renderConstructorBlock(currentClass) {
        throw new Error('Not implemented.');
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns {string}
     */
    renderAccessorsBlock(currentClass) {
        throw new Error('Not implemented.');
    }

}