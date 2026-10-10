// Draws a function's statements as boxes and arrows: each if, switch, loop,
// early return, throw, break, continue and try becomes its own shape. Reference:
// TypeScript compiler API statement kinds (`ts.SyntaxKind`, the `typescript`
// package, Apache-2.0); control-flow shapes are the textbook ones (a diamond
// per yes/no question, a loop arrow back to its test). Our own design, written
// in docs/designs/tools/diagrams/statements.md. Known simplification: a
// `finally` is drawn after the normal paths only, not after a return or throw
// inside the `try`.
import ts from "typescript";
import { type Context, type Target, callsNote, codeText } from "./context.js";
import { type Open, addNode, link } from "./flow-model.js";
import { drawBox, drawInnerDecisions, lowerCondition, step } from "./expressions.js";

type Handler = (ctx: Context, node: ts.Node, open: Open) => Open;

function typed<T extends ts.Node>(handler: (ctx: Context, node: T, open: Open) => Open): Handler {
  return (ctx, node, open) => handler(ctx, node as T, open);
}

export function drawStatements(ctx: Context, statements: readonly ts.Statement[], open: Open): Open {
  let current = open;
  for (const statement of statements) current = drawStatement(ctx, statement, current);
  return current;
}

export function drawStatement(ctx: Context, node: ts.Statement, open: Open): Open {
  const handler = HANDLERS.get(node.kind) ?? drawSimple;
  return handler(ctx, node, open);
}

// Anything with no branch of its own: decisions inside it first, then one box.
function drawSimple(ctx: Context, node: ts.Node, open: Open): Open {
  const ready = drawInnerDecisions(ctx, node, open);
  return drawBox(ctx, ready, node);
}

function drawNothing(_ctx: Context, _node: ts.Node, open: Open): Open {
  return open;
}

function drawBlock(ctx: Context, block: ts.Block, open: Open): Open {
  return drawStatements(ctx, block.statements, open);
}

function drawIf(ctx: Context, node: ts.IfStatement, open: Open): Open {
  const outcome = lowerCondition(ctx, node.expression, open);
  const thenOut = drawStatement(ctx, node.thenStatement, outcome.yes);
  const elseOut = node.elseStatement === undefined ? outcome.no : drawStatement(ctx, node.elseStatement, outcome.no);
  return [...thenOut, ...elseOut];
}

function drawExit(ctx: Context, node: ts.ReturnStatement | ts.ThrowStatement, open: Open): Open {
  const ready = node.expression === undefined ? open : drawInnerDecisions(ctx, node.expression, open);
  const shape = ts.isReturnStatement(node) ? "return" : "throw";
  const id = addNode(ctx.flow, shape, `${codeText(ctx, node)}${callsNote(ctx, node)}`);
  link(ctx.flow, ready, id);
  return [];
}

// ---- loops and switches: places a `break` or `continue` can jump to ----

function openTarget(ctx: Context, isLoop: boolean): Target {
  const target: Target = { labels: ctx.pendingLabels, isLoop, breaks: [], continues: [] };
  ctx.pendingLabels = [];
  ctx.targets.push(target);
  return target;
}

function findTarget(ctx: Context, label: ts.Identifier | undefined, needsLoop: boolean): Target | undefined {
  const matching = ctx.targets.filter((target) => (label === undefined ? !needsLoop || target.isLoop : target.labels.includes(label.text)));
  return matching.at(-1);
}

function drawJump(ctx: Context, node: ts.BreakOrContinueStatement, open: Open): Open {
  const keyword = ts.isBreakStatement(node) ? "break" : "continue";
  const id = addNode(ctx.flow, "box", node.label === undefined ? keyword : `${keyword} ${node.label.text}`);
  link(ctx.flow, open, id);
  const target = findTarget(ctx, node.label, ts.isContinueStatement(node));
  (ts.isBreakStatement(node) ? target?.breaks : target?.continues)?.push(...step(id));
  return [];
}

function drawLabeled(ctx: Context, node: ts.LabeledStatement, open: Open): Open {
  ctx.pendingLabels.push(node.label.text);
  const out = drawStatement(ctx, node.statement, open);
  ctx.pendingLabels = [];
  return out;
}

// Draws the loop body, then sends every end of it (and every `continue`) back to `head`.
function drawLoopBody(ctx: Context, body: ts.Statement, enter: Open, head: () => string | undefined): Open {
  const target = openTarget(ctx, true);
  const bodyOut = drawStatement(ctx, body, enter);
  ctx.targets.pop();
  const again = head();
  if (again !== undefined) link(ctx.flow, [...bodyOut, ...target.continues], again);
  return target.breaks;
}

function firstNodeSince(ctx: Context, mark: number): string | undefined {
  return ctx.flow.nodes[mark]?.id;
}

function drawWhile(ctx: Context, node: ts.WhileStatement, open: Open): Open {
  const mark = ctx.flow.nodes.length;
  const outcome = lowerCondition(ctx, node.expression, open);
  const exits = drawLoopBody(ctx, node.statement, outcome.yes, () => firstNodeSince(ctx, mark));
  return [...outcome.no, ...exits];
}

