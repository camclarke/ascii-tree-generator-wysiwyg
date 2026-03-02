export const generateId = () => Math.random().toString(36).substr(2, 9);

export const createNode = (value = "") => ({
  id: generateId(),
  value,
  children: []
});

export const updateNodeMap = (nodes, id, updateFn) => {
  return nodes.map(node => {
    if (node.id === id) {
      return updateFn(node);
    }
    if (node.children && node.children.length > 0) {
      return { ...node, children: updateNodeMap(node.children, id, updateFn) };
    }
    return node;
  });
};

export const addChildToNode = (nodes, parentId, newValue = "") => {
  let addedNodeId = null;
  let rejected = false;

  const newNodes = updateNodeMap(nodes, parentId, (node) => {
    // Prevent adding a new child if the last child is empty
    if (node.children.length > 0 && node.children[node.children.length - 1].value.trim() === "") {
      rejected = true;
      addedNodeId = node.children[node.children.length - 1].id; // Just focus the existing empty child
      return node;
    }

    const newNode = createNode(newValue);
    addedNodeId = newNode.id;
    return {
      ...node,
      children: [...node.children, newNode]
    };
  });

  return { newNodes, addedNodeId, rejected };
};

export const addSiblingAfter = (nodes, targetId, newValue = "") => {
  let addedNodeId = null;
  let rejected = false;

  const traverse = (currentNodes, depth = 0) => {
    const index = currentNodes.findIndex(n => n.id === targetId);
    if (index !== -1) {
      if (depth === 0) {
        // Prevent adding siblings at the absolute root level
        rejected = true;
        addedNodeId = targetId;
        return currentNodes;
      }

      // Prevent adding if the *next* sibling is already empty
      if (index + 1 < currentNodes.length && currentNodes[index + 1].value.trim() === "") {
        rejected = true;
        addedNodeId = currentNodes[index + 1].id; // Focus the existing empty sibling
        return currentNodes;
      }

      const newNode = createNode(newValue);
      addedNodeId = newNode.id;
      const copy = [...currentNodes];
      copy.splice(index + 1, 0, newNode);
      return copy;
    }
    return currentNodes.map(node => {
      if (node.children.length > 0) {
        return { ...node, children: traverse(node.children, depth + 1) };
      }
      return node;
    });
  };
  const newNodes = traverse(nodes);
  return { newNodes, addedNodeId, rejected };
};

export const indentNode = (nodes, targetId) => {
  let targetNode = null;
  let previousSibling = null;

  // Find the target node and its previous sibling, and remove target from parent
  const traverse = (currentNodes) => {
    const targetIndex = currentNodes.findIndex(n => n.id === targetId);
    if (targetIndex > 0) {
      // Must not be the first child to be indented
      targetNode = currentNodes[targetIndex];
      previousSibling = currentNodes[targetIndex - 1];

      return currentNodes.filter(n => n.id !== targetId);
    } else if (targetIndex === 0) {
      // It's the first child, cannot indent it (no previous sibling to attach to)
      return currentNodes;
    }

    return currentNodes.map(node => {
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: traverse(node.children)
        };
      }
      return node;
    });
  };

  let tempNodes = traverse(nodes);

  if (!targetNode || !previousSibling) return nodes;

  // Now insert the target node as the last child of the previousSibling
  const insertIntoSibling = (currentNodes) => {
    return currentNodes.map(node => {
      if (node.id === previousSibling.id) {
        return {
          ...node,
          children: [...node.children, targetNode]
        };
      }
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: insertIntoSibling(node.children)
        };
      }
      return node;
    });
  };

  return insertIntoSibling(tempNodes);
};

