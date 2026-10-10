// The picture of one function as data: boxes, and arrows between them, plus
// the Mermaid text for it. Reference: the Mermaid "flowchart" text format
// (node shapes with quoted labels, labelled edges, `#35;`-style entity codes).
// The Mermaid docs page could not be opened (research/32-code-to-diagram.md),
// so the format is the one we know, checked only by our own tests and by how
// GitHub draws it. Our own design; no third-party code.

export type Shape = "start" | "box" | "decision" | "call" | "return" | "throw";

export interface FlowNode {
  id: string;
  shape: Shape;
  text: string;
}

export interface FlowEdge {
  from: string;
  to: string;
  label: string;
}

export interface Flow {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

// Arrows that leave the picture so far and are waiting for the next box.
// The label ("yes", "no", "case 3") is carried until the arrow gets a target.
export type Open = readonly { from: string; label: string }[];

const MAX_TEXT = 60;

export function newFlow(): Flow {
  return { nodes: [], edges: [] };
}

export function addNode(flow: Flow, shape: Shape, text: string): string {
  const id = `n${flow.nodes.length + 1}`;
  flow.nodes.push({ id, shape, text });
  return id;
}

// Draws an arrow from every open end to the box, skipping an arrow already drawn.
export function link(flow: Flow, open: Open, to: string): void {
  for (const end of open) {
    const known = flow.edges.some((edge) => edge.from === end.from && edge.to === to && edge.label === end.label);
    if (!known) flow.edges.push({ from: end.from, to, label: end.label });
  }
}

// Code text on one line, cut short so a box stays readable.
export function shorten(text: string): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > MAX_TEXT ? `${oneLine.slice(0, MAX_TEXT - 1)}…` : oneLine;
}

// Characters Mermaid would read as syntax become entity codes. `#` goes first
// so the codes we add are not escaped again.
function escapeLabel(text: string): string {
  return text
    .replaceAll("#", "#35;")
    .replaceAll('"', "#quot;")
    .replaceAll("<", "#lt;")
    .replaceAll(">", "#gt;")
    .replaceAll("`", "#96;")
    .replaceAll("\n", "<br/>");
}

const BRACKETS: Record<Shape, readonly [string, string]> = {
  start: ["([", "])"],
  return: ["([", "])"],
  throw: ["{{", "}}"],
  decision: ["{", "}"],
  call: ["[[", "]]"],
  box: ["[", "]"],
};

function renderNode(node: FlowNode): string {
  const [open, close] = BRACKETS[node.shape];
  return `  ${node.id}${open}"${escapeLabel(node.text)}"${close}`;
}

function renderEdge(edge: FlowEdge): string {
  const arrow = edge.label === "" ? "-->" : `-->|"${escapeLabel(edge.label)}"|`;
  return `  ${edge.from} ${arrow} ${edge.to}`;
}

export function renderMermaid(flow: Flow): string {
  return ["flowchart TD", ...flow.nodes.map(renderNode), ...flow.edges.map(renderEdge)].join("\n");
}
