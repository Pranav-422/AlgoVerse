import { ask, type Ask, type GraphFrame, type Mark, type Program, type Tag } from "./types";

export type GraphOp = "bfs" | "dfs" | "addVertex" | "addEdge" | "hasEdge" | "removeEdge" | "shortestPath";

export const GRAPH_PARAMS: Record<GraphOp, ("from" | "to")[]> = {
  bfs: ["from"],
  dfs: ["from"],
  addVertex: [],
  addEdge: ["from", "to"],
  hasEdge: ["from", "to"],
  removeEdge: ["from", "to"],
  shortestPath: ["from", "to"],
};

// Fixed connected undirected sample graph with 6 vertices (0-5) and 8 edges.
const SAMPLE_VERTICES = [0, 1, 2, 3, 4, 5];
const SAMPLE_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 3],
  [2, 4],
  [3, 4],
  [3, 5],
  [4, 5],
];

function getAdj(vertices: number[], edges: [number, number][]): Map<number, number[]> {
  const adj = new Map<number, number[]>();
  for (const v of vertices) adj.set(v, []);
  for (const [u, v] of edges) {
    if (adj.has(u) && adj.has(v)) {
      adj.get(u)!.push(v);
      adj.get(v)!.push(u);
    }
  }
  for (const list of adj.values()) {
    list.sort((a, b) => a - b);
  }
  return adj;
}

class GraphRecorder {
  frames: GraphFrame[] = [];
  vertices: number[];
  edges: [number, number][];
  frontier: number[] = [];
  output: number[] = [];
  private pending?: Ask;

  constructor(vertices: number[], edges: [number, number][]) {
    this.vertices = [...vertices];
    this.edges = edges.map(([u, v]) => [u, v]);
  }

  askNext(a: Ask | undefined) {
    this.pending = a;
  }

  snap(note: string, lines: number[], marks: Record<string, Mark> = {}, tags: Tag[] = []) {
    this.frames.push({
      vertices: [...this.vertices],
      edges: this.edges.map(([u, v]) => [u, v]),
      marks,
      frontier: [...this.frontier],
      output: [...this.output],
      tags,
      note,
      lines,
      ...(this.pending && { ask: this.pending }),
    });
    this.pending = undefined;
  }
}

function bfs(r: GraphRecorder, start: number): string[] {
  const code = [
    "queue = [start], visited = {start}",
    "while queue is not empty:",
    "  curr = queue.dequeue()",
    "  visit(curr)",
    "  for each unvisited neighbour n of curr:",
    "    visited.add(n)",
    "    queue.enqueue(n)",
  ];

  const adj = getAdj(r.vertices, r.edges);
  const startNode = r.vertices.includes(start) ? start : r.vertices[0] ?? 0;

  r.frontier = [startNode];
  const visited = new Set<number>([startNode]);
  const marks: Record<string, Mark> = { [String(startNode)]: "focus" };

  r.snap(`Initialize BFS queue with start vertex ${startNode}. Mark ${startNode} visited.`, [1], { ...marks }, [
    { name: "start", at: startNode },
  ]);

  let asked = false;

  while (r.frontier.length > 0) {
    if (!asked && r.frontier.length > 1) {
      const nextV = r.frontier[0];
      const otherV = r.frontier[1];
      r.askNext(ask("Which vertex is dequeued next from the front of the queue?", nextV, [otherV]));
      asked = true;
    }

    const curr = r.frontier.shift()!;
    r.output.push(curr);
    marks[String(curr)] = "found";

    r.snap(`Dequeue vertex ${curr} and visit it.`, [3, 4], { ...marks }, [{ name: "curr", at: curr }]);

    const neighbors = adj.get(curr) ?? [];
    for (const n of neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        r.frontier.push(n);
        marks[String(n)] = "compare";
        r.snap(`Discover unvisited neighbour ${n} of ${curr}. Enqueue ${n}.`, [5, 6, 7], { ...marks });
      }
    }

    marks[String(curr)] = "done";
  }

  r.snap(`BFS traversal complete. Visited order: [${r.output.join(", ")}].`, [2], { ...marks });
  return code;
}

