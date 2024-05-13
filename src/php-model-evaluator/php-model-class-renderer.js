import { ClassHierarchyEvaluator } from "../class-hierarchy-evaluator/class-hierrachy-evaluator";
import { Class } from "../class-hierarchy-evaluator/class";
import { InstanceVariable, Variable } from "../class-hierarchy-evaluator/member-variable";
import { ClassRenderer } from "../class-renderer";

export class PhpModelClassRenderer extends ClassRenderer {

    #builtInTypeMappings;

    constructor() {
        super();

        this.#builtInTypeMappings = new Map();
        this.#builtInTypeMappings.set(ClassHierarchyEvaluator.ARRAY_CLASS_NAME, 'array');
        this.#builtInTypeMappings.set(ClassHierarchyEvaluator.STRING_CLASS_NAME, 'string');
        this.#builtInTypeMappings.set(ClassHierarchyEvaluator.INTEGER_CLASS_NAME, 'int');
        this.#builtInTypeMappings.set(ClassHierarchyEvaluator.LONG_CLASS_NAME, 'int');
        this.#builtInTypeMappings.set(ClassHierarchyEvaluator.NUMBER_CLASS_NAME, 'int');
        this.#builtInTypeMappings.set(ClassHierarchyEvaluator.FLOAT_CLASS_NAME, 'float');
        this.#builtInTypeMappings.set(ClassHierarchyEvaluator.DOUBLE_CLASS_NAME, 'float');
        this.#builtInTypeMappings.set(ClassHierarchyEvaluator.INSTANT_CLASS_NAME, '\\DateTime'); // TODO: add param to allow usage of 'DateTimeImmutable'
        this.#builtInTypeMappings.set(ClassHierarchyEvaluator.BOOLEAN_CLASS_NAME, 'bool');
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns {string}
     */
    renderPreambleBlock(currentClass) {
        return '';
    }

    /**
     * 
     * @param {Class} currentClass
     * @returns {string[]}
     */
    getClassAccessModidiers(currentClass) {
        return [];
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns {string}
     */
    getClassName(currentClass) {
        return currentClass.getName();
    }

    /**
     * 
     * @param {Class} currentClass
     * @returns {string}
     */
    renderClassFilePath(currentClass) {
        return this.renderClassFileName(currentClass);
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns {string}
     */
    renderClassFileName(currentClass) {
        return `${currentClass.getName()}.php`; // TODO: create generator param for naming convention (e.g. ".class.php")
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns {string}
     */
    renderNamespaceBlock(currentClass) {
        const namespace = this.getNamespace(currentClass);

        return `namespace ${namespace};`;
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns {string}
     */
    getNamespace(currentClass) {
        return currentClass.getPackageName();
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns {string}
     */
    renderUsesBlock(currentClass) {
        const usesMap = new Map();

        if (currentClass.extendsUserDefinedSuperClass()) {
            const namespace = this.getNamespace(currentClass.getSuperClass());

            usesMap.set(`${namespace}\\${currentClass.getSuperClass().getName()}`, `use ${namespace}\\${currentClass.getSuperClass().getName()};`);
            usesMap.set('JMS\\Serializer\\Annotation\\Discriminator', 'use JMS\\Serializer\\Annotation\\Discriminator;');
        }

        currentClass.getInstanceVariables()
            .filter((instanceVariable) => !instanceVariable.isDiscriminator())
            .filter((instanceVariable) => instanceVariable.getType().isUserDefinedClass())
            .map((instanceVariable) => instanceVariable.getType())
            .forEach((type) => {
                const namespace = this.getNamespace(type);

                usesMap.set(`${namespace}\\${type.getName()}`, `use ${namespace}\\${type.getName()};`);
            });

        currentClass.getInstanceVariables()
            .filter((instanceVariable) => {
                switch (instanceVariable.getType().getName()) {
                    case ClassHierarchyEvaluator.INSTANT_CLASS_NAME:
                    case ClassHierarchyEvaluator.ARRAY_CLASS_NAME:
                        return true;
                    default:
                        return false;
                }
            })
            .forEach(_ => usesMap.set('JMS\\Serializer\\Annotation\\Type', 'use JMS\\Serializer\\Annotation\\Type;'));

        const uses = Array.from(usesMap.values());

        return uses.join('\n');
    }

    renderClassCommentBlock(currentClass) {
        const annotationsBlock = this.renderClassAnnotationsBlock(currentClass);

        if (annotationsBlock !== '') {
            return `
/**
${annotationsBlock}
 */
`.trim();
        }

        return '';
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns {string}
     */
    renderClassAnnotationsBlock(currentClass) {
        const annotations = [];

        if (currentClass.extendsUserDefinedSuperClass()) {
            const superClass = currentClass.getSuperClass();
            const variables = superClass.getInstanceVariables()
                .filter((instanceVariable) => instanceVariable.isDiscriminator());

            if (variables.length === 0) {
                throw new Error('Cannot find the discriminator instance variable in super class.');
            }

            if (variables.length > 1) {
                throw new Error('Found more than one discriminator instance variables in super class.');
            }

            const discriminatorVariable = variables[0];

            const namespace = this.getNamespace(currentClass);

            annotations.push(`@Discriminator(field="${discriminatorVariable.getName()}", map={"${currentClass.getName()}" = "${namespace}\\${currentClass.getName()}"})`);
        }

        return annotations.map(annotation => ` * ${annotation}`).join('\n');
    }

    /**
     *
     * @param {Class} currentClass
     * @returns {string}
     */
    renderExtendsClause(currentClass) {
        let extendsClause = '';

        if (currentClass.extendsUserDefinedSuperClass()) {
            extendsClause = `extends ${currentClass.getSuperClass().getName()}`;
        }

        return extendsClause;
    }

    /**
     *
     * @param {Class} currentClass
     * @returns {string}
     */
    renderInstanceVariablesBlock(currentClass) {
        return currentClass
            .getInstanceVariables()
            .filter((instanceVariable) => !instanceVariable.isDiscriminator())
            .map((instanceVariable) => {
                const access_modifier = instanceVariable.getAccessibility();

                const attribute = instanceVariable.isReadOnly() ? 'readonly' : '';

                const type = this.renderVariableType(instanceVariable);

                const variableName = '$' + instanceVariable.getName();

                const declaration = [access_modifier, attribute, type, variableName]
                    .filter(component => component !== '')
                    .join(' ');

                const annotation = this.#renderInstanceVariableAnnotationBlock(instanceVariable);

                return `${annotation != '' ? annotation + '\n' : ''}  ${declaration};`;
            })
            .join(`\n`);
    }

    #renderInstanceVariableAnnotationBlock(instanceVariable) {
        if (instanceVariable.getType().getName() === ClassHierarchyEvaluator.INSTANT_CLASS_NAME) {
            return `
  /**
   * @Type("DateTime<'Y-m-d\\TH:i:s.uO'>")
   */
`.replace(/^\n/g, '').trimEnd();
        }

        if (instanceVariable.getType().getName() === ClassHierarchyEvaluator.ARRAY_CLASS_NAME) {
            return `
/**
 * @Type("array")
 */
`.replace(/^\n/g, '').trimEnd();
        }

        return '';
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns {string}
     */
    renderConstructorBlock(currentClass) {
        // TODO: use Constructor property promotion if target is PHP 8 or above

        let constructorParameters = [];

        if (currentClass.extendsUserDefinedSuperClass()) {
            constructorParameters = constructorParameters.concat(
                currentClass.getSuperClass()
                    .getInstanceVariables()
                    .filter((instanceVariable) => !instanceVariable.isDiscriminator())
                    .map((instanceVariable) => this.renderMethodParameter(instanceVariable))
            );
        }

        constructorParameters = constructorParameters.concat(
            currentClass
                .getInstanceVariables()
                .filter((instanceVariable) => !instanceVariable.isDiscriminator())
                .map((instanceVariable) => this.renderMethodParameter(instanceVariable))
        );

        let superClassConstruction = '';
        if (currentClass.extendsUserDefinedSuperClass()) {
            const superClassConstructorArguments = currentClass.getSuperClass()
                .getInstanceVariables()
                .filter((instanceVariable) => !instanceVariable.isDiscriminator())
                .map((instanceVariable) => '$' + instanceVariable.getName())
                .join(', ');

            superClassConstruction = `    parent::__construct(${superClassConstructorArguments});`;
        }

        const constructorAssignments = currentClass
            .getInstanceVariables()
            .filter((instanceVariable) => !instanceVariable.isDiscriminator())
            .map((instanceVariable) => `    $this->${instanceVariable.getName()} = $${instanceVariable.getName()};`)
            .join('\n');

        return '' +
            '  public function __construct(' + constructorParameters.join(', ') + ')\n' +
            '  {\n' +
            (superClassConstruction !== '' ? superClassConstruction + '\n' : '') +
            (constructorAssignments !== '' ? constructorAssignments + '\n' : '') +
            '  }';
    }

    /**
     * 
     * @param {InstanceVariable} instanceVariable 
     * @returns 
     */
    renderMethodParameter(instanceVariable) {
        const type = this.renderVariableType(instanceVariable) + instanceVariable.isOptional() ? '|null' : '';

        const variableName = '$' + instanceVariable.getName();

        return `${type} ${variableName}`;
    }

    /**
     * 
     * @param {Class} currentClass 
     * @returns {string}
     */
    renderAccessorsBlock(currentClass) {
        return currentClass
            .getInstanceVariables()
            .filter((instanceVariable) => !instanceVariable.isDiscriminator())
            .filter((instanceVariable) => instanceVariable.isPrivate())
            .map((instanceVariable) => {
                let accessorBlock = this.renderGetterBlock(instanceVariable);

                if (!instanceVariable.isReadOnly()) {
                    accessorBlock += '\n\n' + this.renderSetterBlock(instanceVariable);
                }

                return accessorBlock;
            })
            .join('\n\n');
    }

    /**
     * 
     * @param {InstanceVariable} instanceVariable 
     * @returns {string}
     */
    renderGetterBlock(instanceVariable) {
        const type = this.renderVariableType(instanceVariable);

        const verb = type === "bool" ? "is" : "get";

        return '' +
            `  public function ${verb}${instanceVariable.getName().charAt(0).toUpperCase() + instanceVariable.getName().slice(1)}(): ${type}` + '\n' +
            '  {\n' +
            `    return $this->${instanceVariable.getName()};` + '\n' +
            '  }';
    }

    /**
     * 
     * @param {InstanceVariable} instanceVariable 
     * @returns {string}
     */
    renderSetterBlock(instanceVariable) {
        const type = this.renderVariableType(instanceVariable);

        const variableName = '$' + instanceVariable.getName();

        return '' +
            `  public function set${instanceVariable.getName().charAt(0).toUpperCase() + instanceVariable.getName().slice(1)}(${type} ${variableName}): void` + '\n' +
            '  {\n' +
            `    $this->${instanceVariable.getName()} = ${variableName};` + '\n' +
            '  }';
    }

    /**
     * 
     * @param {Variable} variable 
     * @returns 
     */
    renderVariableType(variable) {
        if (variable.getType().isBuiltInClass()) {
            return this.#builtInTypeMappings.get(variable.getType().getName());
        }

        return variable.getType().getName();
    }
}