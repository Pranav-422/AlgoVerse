import { ask, type Ask, type Mark, type Program, type Tag, type TreeFrame, type TreeNode } from "./types";

export type TreeOp = "search" | "insert" | "inorder" | "preorder" | "postorder" | "levelOrder" | "findMin";

export const TREE_PARAMS: Record<TreeOp, "value"[]> = {
  search: ["value"],
  insert: ["value"],
  inorder: [],
  preorder: [],
  postorder: [],
  levelOrder: [],
  findMin: [],
};

let seq = 0;

function createBst(values: number[]): { nodes: Map<string, TreeNode>; root: string | null } {
  const nodes = new Map<string, TreeNode>();
  let root: string | null = null;

  for (const v of values) {
    const id = `t${++seq}`;
    const newNode: TreeNode = { id, value: v, left: null, right: null };
    nodes.set(id, newNode);
    if (!root) {
      root = id;
    } else {
      let curr = root;
      while (curr) {
        const cNode: TreeNode = nodes.get(curr)!;
        if (v < cNode.value) {
          if (!cNode.left) {
            cNode.left = id;
            break;
          }
          curr = cNode.left;
        } else {
          if (!cNode.right) {
            cNode.right = id;
            break;
          }
          curr = cNode.right;
        }
      }
    }
  }

  return { nodes, root };
}

class TreeRecorder {
  frames: TreeFrame[] = [];
  nodes: Map<string, TreeNode>;
  root: string | null;
  output: number[] = [];
  private pending?: Ask;

  constructor(nodes: Map<string, TreeNode>, root: string | null) {
    this.nodes = nodes;
    this.root = root;
  }

  askNext(a: Ask | undefined) {
    this.pending = a;
  }

  snap(note: string, lines: number[], marks: Record<string, Mark> = {}, tags: Tag[] = []) {
    this.frames.push({
      nodes: Array.from(this.nodes.values()).map((n) => ({ ...n })),
      root: this.root,
      marks,
      tags,
      output: [...this.output],
      note,
      lines,
      ...(this.pending && { ask: this.pending }),
    });
    this.pending = undefined;
  }
}

function search(r: TreeRecorder, target: number): string[] {
  const code = [
    "if root is null: return not found",
    "curr = root",
    "while curr is not null:",
    "  if target == curr.value: return found",
    "  if target < curr.value: curr = curr.left",
    "  else: curr = curr.right",
    "return not found",
  ];

  if (!r.root) {
    r.snap(`Root is null. Target ${target} cannot be found in an empty tree.`, [1]);
    r.snap(`Target ${target} was not found.`, [7]);
    return code;
  }

  const rootNode: TreeNode = r.nodes.get(r.root)!;
  r.snap(`Start search for ${target} at root node ${rootNode.value}.`, [2, 3], { [rootNode.id]: "focus" }, [
    { name: "curr", at: rootNode.id },
  ]);

  let currId: string | null = r.root;
  let asked = false;

  while (currId) {
    const currentNode: TreeNode = r.nodes.get(currId)!;
    if (currentNode.value === target) {
      r.snap(`Found target ${target} at node ${currentNode.value}!`, [4], { [currentNode.id]: "found" }, [
        { name: "curr", at: currentNode.id },
      ]);
      return code;
    }

    if (!asked) {
      const rightDir = target < currentNode.value ? "Left" : "Right";
      const wrongDir = target < currentNode.value ? "Right" : "Left";
      r.askNext(ask(`${target} ${target < currentNode.value ? "<" : ">"} ${currentNode.value}: go left or right?`, rightDir, [wrongDir]));
      asked = true;
    }

    if (target < currentNode.value) {
      r.snap(`${target} < ${currentNode.value}: branch left to inspect the left child.`, [5], { [currentNode.id]: "compare" }, [
        { name: "curr", at: currentNode.id },
      ]);
      currId = currentNode.left;
    } else {
      r.snap(`${target} > ${currentNode.value}: branch right to inspect the right child.`, [6], { [currentNode.id]: "compare" }, [
        { name: "curr", at: currentNode.id },
      ]);
      currId = currentNode.right;
    }

    if (currId) {
      const nextNode: TreeNode = r.nodes.get(currId)!;
      r.snap(`Move to node ${nextNode.value}.`, [3], { [nextNode.id]: "focus" }, [{ name: "curr", at: nextNode.id }]);
    }
  }

  r.snap(`Reached null child. Target ${target} is not in the BST.`, [7]);
  return code;
}

