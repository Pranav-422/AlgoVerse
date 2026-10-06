---
id: sorting
index: 6
name: Sorting
oneLine: Putting things in order, and what each method costs.
palette: amber
status: partial
formats: brief, visualizer
related: arrays, recursion, trees
---

## Summary
Sorting algorithms rearrange a collection of elements into a specified order, typically non-decreasing or non-increasing. Elementary algorithms such as bubble sort, selection sort, and insertion sort are simple to implement and operate in place, but exhibit quadratic O(n²) worst-case running times. Advanced divide-and-conquer algorithms like merge sort and quicksort improve performance to O(n log n) average time. A sorting algorithm is considered stable if it preserves the relative order of elements that have equal keys. Any comparison-based sorting algorithm requires at least Ω(n log n) comparisons in the worst case.

## Real world
Organizing a hand of playing cards. A player might scan through the hand repeatedly to pick the lowest card, or pick up cards one by one and insert each into its proper sorted position among the cards already held.

## Key points
- Simple comparison sorts (bubble, selection, insertion) run in O(n²) worst-case time.
- Divide-and-conquer sorts (merge sort, quicksort) achieve O(n log n) average time.
- Any comparison-based sorting algorithm has a theoretical lower bound of Ω(n log n).

## Core facts
- Sorting rearranges elements into ascending or descending order based on a comparison key.
- A sorting algorithm is stable if it preserves the relative order of records with equal keys.
- An in-place sorting algorithm uses O(1) auxiliary memory beyond the input array.
- Bubble sort repeatedly compares and swaps adjacent out-of-order elements and runs in O(n²) worst-case time.
- Selection sort repeatedly selects the minimum element from the unsorted suffix and runs in O(n²) time.
- Insertion sort shifts elements to place the next item into an already sorted prefix and runs in O(n²) worst-case time.
- Insertion sort runs in O(n) linear time on an already sorted or nearly sorted array.
- Merge sort divides the array in half, recursively sorts both halves, and merges them in O(n log n) time.
- Merge sort is stable but requires O(n) auxiliary space for merging.
- Quicksort partitions elements around a pivot value and achieves O(n log n) average time.
- Quicksort can degrade to O(n²) worst-case time when an unbalanced pivot is chosen repeatedly.
- Any comparison-based sorting algorithm requires Ω(n log n) comparisons in the worst case.

## Operations
### Merge sort {#mergeSort .main}
Recursively split the array into halves, sort each half, and merge the sorted halves. O(n log n).

### Quicksort {#quickSort .main}
Select a pivot element, partition smaller items to the left and larger to the right, and recurse. O(n log n).

### Insertion sort {#insertionSort .main}
Iterate through the array, inserting each element into its proper position in the sorted prefix. O(n²).

### Selection sort {#selectionSort .main}
Find the minimum element in the unsorted suffix and swap it into the current position. O(n²).

### Bubble sort {#bubbleSort .main}
Pass through the array, comparing adjacent elements and swapping them if out of order. O(n²).

### Partition {#partition}
Rearrange an array slice around a pivot such that smaller elements precede larger ones. O(n).

### Merge {#merge}
Combine two sorted subarrays into a single sorted array by comparing their front elements. O(n).
