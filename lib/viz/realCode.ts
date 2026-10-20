import type { ArrayOp } from "./arrayEngine";

// The array engine's pseudocode in real languages, written line for line so the
// active-line highlight carries over unchanged (scripts/check-engines.mts checks the counts).

export const REAL_LANGS = ["C", "Python"] as const;
export type RealLang = (typeof REAL_LANGS)[number];

export const REAL_CODE: Record<ArrayOp, Record<RealLang, string[]>> = {
  traverse: {
    C: ["for (int i = 0; i < n; i++)", "  visit(a[i]);"],
    Python: ["for i in range(n):", "    visit(a[i])"],
  },
  access: {
    C: ["if (i < 0 || i >= n) return ERROR;", "/* address = base + i * sizeof(int) */", "return a[i];"],
    Python: ["if i < 0 or i >= n: raise IndexError", "# address = base + i * size", "return a[i]"],
  },
  linearSearch: {
    C: ["for (int i = 0; i < n; i++)", "  if (a[i] == target)", "    return i;", "return -1;"],
    Python: ["for i in range(n):", "    if a[i] == target:", "        return i", "return -1"],
  },
  binarySearch: {
    C: [
      "int lo = 0, hi = n - 1;",
      "while (lo <= hi) {",
      "  int mid = (lo + hi) / 2;",
      "  if (a[mid] == target) return mid;",
      "  if (a[mid] < target) lo = mid + 1;",
      "  else hi = mid - 1; }",
      "return -1;",
    ],
    Python: [
      "lo, hi = 0, n - 1",
      "while lo <= hi:",
      "    mid = (lo + hi) // 2",
      "    if a[mid] == target: return mid",
      "    if a[mid] < target: lo = mid + 1",
      "    else: hi = mid - 1",
      "return -1",
    ],
  },
  insert: {
    C: ["n = n + 1;  /* the array needs a spare slot */", "for (int k = n - 1; k > i; k--)", "  a[k] = a[k - 1];", "a[i] = value;"],
    Python: ["a.append(None)", "for k in range(len(a) - 1, i, -1):", "    a[k] = a[k - 1]", "a[i] = value"],
  },
  delete: {
    C: ["for (int k = i; k < n - 1; k++)", "  a[k] = a[k + 1];", "n = n - 1;"],
    Python: ["for k in range(i, len(a) - 1):", "    a[k] = a[k + 1]", "a.pop()"],
  },
  bubbleSort: {
    C: [
      "for (int pass = 0; pass < n - 1; pass++) {",
      "  int swapped = 0;",
      "  for (int j = 0; j < n - 1 - pass; j++)",
      "    if (a[j] > a[j + 1]) {",
      "      int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; swapped = 1; }",
      "  if (!swapped) break; }",
    ],
    Python: [
      "for p in range(n - 1):",
      "    swapped = False",
      "    for j in range(n - 1 - p):",
      "        if a[j] > a[j + 1]:",
      "            a[j], a[j + 1] = a[j + 1], a[j]; swapped = True",
      "    if not swapped: break",
    ],
  },
  selectionSort: {
    C: [
      "for (int i = 0; i < n - 1; i++) {",
      "  int min = i;",
      "  for (int j = i + 1; j < n; j++)",
      "    if (a[j] < a[min]) min = j;",
      "  int t = a[i]; a[i] = a[min]; a[min] = t; }",
    ],
    Python: ["for i in range(n - 1):", "    m = i", "    for j in range(i + 1, n):", "        if a[j] < a[m]: m = j", "    a[i], a[m] = a[m], a[i]"],
  },
  insertionSort: {
    C: ["for (int i = 1; i < n; i++) {", "  int j = i;", "  while (j > 0 && a[j - 1] > a[j]) {", "    int t = a[j - 1]; a[j - 1] = a[j]; a[j] = t; j--; } }"],
    Python: ["for i in range(1, n):", "    j = i", "    while j > 0 and a[j - 1] > a[j]:", "        a[j - 1], a[j] = a[j], a[j - 1]; j -= 1"],
  },
  reverse: {
    C: ["int l = 0, r = n - 1;", "while (l < r) {", "  int t = a[l]; a[l] = a[r]; a[r] = t;", "  l++; r--; }"],
    Python: ["l, r = 0, n - 1", "while l < r:", "    a[l], a[r] = a[r], a[l]", "    l += 1; r -= 1"],
  },
  mergeSort: {
    C: [
      "void mergeSort(int a[], int lo, int hi) {",
      "  if (lo >= hi) return;",
      "  int mid = (lo + hi) / 2;",
      "  mergeSort(a, lo, mid); mergeSort(a, mid + 1, hi);",
      "  merge(a, lo, mid, hi);",
      "  /* merge copies the smaller front element each time */ }",
    ],
    Python: [
      "def merge_sort(a, lo, hi):",
      "    if lo >= hi: return",
      "    mid = (lo + hi) // 2",
      "    merge_sort(a, lo, mid); merge_sort(a, mid + 1, hi)",
      "    merge(a, lo, mid, hi)",
      "    # merge copies the smaller front element each time",
    ],
  },
  quickSort: {
    C: [
      "void quickSort(int a[], int lo, int hi) {",
      "  if (lo >= hi) return;",
      "  int pivot = a[hi], i = lo - 1;",
      "  for (int j = lo; j < hi; j++)",
      "    if (a[j] < pivot) { i++; swap(&a[i], &a[j]); }",
      "  swap(&a[i + 1], &a[hi]);",
      "  quickSort(a, lo, i); quickSort(a, i + 2, hi); }",
    ],
    Python: [
      "def quick_sort(a, lo, hi):",
      "    if lo >= hi: return",
      "    pivot, i = a[hi], lo - 1",
      "    for j in range(lo, hi):",
      "        if a[j] < pivot: i += 1; a[i], a[j] = a[j], a[i]",
      "    a[i + 1], a[hi] = a[hi], a[i + 1]",
      "    quick_sort(a, lo, i); quick_sort(a, i + 2, hi)",
    ],
  },
};
