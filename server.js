const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root route (IMPORTANT for Railway)
app.get("/", (req, res) => {
    res.send("API is running 🚀");
});

// POST /bfhl
app.post("/bfhl", (req, res) => {
    const data = req.body.data || [];

    let validEdges = [];
    let invalid_entries = [];
    let duplicate_edges = [];
    let seen = new Set();

    // Step 1: Validation + duplicates
    for (let entry of data) {
        let clean = entry.trim();

        if (!/^[A-Z]->[A-Z]$/.test(clean) || clean[0] === clean[3]) {
            invalid_entries.push(entry);
            continue;
        }

        if (seen.has(clean)) {
            if (!duplicate_edges.includes(clean)) {
                duplicate_edges.push(clean);
            }
        } else {
            seen.add(clean);
            validEdges.push(clean);
        }
    }

    // Step 2: Build graph
    let graph = {};
    let childSet = new Set();

    for (let edge of validEdges) {
        let [parent, child] = edge.split("->");

        if (!graph[parent]) graph[parent] = [];
        graph[parent].push(child);
        childSet.add(child);
    }

    // Step 3: Find roots
    let roots = Object.keys(graph).filter(node => !childSet.has(node));

    // If no roots (pure cycle), pick smallest node
    if (roots.length === 0 && validEdges.length > 0) {
        let nodes = new Set();
        validEdges.forEach(e => {
            let [p, c] = e.split("->");
            nodes.add(p);
            nodes.add(c);
        });
        roots = [Array.from(nodes).sort()[0]];
    }

    // DFS for tree + cycle detection
    function dfs(node, visited) {
        if (visited.has(node)) return null;

        visited.add(node);
        let subtree = {};
        let maxDepth = 1;

        if (graph[node]) {
            for (let child of graph[node]) {
                let result = dfs(child, new Set(visited));
                if (!result) return null;

                subtree[child] = result.tree;
                maxDepth = Math.max(maxDepth, result.depth + 1);
            }
        }

        return { tree: subtree, depth: maxDepth };
    }

    let hierarchies = [];
    let total_cycles = 0;
    let largest_tree_root = "";
    let maxDepth = 0;

    for (let root of roots) {
        let result = dfs(root, new Set());

        if (!result) {
            hierarchies.push({
                root: root,
                tree: {},
                has_cycle: true
            });
            total_cycles++;
        } else {
            hierarchies.push({
                root: root,
                tree: { [root]: result.tree },
                depth: result.depth
            });

            if (
                result.depth > maxDepth ||
                (result.depth === maxDepth && root < largest_tree_root)
            ) {
                maxDepth = result.depth;
                largest_tree_root = root;
            }
        }
    }

    // Response
    res.json({
        user_id: "vishnu_15122005", // CHANGE THIS
        email_id: "vishnu15122005@email.com",   // CHANGE THIS
        college_roll_number: "RA2311003050072", // CHANGE THIS
        hierarchies: hierarchies,
        invalid_entries: invalid_entries,
        duplicate_edges: duplicate_edges,
        summary: {
            total_trees: hierarchies.filter(h => !h.has_cycle).length,
            total_cycles: total_cycles,
            largest_tree_root: largest_tree_root
        }
    });
});

// PORT fix for Railway
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});