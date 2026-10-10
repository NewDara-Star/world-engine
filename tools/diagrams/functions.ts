// Finds every function in a source file and gives it the name used as its
// heading in docs/flows/ and docs/designs/. Reference: TypeScript compiler API
// (`ts.forEachChild`, `ts.isFunctionDeclaration` and friends, from the
// `typescript` package, Apache-2.0). Our own naming rules, written in
// docs/designs/tools/diagrams/functions.md.
import ts from "typescript";

export type FunctionNode =
  | ts.FunctionDeclaration
  | ts.FunctionExpression
  | ts.ArrowFunction
  | ts.MethodDeclaration
  | ts.ConstructorDeclaration
  | ts.GetAccessorDeclaration
  | ts.SetAccessorDeclaration;

export interface FunctionEntry {
  name: string;
  node: FunctionNode;
  body: ts.ConciseBody;
}

const SEPARATOR = " > ";

export function isFunctionNode(node: ts.Node): node is FunctionNode {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  );
}

function propertyText(name: ts.PropertyName): string {
  return name.getText();
}

function ownerName(parent: ts.Node): string | undefined {
  if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) return parent.name.text;
  if (ts.isPropertyAssignment(parent) || ts.isPropertyDeclaration(parent)) return propertyText(parent.name);
  return undefined;
}

function classPrefix(node: ts.Node): string {
  const owner = node.parent;
  if ((ts.isClassDeclaration(owner) || ts.isClassExpression(owner)) && owner.name !== undefined) {
    return `${owner.name.text}.`;
  }
  return "";
}

function memberName(node: ts.MethodDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration): string {
  return `${classPrefix(node)}${propertyText(node.name)}`;
}

function expressionName(node: ts.FunctionExpression | ts.ArrowFunction): string | undefined {
  return node.name?.text ?? ownerName(node.parent);
}

// The name the code itself gives the function, if it gives one.
export function declaredName(node: FunctionNode): string | undefined {
  if (ts.isConstructorDeclaration(node)) return `${classPrefix(node)}constructor`;
  if (ts.isFunctionDeclaration(node)) return node.name?.text ?? "default";
  if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) return expressionName(node);
  return memberName(node);
}

function anyInside(node: ts.Node, test: (candidate: ts.Node) => boolean): boolean {
  if (test(node)) return true;
  const found = ts.forEachChild(node, (child) => (!isFunctionNode(child) && anyInside(child, test) ? true : undefined));
  return found === true;
}

// A decision in this code: an if, a loop, a switch, a ternary, or a `&&` `||`
// `??` guard. Functions inside are not looked into; they have their own picture.
export function containsDecision(node: ts.Node): boolean {
  return anyInside(node, isDecision);
}

const GUARDS = new Set([ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken]);

export function isGuard(node: ts.Node): node is ts.BinaryExpression {
  return ts.isBinaryExpression(node) && GUARDS.has(node.operatorToken.kind);
}

function isDecision(node: ts.Node): boolean {
  return (
    ts.isIfStatement(node) ||
    ts.isConditionalExpression(node) ||
    ts.isSwitchStatement(node) ||
    ts.isIterationStatement(node, false) ||
    ts.isTryStatement(node) ||
    isGuard(node)
  );
}

// A named function always gets its own picture. A nameless one (a callback)
// gets one when it has a block of statements or any decision; a one-line
// callback with no decision is drawn as part of the function around it.
export function hasOwnFlow(node: FunctionNode): boolean {
  if (node.body === undefined) return false;
  if (declaredName(node) !== undefined) return true;
  return ts.isBlock(node.body) || containsDecision(node.body);
}

interface Walk {
  entries: FunctionEntry[];
  used: Map<string, number>;
  anonymous: Map<string, number>;
}

function uniqueName(walk: Walk, wanted: string): string {
  const seen = (walk.used.get(wanted) ?? 0) + 1;
  walk.used.set(wanted, seen);
  return seen === 1 ? wanted : `${wanted} (${seen})`;
}

function entryName(walk: Walk, node: FunctionNode, parentName: string): string {
  const declared = declaredName(node);
  if (declared !== undefined) return uniqueName(walk, parentName === "" ? declared : `${parentName}${SEPARATOR}${declared}`);
  const count = (walk.anonymous.get(parentName) ?? 0) + 1;
  walk.anonymous.set(parentName, count);
  const base = parentName === "" ? "module" : parentName;
  return uniqueName(walk, `${base}${SEPARATOR}inner function ${count}`);
}

function visit(walk: Walk, node: ts.Node, parentName: string): void {
  if (isFunctionNode(node) && hasOwnFlow(node) && node.body !== undefined) {
    const name = entryName(walk, node, parentName);
    walk.entries.push({ name, node, body: node.body });
    ts.forEachChild(node, (child) => visit(walk, child, name));
    return;
  }
  ts.forEachChild(node, (child) => visit(walk, child, parentName));
}

export function listFunctions(file: ts.SourceFile): FunctionEntry[] {
  const walk: Walk = { entries: [], used: new Map(), anonymous: new Map() };
  visit(walk, file, "");
  return walk.entries;
}