function insert(r: TreeRecorder, value: number): string[] {
  const code = [
    "if root is null: create root; return",
    "curr = root",
    "while true:",
    "  if value < curr.value:",
    "    if curr.left is null: curr.left = new node; return",
    "    curr = curr.left",
    "  else:",
    "    if curr.right is null: curr.right = new node; return",
    "    curr = curr.right",
  ];

  if (!r.root) {
    r.snap(`Tree is empty. Inserting ${value} as the root node.`, [1]);
    const newId = `t${++seq}`;
    const rootNode: TreeNode = { id: newId, value, left: null, right: null };
    r.nodes.set(newId, rootNode);
    r.root = newId;
    r.snap(`Created root node ${value}.`, [1], { [newId]: "fresh" }, [{ name: "root", at: newId }]);
    return code;
  }

  const rootNode: TreeNode = r.nodes.get(r.root)!;
  r.snap(`Begin insertion of ${value} starting from root ${rootNode.value}.`, [2, 3], { [rootNode.id]: "focus" }, [
    { name: "curr", at: rootNode.id },
  ]);

  let currId = r.root;
  let asked = false;

  while (true) {
    const currentNode: TreeNode = r.nodes.get(currId)!;

    if (!asked) {
      const rightDir = value < currentNode.value ? "Left" : "Right";
      const wrongDir = value < currentNode.value ? "Right" : "Left";
      r.askNext(ask(`${value} ${value < currentNode.value ? "<" : ">="} ${currentNode.value}: go left or right?`, rightDir, [wrongDir]));
      asked = true;
    }

    if (value < currentNode.value) {
      if (!currentNode.left) {
        const newId = `t${++seq}`;
        const newNode: TreeNode = { id: newId, value, left: null, right: null };
        r.nodes.set(newId, newNode);
        currentNode.left = newId;
        r.snap(`${value} < ${currentNode.value} and left child is empty. Attach ${value} as left child.`, [5], {
          [currentNode.id]: "done",
          [newId]: "fresh",
        }, [{ name: "new", at: newId }]);
        return code;
      }
      r.snap(`${value} < ${currentNode.value}: descend to left child ${r.nodes.get(currentNode.left)!.value}.`, [6], {
        [currentNode.id]: "compare",
      }, [{ name: "curr", at: currentNode.id }]);
      currId = currentNode.left;
    } else {
      if (!currentNode.right) {
        const newId = `t${++seq}`;
        const newNode: TreeNode = { id: newId, value, left: null, right: null };
        r.nodes.set(newId, newNode);
        currentNode.right = newId;
        r.snap(`${value} >= ${currentNode.value} and right child is empty. Attach ${value} as right child.`, [8], {
          [currentNode.id]: "done",
          [newId]: "fresh",
        }, [{ name: "new", at: newId }]);
        return code;
      }
      r.snap(`${value} >= ${currentNode.value}: descend to right child ${r.nodes.get(currentNode.right)!.value}.`, [9], {
        [currentNode.id]: "compare",
      }, [{ name: "curr", at: currentNode.id }]);
      currId = currentNode.right;
    }
  }
}

