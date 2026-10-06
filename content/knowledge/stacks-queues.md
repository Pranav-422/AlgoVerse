---
id: stacks-queues
index: 3
name: Stacks & Queues
oneLine: Two disciplined lines — last in first out, and first in first out.
palette: teal
status: partial
formats: brief, comic, visualizer
related: arrays, linked-lists, recursion
---

## Summary
Stacks and queues are collections that restrict where you may add and remove items. A stack only works at one end, the top: the last item pushed is the first popped (LIFO). A queue adds at the rear and removes from the front: the first item in is the first out (FIFO). Both can be built on an array or a linked list, and their core operations all run in O(1).

## Real world
A stack is a pile of plates: you put a plate on top and take a plate from the top. A queue is the line at a ticket counter: people join at the back and are served from the front.

## Key points
- A stack is LIFO: push and pop both happen at the top, each in O(1).
- A queue is FIFO: enqueue at the rear, dequeue from the front, each in O(1).
- A circular queue reuses freed slots by wrapping indices with modulo arithmetic.

## Core facts
- A stack follows Last In, First Out (LIFO).
- Push adds an element to the top of the stack in O(1).
- Pop removes the top element of the stack in O(1).
- Peek reads the top element without removing it in O(1).
- Popping an empty stack is an underflow; pushing onto a full fixed-size stack is an overflow.
- Function calls are managed with a call stack.
- A stack checks balanced brackets by pushing openers and popping to match closers in O(n).
- A queue follows First In, First Out (FIFO).
- Enqueue adds an element at the rear in O(1).
- Dequeue removes the element at the front in O(1).
- A circular queue computes the next index as (index + 1) mod capacity.
- A deque allows insertion and deletion at both ends.

## Operations
### Push {#push .main .stack}
Increment top, then write the value at stack[top]. O(1).

### Pop {#pop .main .stack}
Read stack[top], then decrement top. O(1).

### Peek {#peek .main .stack}
Read stack[top] without changing top. O(1).

### Overflow and underflow {#overflow .main .stack}
Pushing onto a full fixed-size stack is an overflow; popping an empty stack is an underflow. O(1).

### Balanced parentheses {#balanced .main .stack}
Push every opening bracket; on each closing bracket, pop and check it matches. The string is balanced if every closer matched and the stack ends empty. O(n).

### Enqueue {#enqueue .main .queue}
Advance rear and write the value there. O(1).

### Dequeue {#dequeue .main .queue}
Read the value at front, then advance front. O(1).

### Peek front {#peekFront .main .queue}
Read the value at front without removing it. O(1).

### Circular enqueue {#circularEnqueue .main .queue}
rear = (rear + 1) mod capacity, so freed slots at the start are reused. O(1).

### Circular dequeue {#circularDequeue .main .queue}
front = (front + 1) mod capacity after reading the front value. O(1).
