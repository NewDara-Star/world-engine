// What the flow builders share while drawing one function: the picture so far,
// the compiler's type checker (to tell our functions from other people's), and
// the loops and switches we are inside (so `break` and `continue` find their
// target). Reference: TypeScript compiler API (`TypeChecker.getSymbolAtLocation`,
// `getAliasedSymbol`), the `typescript` package, Apache-2.0.
import ts from "typescript";
import { type Flow, type Open, shorten } from "./flow-model.js";
import { hasOwnFlow, isFunctionNode } from "./functions.js";

export interface Target {
  labels: string[];
  isLoop: boolean;
  breaks: Open[number][];
  continues: Open[number][];
}

export interface Context {
  flow: Flow;
  file: ts.SourceFile;
  checker: ts.TypeChecker;
  ourFiles: ReadonlySet<string>;
  targets: Target[];
  pendingLabels: string[];
}

export function codeText(ctx: Context, node: ts.Node): string {
  return shorten(node.getText(ctx.file));
}

function declaredInOurFiles(ctx: Context, symbol: ts.Symbol): boolean {
  const resolved = symbol.flags & ts.SymbolFlags.Alias ? ctx.checker.getAliasedSymbol(symbol) : symbol;
  return (resolved.declarations ?? []).some((declaration) => ctx.ourFiles.has(declaration.getSourceFile().fileName));
}

function calleeSymbol(ctx: Context, call: ts.CallExpression | ts.NewExpression): ts.Symbol | undefined {
  const callee = ts.isPropertyAccessExpression(call.expression) ? call.expression.name : call.expression;
  return ctx.checker.getSymbolAtLocation(callee);
}

function collectCalls(ctx: Context, node: ts.Node, found: string[]): void {
  if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
    const symbol = calleeSymbol(ctx, node);
    if (symbol !== undefined && declaredInOurFiles(ctx, symbol)) found.push(symbol.name);
  }
  ts.forEachChild(node, (child) => (isFunctionNode(child) && hasOwnFlow(child) ? undefined : collectCalls(ctx, child, found)));
}

// "calls a, b": our own functions that this piece of code calls, in order.
export function callsNote(ctx: Context, node: ts.Node): string {
  const found: string[] = [];
  collectCalls(ctx, node, found);
  const names = [...new Set(found)];
  return names.length === 0 ? "" : `\ncalls ${names.join(", ")}`;
}