function inorder(r: TreeRecorder): string[] {
  const code = [
    "function inorder(node):",
    "  if node is null: return",
    "  inorder(node.left)",
    "  visit(node.value)",
    "  inorder(node.right)",
  ];

  if (!r.root) {
    r.snap("The tree is empty.", [1, 2]);
    r.snap("Inorder traversal complete: 0 nodes visited.", [2]);
    return code;
  }

  const rootNode: TreeNode = r.nodes.get(r.root)!;
  r.snap(`Start inorder traversal (left subtree, root, right subtree) from root ${rootNode.value}.`, [1, 2], {
    [rootNode.id]: "focus",
  });

  const visitedMarks: Record<string, Mark> = {};
  let asked = false;

  function traverse(nodeId: string | null) {
    if (!nodeId) return;
    const currentNode: TreeNode = r.nodes.get(nodeId)!;

    traverse(currentNode.left);

    if (!asked && r.output.length > 0) {
      r.askNext(ask("Which value is visited next in inorder traversal?", currentNode.value, [currentNode.value + 10, currentNode.value - 5]));
      asked = true;
    }

    r.output.push(currentNode.value);
    visitedMarks[currentNode.id] = "done";
    r.snap(`Visit node ${currentNode.value}. Inorder produces values in ascending order.`, [4], {
      ...visitedMarks,
      [currentNode.id]: "found",
    }, [{ name: "curr", at: currentNode.id }]);

    traverse(currentNode.right);
  }

  traverse(r.root);
  r.snap(`Inorder traversal complete: [${r.output.join(", ")}].`, [1], visitedMarks);
  return code;
}

function preorder(r: TreeRecorder): string[] {
  const code = [
    "function preorder(node):",
    "  if node is null: return",
    "  visit(node.value)",
    "  preorder(node.left)",
    "  preorder(node.right)",
  ];

  if (!r.root) {
    r.snap("The tree is empty.", [1, 2]);
    r.snap("Preorder traversal complete: 0 nodes visited.", [2]);
    return code;
  }

  const rootNode: TreeNode = r.nodes.get(r.root)!;
  r.snap(`Start preorder traversal (root, left subtree, right subtree) from root ${rootNode.value}.`, [1, 2], {
    [rootNode.id]: "focus",
  });

  const visitedMarks: Record<string, Mark> = {};

  function traverse(nodeId: string | null) {
    if (!nodeId) return;
    const currentNode: TreeNode = r.nodes.get(nodeId)!;

    r.output.push(currentNode.value);
    visitedMarks[currentNode.id] = "done";
    r.snap(`Visit root/current node ${currentNode.value} before traversing its children.`, [3], {
      ...visitedMarks,
      [currentNode.id]: "found",
    }, [{ name: "curr", at: currentNode.id }]);

    traverse(currentNode.left);
    traverse(currentNode.right);
  }

  traverse(r.root);
  r.snap(`Preorder traversal complete: [${r.output.join(", ")}].`, [1], visitedMarks);
  return code;
}

function postorder(r: TreeRecorder): string[] {
  const code = [
    "function postorder(node):",
    "  if node is null: return",
    "  postorder(node.left)",
    "  postorder(node.right)",
    "  visit(node.value)",
  ];

  if (!r.root) {
    r.snap("The tree is empty.", [1, 2]);
    r.snap("Postorder traversal complete: 0 nodes visited.", [2]);
    return code;
  }

  const rootNode: TreeNode = r.nodes.get(r.root)!;
  r.snap(`Start postorder traversal (left subtree, right subtree, root) from root ${rootNode.value}.`, [1, 2], {
    [rootNode.id]: "focus",
  });

  const visitedMarks: Record<string, Mark> = {};

  function traverse(nodeId: string | null) {
    if (!nodeId) return;
    const currentNode: TreeNode = r.nodes.get(nodeId)!;

    traverse(currentNode.left);
    traverse(currentNode.right);

    r.output.push(currentNode.value);
    visitedMarks[currentNode.id] = "done";
    r.snap(`Visit node ${currentNode.value} after traversing both its left and right subtrees.`, [5], {
      ...visitedMarks,
      [currentNode.id]: "found",
    }, [{ name: "curr", at: currentNode.id }]);
  }

  traverse(r.root);
  r.snap(`Postorder traversal complete: [${r.output.join(", ")}].`, [1], visitedMarks);
  return code;
}

