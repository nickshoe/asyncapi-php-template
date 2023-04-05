import { ClassHierarchyEvaluator } from "../../../src/class-hierarchy-evaluator/class-hierrachy-evaluator";
import { PhpEvaluator } from "../../../src/php-evaluator/php-evaluator";

export default function ({ asyncapi, params, originalAsyncAPI }) {
  const classHierarchyEvaluator = new ClassHierarchyEvaluator(asyncapi);

  const classHierarchy = classHierarchyEvaluator.evaluate();

  const phpEvaluator = new PhpEvaluator(classHierarchy);

  return phpEvaluator.evaluate();
}
