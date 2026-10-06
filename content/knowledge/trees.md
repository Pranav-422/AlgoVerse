---
id: trees
index: 4
name: Trees
oneLine: Hierarchical branching nodes with a single root and efficient search.
palette: teal
status: partial
formats: brief, comic
related: linked-lists, recursion, graphs
---

## Summary
A tree is a hierarchical data structure composed of nodes connected by directed edges, starting from a single top node called the root. Unlike arrays or linked lists, each node can branch to multiple children, while every non-root node has exactly one parent. In a binary tree, each node has at most two children: a left child and a right child. Binary search trees enforce an ordering property where every left descendant is smaller than the parent and every right descendant is larger. When a tree remains balanced, search and insertion take logarithmic time by cutting the remaining candidates in half at every step, but an unbalanced or skewed tree degrades to linear time like a linked list.

## Real world
A company organization chart. The chief executive sits at the root, department managers branch beneath them, and individual contributors form the leaf positions. Finding who reports to whom follows a single hierarchical path without any circular loops.

## Key points
- In a balanced binary search tree, search, insertion, and deletion take O(log n) time.
- In an unbalanced or skewed tree, height degrades to n, making operations O(n).
- Tree traversals (inorder, preorder, postorder, level-order) visit all n nodes in O(n) time.

## Core facts
- A tree is a hierarchical collection of nodes connected by edges with no cycles.
- The topmost node is the root, and nodes with no children are called leaves.
- Every node in a tree except the root has exactly one parent.
- The height of a tree is the number of edges on the longest path from the root to a leaf.
- In a binary tree, every node has at most two children, called left and right.
- The binary search tree property states that all left descendants are smaller and all right descendants are larger than the node.
- Searching a balanced binary search tree takes O(log n) time by discarding half the remaining nodes at each step.
- If a binary search tree becomes completely skewed, its height becomes n and search takes O(n) time.
- Inserting a node in a binary search tree follows the search path to an empty spot and takes O(log n) time when balanced.
- Inorder traversal visits left subtree, current node, then right subtree.
- An inorder traversal of a binary search tree produces values in sorted ascending order.
- Inorder traversal visits all n nodes in O(n) time.
- Preorder traversal visits the current node before its children, while postorder visits children first.
- Level-order traversal visits nodes level by level using a queue and takes O(n) time.

## Operations
### Search {#search .main}
Compare the target value with the current node, branching left if smaller and right if larger until found or reaching null. O(log n).

### Insert {#insert .main}
Walk down following the binary search tree property until reaching an empty leaf position, then attach the new node. O(log n).

### Inorder traversal {#inorder .main}
Recursively traverse the left child, visit the current node, then traverse the right child. O(n).

### Preorder traversal {#preorder .main}
Visit the current node first, then recursively traverse the left and right subtrees. O(n).

### Postorder traversal {#postorder .main}
Recursively traverse the left and right subtrees before visiting the current node. O(n).

### Level-order traversal {#levelOrder}
Use a queue to visit and process nodes level by level from the root down to the leaves. O(n).

### Find minimum {#findMin}
Follow left child pointers from the root until reaching a node with no left child. O(log n).