export const outdentNode = (nodes, targetId) => {
  let targetNode = null;
  let finalNodes = [...nodes];

  // 1. Find the target node and remove it from its current parent
  const removeFromParent = (currentNodes, depth = 0) => {
    return currentNodes.map(node => {
      if (node.children.some(child => child.id === targetId)) {
        // Found the immediate parent!
        if (depth === 0) return node; // Already at root children level, can't outdent further in this setup

        const childIndex = node.children.findIndex(c => c.id === targetId);
        targetNode = node.children[childIndex];

        return {
          ...node,
          children: node.children.filter(c => c.id !== targetId)
        };
      }

      if (node.children.length > 0) {
        return {
          ...node,
          children: removeFromParent(node.children, depth + 1)
        };
      }
      return node;
    });
  };

  finalNodes = removeFromParent(finalNodes);

  if (!targetNode) return nodes; // Node not found or cannot be outdented

  // 2. Insert the target node *after* its former parent
  const insertAfterParent = (currentNodes) => {
    let inserted = false;
    const result = [];

    for (const node of currentNodes) {
      if (node.children && node.children.some(child => child.id === targetId)) {
        // This condition is for the rare case we didn't remove it properly, shouldn't hit.
        result.push(node);
      } else {
        // Check if this node WAS the parent (by looking at the old tree structure via a hack, or simpler: 
        // we need to know the parent ID.)

        // Better approach: We need the parent's ID to insert after it.
      }
    }
  };

  // Let's rewrite this to simply find the parent's parent, and insert the target node into it, right after the parent.
  let parentId = null;
  let grandparentId = null;

  const findAncestors = (currentNodes, currentParentId = null, currentGrandparentId = null) => {
    for (const node of currentNodes) {
      if (node.id === targetId) {
        parentId = currentParentId;
        grandparentId = currentGrandparentId;
        return true;
      }
      if (node.children.length > 0) {
        if (findAncestors(node.children, node.id, currentParentId)) {
          return true;
        }
      }
    }
    return false;
  };

  findAncestors(nodes);

  if (!parentId || !grandparentId) return nodes; // Cannot outdent root, or children of root

  // Get the target node object
  const getTarget = (currentNodes) => {
    for (const node of currentNodes) {
      if (node.id === targetId) return node;
      if (node.children.length > 0) {
        const res = getTarget(node.children);
        if (res) return res;
      }
    }
    return null;
  };

  const nodeToMove = getTarget(nodes);

  // Re-build tree: remove from parent, add to grandparent (or root)
  const rebuild = (currentNodes, isRootLevel = true) => {
    let result = [];

    for (const node of currentNodes) {
      if (node.id === targetId) {
        continue; // Skip the target node (removing it)
      }

      let newNode = { ...node };

      if (node.children.length > 0) {
        newNode.children = rebuild(node.children, false);
      }

      result.push(newNode);

      // If this node is the formal parent, insert the target node right after it!
      if (node.id === parentId) {
        result.push(nodeToMove);
      }
    }
    return result;
  };

  return rebuild(nodes);
};

export const deleteNode = (nodes, targetId) => {
  const traverse = (currentNodes) => {
    const filtered = currentNodes.filter(n => n.id !== targetId);
    if (filtered.length !== currentNodes.length) {
      return filtered;
    }
    return currentNodes.map(node => {
      if (node.children.length > 0) {
        return { ...node, children: traverse(node.children) };
      }
      return node;
    });
  };
  return traverse(nodes);
};

export const updateNodeValue = (nodes, id, value) => {
  return updateNodeMap(nodes, id, (node) => ({ ...node, value }));
};

// Generates the raw plaintext ASCII version
export const generateAsciiText = (nodes) => {
  let lines = [];

  const traverse = (items, prefix = "", isRootLevel = false) => {
    items.forEach((item, index) => {
      if (isRootLevel) {
        lines.push(item.value);
        if (item.children && item.children.length > 0) {
          traverse(item.children, "", false);
        }
      } else {
        const isLast = index === items.length - 1;
        const branchChar = isLast ? "└── " : "├── ";
        lines.push(`${prefix}${branchChar}${item.value}`);

        if (item.children && item.children.length > 0) {
          const childPrefix = prefix + (isLast ? "    " : "│   ");
          traverse(item.children, childPrefix, false);
        }
      }
    });
  };

  traverse(nodes, "", true);
  return lines.join("\n");
};
