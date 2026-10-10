// One function in, one picture out: a start box, the statements drawn by
// statements.ts, and an "end" box for every way the code can fall off the
// bottom. Reference: TypeScript compiler API (`ts.isBlock`); our own design,
// written in docs/designs/tools/diagrams/flow.md.
import ts from "typescript";
import { type Context } from "./context.js";
import { drawInnerDecisions, step } from "./expressions.js";
import { type Flow, type Open, addNode, link, newFlow } from "./flow-model.js";
import { type FunctionEntry } from "./functions.js";
import { drawStatements } from "./statements.js";

export interface Project {
  checker: ts.TypeChecker;
  ourFiles: ReadonlySet<string>;
}

// A one-line function `x => a ? b : c` returns its expression.
function drawConciseBody(ctx: Context, body: ts.Expression, open: Open): Open {
  const ready = drawInnerDecisions(ctx, body, open);
  const id = addNode(ctx.flow, "return", `return ${body.getText(ctx.file).replace(/\s+/g, " ").slice(0, 59)}`);
  link(ctx.flow, ready, id);
  return [];
}

function drawBody(ctx: Context, body: ts.ConciseBody, open: Open): Open {
  return ts.isBlock(body) ? drawStatements(ctx, body.statements, open) : drawConciseBody(ctx, body, open);
}

export function buildFlow(project: Project, file: ts.SourceFile, entry: FunctionEntry): Flow {
  const ctx: Context = { flow: newFlow(), file, checker: project.checker, ourFiles: project.ourFiles, targets: [], pendingLabels: [] };
  const start = addNode(ctx.flow, "start", entry.name);
  const leftOver = drawBody(ctx, entry.body, step(start));
  if (leftOver.length > 0) link(ctx.flow, leftOver, addNode(ctx.flow, "return", "end"));
  return ctx.flow;
}