function dfs(r: GraphRecorder, start: number): string[] {
  const code = [
    "visited = set(), stack = [start]",
    "function dfs(v):",
    "  visit(v), visited.add(v)",
    "  for each unvisited neighbour n of v:",
    "    dfs(n)",
    "dfs(start)",
  ];

  const adj = getAdj(r.vertices, r.edges);
  const startNode = r.vertices.includes(start) ? start : r.vertices[0] ?? 0;

  const visited = new Set<number>();
  const marks: Record<string, Mark> = { [String(startNode)]: "focus" };
  r.frontier = [startNode];

  r.snap(`Start DFS at vertex ${startNode}.`, [1, 6], { ...marks }, [{ name: "start", at: startNode }]);

  let asked = false;

  function explore(v: number) {
    visited.add(v);
    r.output.push(v);
    marks[String(v)] = "found";

    r.snap(`Visit vertex ${v} and mark it visited.`, [2, 3], { ...marks }, [{ name: "curr", at: v }]);

    const neighbors = adj.get(v) ?? [];
    const unvisited = neighbors.filter((n) => !visited.has(n));

    if (!asked && unvisited.length > 1) {
      r.askNext(ask(`Which unvisited neighbour of vertex ${v} does DFS visit first?`, unvisited[0], [unvisited[1]]));
      asked = true;
    }

    for (const n of neighbors) {
      if (!visited.has(n)) {
        r.frontier.push(n);
        marks[String(n)] = "compare";
        r.snap(`Vertex ${v} branches to unvisited neighbour ${n}.`, [4, 5], { ...marks });
        explore(n);
        r.frontier.pop();
        marks[String(v)] = "focus";
        r.snap(`Backtrack to vertex ${v}.`, [5], { ...marks }, [{ name: "curr", at: v }]);
      }
    }

    marks[String(v)] = "done";
  }

  explore(startNode);
  r.frontier = [];
  r.snap(`DFS traversal complete. Visited order: [${r.output.join(", ")}].`, [1], { ...marks });
  return code;
}

function shortestPath(r: GraphRecorder, from: number, to: number): string[] {
  const code = [
    "queue = [from], visited = {from}, parent = {}",
    "while queue is not empty:",
    "  curr = queue.dequeue()",
    "  if curr == to: return reconstructPath(parent, to)",
    "  for each unvisited neighbour n of curr:",
    "    visited.add(n), parent[n] = curr, queue.enqueue(n)",
    "return no path",
  ];

  const adj = getAdj(r.vertices, r.edges);
  const src = r.vertices.includes(from) ? from : 0;
  const dst = r.vertices.includes(to) ? to : 4;

  r.frontier = [src];
  const visited = new Set<number>([src]);
  const parent = new Map<number, number>();
  const marks: Record<string, Mark> = { [String(src)]: "focus", [String(dst)]: "compare" };

  r.snap(`Initialize BFS to find shortest path from ${src} to ${dst}.`, [1], { ...marks }, [
    { name: "src", at: src },
    { name: "dst", at: dst },
  ]);

  let asked = false;
  let found = false;

  while (r.frontier.length > 0) {
    if (!asked && r.frontier.length > 1) {
      const nextV = r.frontier[0];
      const otherV = r.frontier[1];
      r.askNext(ask("Which vertex does BFS explore next from the queue?", nextV, [otherV]));
      asked = true;
    }

    const curr = r.frontier.shift()!;
    marks[String(curr)] = "focus";

    if (curr === dst) {
      found = true;
      const path: number[] = [];
      let step: number | undefined = dst;
      while (step !== undefined) {
        path.unshift(step);
        marks[String(step)] = "found";
        step = parent.get(step);
      }
      r.output = path;
      r.snap(`Target ${dst} reached! Reconstructed shortest path: ${path.join(" → ")}.`, [4], { ...marks });
      break;
    }

    r.snap(`Explore neighbours of vertex ${curr}.`, [3], { ...marks }, [{ name: "curr", at: curr }]);

    const neighbors = adj.get(curr) ?? [];
    for (const n of neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        parent.set(n, curr);
        r.frontier.push(n);
        if (n !== dst) marks[String(n)] = "compare";
        r.snap(`Queue neighbour ${n} with parent ${curr}.`, [5, 6], { ...marks });
      }
    }

    if (curr !== dst && !marks[String(curr)]) marks[String(curr)] = "done";
  }

  if (!found) {
    r.snap(`No path found from ${src} to ${dst}.`, [7]);
  }

  return code;
}

