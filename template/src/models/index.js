import { ClassHierarchyEvaluator } from "../../../src/class-hierarchy-evaluator/class-hierrachy-evaluator";
import { PhpModelEvaluator } from "../../../src/php-model-evaluator/php-model-evaluator";

export default function ({ asyncapi, params, originalAsyncAPI }) {
  const modelsNamespace = params.modelsNamespace;

  const classHierarchyEvaluator = new ClassHierarchyEvaluator(asyncapi, modelsNamespace);

  const classHierarchy = classHierarchyEvaluator.evaluate();

  const phpEvaluator = new PhpModelEvaluator(classHierarchy);

  return phpEvaluator.evaluate();
}
