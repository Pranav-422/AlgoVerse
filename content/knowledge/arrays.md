---
id: arrays
index: 1
name: Arrays
oneLine: A fixed row of boxes, each reachable instantly by its number.
palette: amber
status: complete
formats: brief, comic, video, visualizer
related: linked-lists, stacks-queues, sorting
---

## Summary
An array is a fixed-size row of elements stored side by side in memory. Every element has an index, starting at 0. Because the elements sit next to each other and are all the same size, the computer can work out where element i lives with one multiplication and one addition — so reading any element takes the same time, no matter how long the array is. The price of that speed is rigidity: inserting or deleting in the middle forces every later element to shift.

## Real world
Seats in a cinema row. Seat 14 is found by walking straight to position 14 — nobody checks seats 1 to 13 first. But if a latecomer must sit in seat 3 and everyone stays in order, every person from seat 3 onward has to move one seat to the right.

## Key points
- Access by index is O(1): the address is computed as base + index × element size, not searched for.
- Insertion or deletion in the middle is O(n): every later element must shift by one position.
- Binary search finds a value in O(log n), but only if the array is already sorted.

## Core facts
- An array stores elements in contiguous memory.
- Indexing starts at 0; the last valid index is length − 1.
- address(i) = base_address + i × element_size.
- Access by index is O(1) because the address is computed, not searched.
- Updating an element at a known index is O(1).
- Insertion in the middle is O(n) because later elements must shift right.
- Deletion in the middle is O(n) because later elements must shift left.
- Linear search checks elements one by one and is O(n).
- Binary search requires a sorted array and halves the search range each step, so it is O(log n).
- Reversing an array in place uses two pointers moving toward each other and is O(n) time, O(1) extra space.
- Bubble sort repeatedly swaps adjacent out-of-order pairs and is O(n²) in the worst case.
- Selection sort repeatedly selects the smallest remaining element and is O(n²).
- Insertion sort builds a sorted prefix one element at a time and is O(n²) in the worst case.

## Operations
### Access {#access .main}
Jump directly to index i using the address formula. O(1).

### Linear search {#linearSearch .main}
Compare the target with each element from the left until it matches or the array ends. O(n).

### Binary search {#binarySearch .main}
Requires a sorted array. Compare the target with the middle element; discard the half that cannot contain it; repeat. O(log n).

### Insert {#insert .main}
To insert at index i, shift every element from i onward one place right, then write the new value at i. O(n).

### Delete {#delete .main}
To delete at index i, shift every element after i one place left. O(n).

### Bubble sort {#bubbleSort .main}
Walk the array comparing neighbours, swapping any pair that is out of order. After each pass the largest remaining element has settled at the end. O(n²).

### Traverse {#traverse}
Visit every element from index 0 to length − 1, once each. O(n).

### Reverse {#reverse}
Two pointers start at both ends, swap, and move toward each other until they meet. O(n).

### Selection sort {#selectionSort}
Each pass finds the smallest remaining element and swaps it into the next position. O(n²).

### Insertion sort {#insertionSort}
Grow a sorted prefix: take the next element and shift larger ones right until its place opens. O(n²).