function levelOrder(r: TreeRecorder): string[] {
  const code = [
    "if root is null: return",
    "queue = [root]",
    "while queue is not empty:",
    "  curr = queue.dequeue()",
    "  visit(curr.value)",
    "  if curr.left: queue.enqueue(curr.left)",
    "  if curr.right: queue.enqueue(curr.right)",
  ];

  if (!r.root) {
    r.snap("The tree is empty.", [1]);
    r.snap("Level-order traversal complete: 0 nodes visited.", [1]);
    return code;
  }

  const rootNode: TreeNode = r.nodes.get(r.root)!;
  r.snap(`Initialize queue with root ${rootNode.value} for level-order traversal.`, [1, 2], { [rootNode.id]: "focus" }, [
    { name: "front", at: rootNode.id },
  ]);

  const queue: string[] = [r.root];
  const visitedMarks: Record<string, Mark> = {};
  let asked = false;

  while (queue.length > 0) {
    const currId = queue.shift()!;
    const currentNode: TreeNode = r.nodes.get(currId)!;

    if (!asked && queue.length > 0) {
      const nextId = queue[0];
      const nextNode: TreeNode = r.nodes.get(nextId)!;
      r.askNext(ask("Which node is visited next in level order?", nextNode.value, [nextNode.value + 10, nextNode.value - 10]));
      asked = true;
    }

    r.output.push(currentNode.value);
    visitedMarks[currentNode.id] = "done";
    r.snap(`Dequeue and visit node ${currentNode.value}.`, [4, 5], {
      ...visitedMarks,
      [currentNode.id]: "found",
    }, [{ name: "curr", at: currentNode.id }]);

    if (currentNode.left) {
      queue.push(currentNode.left);
      const leftNode: TreeNode = r.nodes.get(currentNode.left)!;
      r.snap(`Enqueue left child ${leftNode.value}.`, [6], {
        ...visitedMarks,
        [leftNode.id]: "focus",
      });
    }

    if (currentNode.right) {
      queue.push(currentNode.right);
      const rightNode: TreeNode = r.nodes.get(currentNode.right)!;
      r.snap(`Enqueue right child ${rightNode.value}.`, [7], {
        ...visitedMarks,
        [rightNode.id]: "focus",
      });
    }
  }

  r.snap(`Level-order traversal complete: [${r.output.join(", ")}].`, [3], visitedMarks);
  return code;
}

function findMin(r: TreeRecorder): string[] {
  const code = [
    "if root is null: return null",
    "curr = root",
    "while curr.left is not null:",
    "  curr = curr.left",
    "return curr.value",
  ];

  if (!r.root) {
    r.snap("The tree is empty. No minimum node exists.", [1]);
    r.snap("findMin complete: tree has no elements.", [1]);
    return code;
  }

  const rootNode: TreeNode = r.nodes.get(r.root)!;
  r.snap(`To find the minimum value in a BST, start at root ${rootNode.value} and follow left pointers.`, [1, 2], {
    [rootNode.id]: "focus",
  }, [{ name: "curr", at: rootNode.id }]);

  let currId = r.root;
  while (true) {
    const currentNode: TreeNode = r.nodes.get(currId)!;
    if (!currentNode.left) {
      r.output.push(currentNode.value);
      r.snap(`Node ${currentNode.value} has no left child. Minimum value in the BST is ${currentNode.value}.`, [5], {
        [currentNode.id]: "found",
      }, [{ name: "min", at: currentNode.id }]);
      break;
    }

    r.snap(`Node ${currentNode.value} has left child ${r.nodes.get(currentNode.left)!.value}; follow the left pointer.`, [3, 4], {
      [currentNode.id]: "compare",
    }, [{ name: "curr", at: currentNode.id }]);
    currId = currentNode.left;
  }

  return code;
}

export function runTree(op: TreeOp, values: number[], p: { value?: number } = {}): Program<TreeFrame> {
  const { nodes, root } = createBst(values);
  const r = new TreeRecorder(nodes, root);
  const val = p.value ?? 60;

  const run: Record<TreeOp, () => string[]> = {
    search: () => search(r, val),
    insert: () => insert(r, val),
    inorder: () => inorder(r),
    preorder: () => preorder(r),
    postorder: () => postorder(r),
    levelOrder: () => levelOrder(r),
    findMin: () => findMin(r),
  };

  const code = run[op]();
  return { frames: r.frames, code };
}