function addVertex(r: GraphRecorder): string[] {
  const code = [
    "newVertex = nextAvailableId()",
    "vertices.append(newVertex)",
    "adj[newVertex] = []",
  ];

  r.snap(`Graph currently contains ${r.vertices.length} vertices: [${r.vertices.join(", ")}].`, [1]);

  const nextId = r.vertices.length > 0 ? Math.max(...r.vertices) + 1 : 0;
  r.vertices.push(nextId);

  r.snap(`Added vertex ${nextId} with an empty adjacency list.`, [2, 3], { [String(nextId)]: "fresh" }, [
    { name: "new", at: nextId },
  ]);

  return code;
}

function addEdge(r: GraphRecorder, from: number, to: number): string[] {
  const code = [
    "if edge(u, v) exists: return",
    "adj[u].append(v)",
    "adj[v].append(u)",
  ];

  const u = r.vertices.includes(from) ? from : 0;
  const v = r.vertices.includes(to) ? to : 4;
  const edgePair: [number, number] = [Math.min(u, v), Math.max(u, v)];

  r.snap(`Check whether edge (${u}, ${v}) exists.`, [1], {
    [String(u)]: "focus",
    [String(v)]: "focus",
  });

  const exists = r.edges.some(([a, b]) => Math.min(a, b) === edgePair[0] && Math.max(a, b) === edgePair[1]);
  if (!exists) {
    r.edges.push(edgePair);
    r.snap(`Added undirected edge (${u}, ${v}) to adjacency lists.`, [2, 3], {
      [String(u)]: "fresh",
      [String(v)]: "fresh",
    });
  } else {
    r.snap(`Edge (${u}, ${v}) already exists in the graph.`, [1], {
      [String(u)]: "done",
      [String(v)]: "done",
    });
  }

  return code;
}

function hasEdge(r: GraphRecorder, from: number, to: number): string[] {
  const code = [
    "for each neighbour in adj[u]:",
    "  if neighbour == v: return true",
    "return false",
  ];

  const u = r.vertices.includes(from) ? from : 0;
  const v = r.vertices.includes(to) ? to : 4;
  const edgePair: [number, number] = [Math.min(u, v), Math.max(u, v)];

  r.snap(`Inspect adjacency list of vertex ${u} to find edge to ${v}.`, [1], {
    [String(u)]: "focus",
    [String(v)]: "compare",
  });

  const exists = r.edges.some(([a, b]) => Math.min(a, b) === edgePair[0] && Math.max(a, b) === edgePair[1]);
  if (exists) {
    r.snap(`Edge (${u}, ${v}) exists in the graph.`, [2], {
      [String(u)]: "found",
      [String(v)]: "found",
    });
  } else {
    r.snap(`Edge (${u}, ${v}) does not exist in the graph.`, [3], {
      [String(u)]: "out",
      [String(v)]: "out",
    });
  }

  return code;
}

function removeEdge(r: GraphRecorder, from: number, to: number): string[] {
  const code = [
    "search adj[u] for v and adj[v] for u",
    "if found: remove edge; return true",
    "return false",
  ];

  const u = r.vertices.includes(from) ? from : 0;
  const v = r.vertices.includes(to) ? to : 4;
  const edgePair: [number, number] = [Math.min(u, v), Math.max(u, v)];

  r.snap(`Search for edge (${u}, ${v}) to remove.`, [1], {
    [String(u)]: "focus",
    [String(v)]: "focus",
  });

  const idx = r.edges.findIndex(([a, b]) => Math.min(a, b) === edgePair[0] && Math.max(a, b) === edgePair[1]);
  if (idx >= 0) {
    r.edges.splice(idx, 1);
    r.snap(`Removed edge (${u}, ${v}) from the graph.`, [2], {
      [String(u)]: "gone",
      [String(v)]: "gone",
    });
  } else {
    r.snap(`Edge (${u}, ${v}) was not found; no edge removed.`, [3]);
  }

  return code;
}

export function runGraph(op: GraphOp, p: { from?: number; to?: number } = {}): Program<GraphFrame> {
  const r = new GraphRecorder(SAMPLE_VERTICES, SAMPLE_EDGES);
  const from = p.from ?? 0;
  const to = p.to ?? 4;

  const run: Record<GraphOp, () => string[]> = {
    bfs: () => bfs(r, from),
    dfs: () => dfs(r, from),
    shortestPath: () => shortestPath(r, from, to),
    addVertex: () => addVertex(r),
    addEdge: () => addEdge(r, from, to),
    hasEdge: () => hasEdge(r, from, to),
    removeEdge: () => removeEdge(r, from, to),
  };

  const code = run[op]();
  return { frames: r.frames, code };
}
