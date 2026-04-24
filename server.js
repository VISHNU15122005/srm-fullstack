const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/bfhl", (req, res) => {
    const data = req.body.data || [];

    let validEdges = [];
    let invalid = [];
    let duplicates = [];
    let seen = new Set();

    for (let entry of data) {
        let clean = entry.trim();

        if (!/^[A-Z]->[A-Z]$/.test(clean) || clean[0] === clean[3]) {
            invalid.push(entry);
            continue;
        }

        if (seen.has(clean)) {
            if (!duplicates.includes(clean)) {
                duplicates.push(clean);
            }
        } else {
            seen.add(clean);
            validEdges.push(clean);
        }
    }

    let graph = {};
    let children = new Set();

    for (let edge of validEdges) {
        let [p, c] = edge.split("->");

        if (!graph[p]) graph[p] = [];
        graph[p].push(c);
        children.add(c);
    }

    let roots = Object.keys(graph).filter(n => !children.has(n));

    function dfs(node, visited) {
        if (visited.has(node)) return null;

        visited.add(node);
        let tree = {};
        let maxDepth = 1;

        if (graph[node]) {
            for (let child of graph[node]) {
                let result = dfs(child, new Set(visited));
                if (!result) return null;

                tree[child] = result.tree;
                maxDepth = Math.max(maxDepth, result.depth + 1);
            }
        }

        return { tree, depth: maxDepth };
    }

    let hierarchies = [];
    let totalCycles = 0;
    let maxDepth = 0;
    let largestRoot = "";

    for (let root of roots) {
        let result = dfs(root, new Set());

        if (!result) {
            hierarchies.push({ root, tree: {}, has_cycle: true });
            totalCycles++;
        } else {
            hierarchies.push({
                root,
                tree: { [root]: result.tree },
                depth: result.depth
            });

            if (result.depth > maxDepth) {
                maxDepth = result.depth;
                largestRoot = root;
            }
        }
    }

    res.json({
        user_id: "Vishnu_15122005",
        email_id: "vishnu15122005@email.com",
        college_roll_number: "RA2311003050072",
        hierarchies,
        invalid_entries: invalid,
        duplicate_edges: duplicates,
        summary: {
            total_trees: hierarchies.filter(h => !h.has_cycle).length,
            total_cycles: totalCycles,
            largest_tree_root: largestRoot
        }
    });
});

app.listen(3000, () => console.log("Server running on port 3000"));