function drawDoWhile(ctx: Context, node: ts.DoStatement, open: Open): Open {
  const mark = ctx.flow.nodes.length;
  const target = openTarget(ctx, true);
  const bodyOut = drawStatement(ctx, node.statement, open);
  ctx.targets.pop();
  const outcome = lowerCondition(ctx, node.expression, [...bodyOut, ...target.continues]);
  const start = firstNodeSince(ctx, mark);
  if (start !== undefined) link(ctx.flow, outcome.yes, start);
  return [...outcome.no, ...target.breaks];
}

function drawForEach(ctx: Context, node: ts.ForOfStatement | ts.ForInStatement, open: Open): Open {
  const word = ts.isForOfStatement(node) ? "of" : "in";
  const head = addNode(ctx.flow, "decision", `for each ${node.initializer.getText(ctx.file)} ${word} ${codeText(ctx, node.expression)}${callsNote(ctx, node.expression)}`);
  link(ctx.flow, open, head);
  const exits = drawLoopBody(ctx, node.statement, step(head, "next item"), () => head);
  return [...step(head, "done"), ...exits];
}

function drawForInit(ctx: Context, node: ts.ForStatement, open: Open): Open {
  return node.initializer === undefined ? open : drawBox(ctx, drawInnerDecisions(ctx, node.initializer, open), node.initializer);
}

function drawFor(ctx: Context, node: ts.ForStatement, open: Open): Open {
  const afterInit = drawForInit(ctx, node, open);
  const mark = ctx.flow.nodes.length;
  const test = node.condition === undefined ? { yes: afterInit, no: [] as Open } : lowerCondition(ctx, node.condition, afterInit);
  const target = openTarget(ctx, true);
  const bodyOut = drawStatement(ctx, node.statement, test.yes);
  ctx.targets.pop();
  const afterBody = node.incrementor === undefined ? [...bodyOut, ...target.continues] : drawBox(ctx, [...bodyOut, ...target.continues], node.incrementor);
  const start = firstNodeSince(ctx, mark);
  if (start !== undefined) link(ctx.flow, afterBody, start);
  return [...test.no, ...target.breaks];
}

function caseLabel(ctx: Context, clause: ts.CaseOrDefaultClause): string {
  return ts.isCaseClause(clause) ? `case ${codeText(ctx, clause.expression)}` : "default";
}

function drawSwitch(ctx: Context, node: ts.SwitchStatement, open: Open): Open {
  const ready = drawInnerDecisions(ctx, node.expression, open);
  const head = addNode(ctx.flow, "decision", `switch ${codeText(ctx, node.expression)}${callsNote(ctx, node.expression)}`);
  link(ctx.flow, ready, head);
  const target = openTarget(ctx, false);
  let carry: Open = [];
  for (const clause of node.caseBlock.clauses) {
    carry = drawStatements(ctx, clause.statements, [...step(head, caseLabel(ctx, clause)), ...carry]);
  }
  ctx.targets.pop();
  const hasDefault = node.caseBlock.clauses.some(ts.isDefaultClause);
  return [...carry, ...target.breaks, ...(hasDefault ? [] : step(head, "no case matches"))];
}

function drawTry(ctx: Context, node: ts.TryStatement, open: Open): Open {
  const start = addNode(ctx.flow, "box", "try");
  link(ctx.flow, open, start);
  const tryOut = drawBlock(ctx, node.tryBlock, step(start));
  const catchOut = node.catchClause === undefined ? [] : drawCatch(ctx, node.catchClause, step(start, "throws"));
  const joined = [...tryOut, ...catchOut];
  return node.finallyBlock === undefined ? joined : drawBlock(ctx, node.finallyBlock, joined);
}

function drawCatch(ctx: Context, clause: ts.CatchClause, open: Open): Open {
  const variable = clause.variableDeclaration === undefined ? "" : ` (${clause.variableDeclaration.name.getText(ctx.file)})`;
  const id = addNode(ctx.flow, "box", `catch${variable}`);
  link(ctx.flow, open, id);
  return drawBlock(ctx, clause.block, step(id));
}

const HANDLERS = new Map<ts.SyntaxKind, Handler>([
  [ts.SyntaxKind.Block, typed(drawBlock)],
  [ts.SyntaxKind.IfStatement, typed(drawIf)],
  [ts.SyntaxKind.ReturnStatement, typed(drawExit)],
  [ts.SyntaxKind.ThrowStatement, typed(drawExit)],
  [ts.SyntaxKind.BreakStatement, typed(drawJump)],
  [ts.SyntaxKind.ContinueStatement, typed(drawJump)],
  [ts.SyntaxKind.LabeledStatement, typed(drawLabeled)],
  [ts.SyntaxKind.WhileStatement, typed(drawWhile)],
  [ts.SyntaxKind.DoStatement, typed(drawDoWhile)],
  [ts.SyntaxKind.ForStatement, typed(drawFor)],
  [ts.SyntaxKind.ForOfStatement, typed(drawForEach)],
  [ts.SyntaxKind.ForInStatement, typed(drawForEach)],
  [ts.SyntaxKind.SwitchStatement, typed(drawSwitch)],
  [ts.SyntaxKind.TryStatement, typed(drawTry)],
  [ts.SyntaxKind.EmptyStatement, drawNothing],
  [ts.SyntaxKind.FunctionDeclaration, drawNothing],
  [ts.SyntaxKind.ClassDeclaration, drawNothing],
  [ts.SyntaxKind.InterfaceDeclaration, drawNothing],
  [ts.SyntaxKind.TypeAliasDeclaration, drawNothing],
]);
