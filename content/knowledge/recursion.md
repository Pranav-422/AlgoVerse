---
id: recursion
index: 7
name: Recursion
oneLine: Solving a problem by breaking it into smaller instances of the same problem.
palette: violet
status: partial
formats: brief
related: stacks-queues, trees, sorting
---

## Summary
Recursion is a problem-solving technique where a function solves a task by calling itself with smaller or simpler inputs. Every recursive function requires at least one base case that terminates the process without further calls, preventing infinite recursion. Each recursive step moves closer to the base case while performing a portion of the overall computation. The computer manages active invocations using the call stack, where each function frame stores local variables and return addresses. If recursion runs too deeply without reaching a base case, the call stack exhausts available memory and produces a stack overflow error.

## Real world
Russian nesting dolls. Opening the largest doll reveals a smaller identical doll inside, and opening that doll reveals an even smaller one, continuing until you reach the innermost solid figurine that cannot be opened.

## Key points
- Every recursive function must have a base case to terminate and avoid infinite loops.
- Each recursive call consumes memory on the call stack, requiring O(d) space for maximum depth d.
- Naive recursive Fibonacci runs in O(2ⁿ) time, while memoized or iterative versions run in O(n) time.

## Core facts
- A recursive function is a function that calls itself directly or indirectly.
- The base case is a stopping condition that returns a result without making further recursive calls.
- The recursive case breaks the input into smaller subproblems and calls the function again.
- Each function call allocates an activation frame on the call stack to store parameters and local variables.
- Returning from a recursive call pops its frame off the call stack and resumes the caller.
- Without a reachable base case, infinite recursion exhausts stack memory and causes a stack overflow.
- Calculating factorial recursively has a recurrence of T(n) = T(n - 1) + O(1), running in O(n) time and O(n) stack space.
- Naive recursive Fibonacci makes two branching calls per step, resulting in exponential O(2ⁿ) time.
- Tail recursion occurs when the recursive call is the very last operation performed before returning.
- Some compilers can optimize tail-recursive calls to run in O(1) auxiliary stack space like a loop.
- Every recursive algorithm can also be implemented iteratively using an explicit stack or loop.
- Tree and graph traversals naturally lend themselves to recursive formulations.

## Operations
### Factorial {#factorial .main}
Multiply n by the factorial of n − 1, terminating when n reaches the base case of 0 or 1. O(n).

### Fibonacci {#fibonacci .main}
Compute the sum of the previous two Fibonacci numbers with base cases fib(0) = 0 and fib(1) = 1. O(2ⁿ).

### Sum of array {#sumArray .main}
Add the first element to the recursive sum of the remaining subarray, ending on an empty list. O(n).

### Power function {#power .main}
Compute xⁿ by multiplying x by power(x, n − 1), or square power(x, n/2) for faster divide-and-conquer. O(log n).

### Binary search recursive {#binarySearchRec .main}
Compare target with middle element and recursively search either the left or right half. O(log n).

### Tower of Hanoi {#hanoi}
Recursively move n − 1 disks to an auxiliary peg, move the largest disk, then move the rest. O(2ⁿ).

### Palindrome check {#isPalindrome}
Compare first and last characters, then recursively check the inner substring until fewer than two characters remain. O(n).
