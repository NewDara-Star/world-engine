// Draws the decisions hidden inside an expression: `a && b`, `a || b`, `a ?? b`
// and `c ? x : y`, and the conditions of ifs and loops. Reference: short-circuit
// lowering as taught in compiler texts (test the left side; only on the right
// outcome go on to test the right side). Our own design, written in
// docs/designs/tools/diagrams/expressions.md; no third-party code.
import ts from "typescript";
import { type Context, callsNote, codeText } from "./context.js";
import { type Open, addNode, link } from "./flow-model.js";
import { containsDecision, isFunctionNode, isGuard } from "./functions.js";

export interface Outcomes {
  yes: Open;
  no: Open;
}

const NO_LABEL = "";

export function step(id: string, label: string = NO_LABEL): Open {
  return [{ from: id, label }];
}

// A box for a piece of code, with an arrow from every open end.
export function drawBox(ctx: Context, open: Open, node: ts.Node, prefix: string = ""): Open {
  const id = addNode(ctx.flow, "box", `${prefix}${codeText(ctx, node)}${callsNote(ctx, node)}`);
  link(ctx.flow, open, id);
  return step(id);
}

function unwrap(node: ts.Expression): ts.Expression {
  return ts.isParenthesizedExpression(node) ? unwrap(node.expression) : node;
}

// `a && b`, `a || b`: the right side is only reached on one outcome of the left.
function splitGuard(ctx: Context, guard: ts.BinaryExpression, open: Open): Outcomes {
  const left = lowerCondition(ctx, guard.left, open);
  if (guard.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    const right = lowerCondition(ctx, guard.right, left.yes);
    return { yes: right.yes, no: [...left.no, ...right.no] };
  }
  const right = lowerCondition(ctx, guard.right, left.no);
  return { yes: [...left.yes, ...right.yes], no: right.no };
}

function isAndOr(node: ts.Expression): node is ts.BinaryExpression {
  return (
    ts.isBinaryExpression(node) &&
    (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken || node.operatorToken.kind === ts.SyntaxKind.BarBarToken)
  );
}

// One yes/no question: a diamond whose text is the condition as written.
export function lowerCondition(ctx: Context, condition: ts.Expression, open: Open): Outcomes {
  const inner = unwrap(condition);
  if (isAndOr(inner)) return splitGuard(ctx, inner, open);
  const ready = drawInnerDecisions(ctx, inner, open);
  const id = addNode(ctx.flow, "decision", `${codeText(ctx, inner)}${callsNote(ctx, inner)}`);
  link(ctx.flow, ready, id);
  return { yes: step(id, "yes"), no: step(id, "no") };
}

function drawBranch(ctx: Context, branch: ts.Expression, open: Open): Open {
  return containsDecision(branch) ? drawInnerDecisions(ctx, branch, open) : drawBox(ctx, open, branch);
}

function drawTernary(ctx: Context, ternary: ts.ConditionalExpression, open: Open): Open {
  const outcome = lowerCondition(ctx, ternary.condition, open);
  return [...drawBranch(ctx, ternary.whenTrue, outcome.yes), ...drawBranch(ctx, ternary.whenFalse, outcome.no)];
}

// `a ?? b`: asks whether `a` is missing; only then does `b` run.
function drawMissingCheck(ctx: Context, guard: ts.BinaryExpression, open: Open): Open {
  const ready = drawInnerDecisions(ctx, guard.left, open);
  const id = addNode(ctx.flow, "decision", `${codeText(ctx, guard.left)} is missing?${callsNote(ctx, guard.left)}`);
  link(ctx.flow, ready, id);
  return [...step(id, "no"), ...drawBranch(ctx, guard.right, step(id, "yes"))];
}

function drawAndOr(ctx: Context, guard: ts.BinaryExpression, open: Open): Open {
  const left = lowerCondition(ctx, guard.left, open);
  const isAnd = guard.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken;
  const skipped = isAnd ? left.no : left.yes;
  return [...skipped, ...drawBranch(ctx, guard.right, isAnd ? left.yes : left.no)];
}

function drawGuard(ctx: Context, guard: ts.BinaryExpression, open: Open): Open {
  return guard.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
    ? drawMissingCheck(ctx, guard, open)
    : drawAndOr(ctx, guard, open);
}

// Every decision inside this expression, in the order the code runs them.
// Returns the open ends after the last one; draws nothing if there is none.
export function drawInnerDecisions(ctx: Context, node: ts.Node, open: Open): Open {
  if (isFunctionNode(node) || !containsDecision(node)) return open;
  if (ts.isParenthesizedExpression(node)) return drawInnerDecisions(ctx, node.expression, open);
  if (ts.isConditionalExpression(node)) return drawTernary(ctx, node, open);
  if (isGuard(node)) return drawGuard(ctx, node, open);
  let current = open;
  ts.forEachChild(node, (child) => {
    current = drawInnerDecisions(ctx, child, current);
  });
  return current;
}
