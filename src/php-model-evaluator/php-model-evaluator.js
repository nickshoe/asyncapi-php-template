import { Class } from "../class-hierarchy-evaluator/class";
import { ClassHierarchy } from "../class-hierarchy-evaluator/class-hierarchy";
import { ClassRenderer } from "../class-renderer";
import { PhpModelClassRenderer } from "./php-model-class-renderer";

export class PhpModelEvaluator {
    /**
     * @type {ClassHierarchy}
     */
    #classHierarchy;

    /**
     * @type {ClassRenderer}
     */
    #classRenderer;

    /**
     *
     * @param {ClassHierarchy} classHierarchy
     */
    constructor(classHierarchy) {
        this.#classHierarchy = classHierarchy;

        this.#classRenderer = new PhpModelClassRenderer();
    }

    /**
     * 
     * @returns {JSX.Element[]}
     */
    evaluate() {
        return this.#traverseClassHierarchy(this.#classHierarchy.getRootClass());
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns {JSX.Element[]}
     */
    #traverseClassHierarchy(currentClass) {
        let files = [];
        currentClass.getSubClasses()
            .filter((subClass) => subClass.isUserDefinedClass())
            .forEach((subClass) => (files = files.concat(this.#traverseClassHierarchy(subClass))));

        if (currentClass.isBuiltInClass()) {
            return files;
        }

        const classFile = this.#classRenderer.renderClassFile(currentClass);

        files.push(classFile);

        return files;
    }
}
