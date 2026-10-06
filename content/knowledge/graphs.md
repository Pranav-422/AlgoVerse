---
id: graphs
index: 5
name: Graphs
oneLine: A network of vertices connected by edges, with arbitrary relationships.
palette: violet
status: partial
formats: brief
related: linked-lists, trees, recursion
---

## Summary
A graph is a non-linear data structure consisting of a finite set of vertices (also called nodes) and a set of edges that connect pairs of vertices. Unlike trees, graphs impose no hierarchy, have no designated root node, and can contain cycles and disconnected components. Edges can be undirected, representing symmetric two-way relationships, or directed, representing one-way connections. Edges may also carry numerical weights representing distances, costs, or capacities. Common memory representations include adjacency matrices, which offer constant-time edge lookups, and adjacency lists, which save space on sparse graphs.

## Real world
A flight route network. Cities serve as vertices, and direct flight paths between them act as edges with mileage or travel time as edge weights. Finding the shortest journey from one city to another requires navigating through this interconnected web of connections.

## Key points
- An adjacency list uses O(V + E) space, making it efficient for sparse graphs.
- An adjacency matrix uses O(V²) space and checks edge existence in O(1) time.
- Breadth-first search and depth-first search explore all reachable vertices in O(V + E) time.

## Core facts
- A graph G = (V, E) consists of a set of vertices V and a set of edges E.
- An undirected edge connects two vertices symmetrically, while a directed edge goes in one direction.
- A weighted graph assigns a numerical weight or cost to each edge.
- A cycle is a path of edges that starts and ends at the same vertex.
- In an adjacency matrix of size V × V, checking if an edge exists takes O(1) time.
- An adjacency matrix requires O(V²) memory, which can be wasteful for sparse graphs.
- An adjacency list stores an array of linked lists or dynamic arrays, using O(V + E) memory.
- Breadth-first search (BFS) uses a queue to explore neighbours level by level in O(V + E) time.
- BFS finds the shortest path in terms of edge count in an unweighted graph.
- Depth-first search (DFS) uses recursion or a stack to explore as deep as possible along each branch in O(V + E) time.
- A graph is connected if there is a path between every pair of vertices.
- A tree is a connected undirected graph with no cycles and exactly V − 1 edges.

## Operations
### Breadth-first search {#bfs .main}
Explore vertices level by level using a queue, tracking visited vertices to prevent revisiting. O(V + E).

### Depth-first search {#dfs .main}
Traverse as deep as possible along each branch using recursion or an explicit stack before backtracking. O(V + E).

### Add vertex {#addVertex .main}
Allocate a new vertex and initialize its empty adjacency list entry. O(1).

### Add edge {#addEdge .main}
Append the target vertex to the source vertex's adjacency list. O(1).

### Check edge {#hasEdge .main}
Search the adjacency list of vertex u to see if vertex v is present. O(degree(u)).

### Remove edge {#removeEdge}
Find and delete the edge connecting vertex u and vertex v from the adjacency list. O(degree(u)).

### Shortest path unweighted {#shortestPath}
Run breadth-first search from the source vertex until the target vertex is reached. O(V + E).
