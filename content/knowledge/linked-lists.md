---
id: linked-lists
index: 2
name: Linked Lists
oneLine: A chain of nodes, each holding a value and the address of the next.
palette: violet
status: partial
formats: brief, visualizer
related: arrays, stacks-queues
---

## Summary
A linked list is a chain of nodes. Each node holds a value and a pointer to the next node; the list itself only remembers where the first node, the head, is. The nodes can live anywhere in memory, so the list can grow and shrink one node at a time without moving anything. The trade-off is that there is no address formula: to reach the fifth node you must start at the head and follow four pointers.

## Real world
A treasure hunt. Each clue tells you where the next clue is hidden. Adding a new clue between two others only means rewriting one clue — but to reach clue ten, you have to follow the first nine.

## Key points
- Inserting or deleting at the head is O(1): only pointers change, nothing shifts.
- Reaching the k-th node is O(k): you must walk from the head, following next pointers.
- Nodes are not contiguous, so each node spends extra memory on its pointer.

## Core facts
- A linked list is made of nodes; each node stores a value and a pointer to the next node.
- The head pointer refers to the first node; the last node's next pointer is null.
- Nodes need not be contiguous in memory.
- Access to the k-th node is O(k) because pointers must be followed from the head.
- Insertion at the head is O(1).
- Deletion at the head is O(1).
- Insertion or deletion at a known position requires walking to the node before it, so it is O(n) in general.
- Searching for a value is O(n).
- Reversing a singly linked list in place uses three pointers (prev, curr, next) and is O(n).
- A doubly linked list also stores a pointer to the previous node.

## Operations
### Traverse {#traverse .main}
Start at head and follow next pointers until null. O(n).

### Search {#search .main}
Traverse, comparing each node's value with the key. O(n).

### Insert at beginning {#insertBegin .main}
Create a node, point its next to the current head, then move head to the new node. O(1).

### Insert at end {#insertEnd .main}
Walk to the last node and point its next to the new node. O(n).

### Delete at beginning {#deleteBegin .main}
Move head to head.next; the old first node is freed. O(1).

### Reverse {#reverse .main}
Walk the list once, turning each next pointer around using prev, curr and next. O(n).

### Insert at position {#insertAt}
Walk to the node before position k, point the new node at its successor, then link the previous node to the new one. O(n).

### Delete at end {#deleteEnd}
Walk to the second-last node and set its next to null. O(n).
