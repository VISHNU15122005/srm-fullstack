const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Root route (prevents Railway error)
app.get("/", (req, res) => {
    res.send("API is running 🚀");
});

// POST /bfhl
app.post("/bfhl", (req, res) => {
    try {
        const data = req.body?.data || [];

        let validEdges = [];
        let invalid_entries = [];
        let duplicate_edges = [];
        let seen = new Set();

        // Step 1: Validation + duplicates
        for (let entry of data) {
            if (!entry || typeof entry !== "string") {
                invalid_entries.push(entry);
                continue;
            }

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
            let [p, c] = edge.split("->");

            if (!graph[p]) graph[p] = [];
            graph[p].push(c);
            childSet.add(c);
        }

        // Step 3: Find roots
        let roots = Object.keys(graph).filter(n => !childSet.has(n));

        // Handle pure cycle case
        if (roots.length === 0 && validEdges.length > 0) {
            let nodes = new Set();
            validEdges.forEach(e => {
                let [p, c] = e.split("->");
                nodes.add(p);
                nodes.add(c);
            });
            roots = [Array.from(nodes).sort()[0]];
        }

        // DFS for tree + cycle
        function dfs(node, visited) {
            if (visited.has(node)) return null;

            visited.add(node);
            let subtree = {};
            let depth = 1;

            if (graph[node]) {
                for (let child of graph[node]) {
                    let result = dfs(child, new Set(visited));
                    if (!result) return null;

                    subtree[child] = result.tree;
                    depth = Math.max(depth, result.depth + 1);
                }
            }

            return { tree: subtree, depth };
        }

        let hierarchies = [];
        let total_cycles = 0;
        let largest_tree_root = "";
        let maxDepth = 0;

        for (let root of roots) {
            let result = dfs(root, new Set());

            if (!result) {
                hierarchies.push({
                    root,
                    tree: {},
                    has_cycle: true
                });
                total_cycles++;
            } else {
                hierarchies.push({
                    root,
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

        // Final response
        res.json({
            user_id: "vishnu_15122005", // 🔁 CHANGE THIS
            email_id: "vishnu15122005@email.com",   // 🔁 CHANGE THIS
            college_roll_number: "RA2311003050072", // 🔁 CHANGE THIS
            hierarchies,
            invalid_entries,
            duplicate_edges,
            summary: {
                total_trees: hierarchies.filter(h => !h.has_cycle).length,
                total_cycles,
                largest_tree_root
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Railway-compatible PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});