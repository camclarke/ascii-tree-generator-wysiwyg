import React, { useState, useCallback } from 'react';
import { AsciiTree } from './components/AsciiTree';
import {
  createNode,
  addChildToNode,
  addSiblingAfter,
  deleteNode,
  updateNodeValue,
  generateAsciiText,
  outdentNode,
  indentNode
} from './utils/treeUtils';
import {
  saveTreeToHistory,
  getTreeHistory,
  deleteTreeFromHistory
} from './utils/historyUtils';
import './index.css';

function App() {
  const [nodes, setNodes] = useState([createNode("Project Root")]);
  const [focusedId, setFocusedId] = useState(nodes[0].id);
  const [savedTrees, setSavedTrees] = useState([]);

  // Load history on mount
  React.useEffect(() => {
    setSavedTrees(getTreeHistory());
  }, []);

  const handleUpdate = useCallback((id, value) => {
    setNodes(prev => updateNodeValue(prev, id, value));
  }, []);

  const handleKeyDown = useCallback((e, id, currentValue) => {
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      setNodes(prev => outdentNode(prev, id));
      setFocusedId(id);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Tab now indents the current node
      setNodes(prev => indentNode(prev, id));
      setFocusedId(id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!currentValue.trim()) return;

      let nextFocusedId = null;
      setNodes(prev => {
        if (prev.length === 1 && prev[0].id === id) {
          const { newNodes, addedNodeId, rejected } = addChildToNode(prev, id);
          nextFocusedId = addedNodeId;
          return rejected ? prev : newNodes;
        }

        const { newNodes, addedNodeId, rejected } = addSiblingAfter(prev, id);
        nextFocusedId = addedNodeId;
        return rejected ? prev : newNodes;
      });
      // Defer the focus update slightly to ensure DOM is ready, though React handles this usually.
      // The main issue was likely event bubbling or React batching.
      // By using setTimeout, we guarantee the state update for nodes has committed before we force focus.
      setTimeout(() => {
        if (nextFocusedId) setFocusedId(nextFocusedId);
      }, 0);

    } else if (e.key === 'Backspace' && currentValue === "") {
      e.preventDefault();
      setNodes(prev => {
        if (prev.length === 1 && prev[0].id === id && prev[0].children.length === 0) {
          return prev;
        }
        return deleteNode(prev, id);
      });
      setFocusedId(null);
    }
  }, []);

  const handleCopy = () => {
    const text = generateAsciiText(nodes);
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleReset = () => {
    const newRoot = createNode("Project Root");
    setNodes([newRoot]);
    setFocusedId(newRoot.id);
  };

  const handleSaveTree = () => {
    const name = prompt("Enter a name for this tree:", "My Tree");
    if (name) {
      const newHistory = saveTreeToHistory(name, nodes);
      setSavedTrees(newHistory);
    }
  };

  const handleLoadTree = (treeData) => {
    if (confirm(`Load "${treeData.name}"? Current unsaved changes will be lost.`)) {
      setNodes(treeData.nodes);
      setFocusedId(null);
    }
  };

  const handleDeleteTree = (e, id) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this saved tree?")) {
      const newHistory = deleteTreeFromHistory(id);
      setSavedTrees(newHistory);
    }
  };

  return (
    <div className="app-layout">
      <main className="main-content">
        <h1>ASCII Tree Generator</h1>
        <p>
          Press <b>Tab</b> to indent | <b>Shift+Tab</b> to outdent | <b>Enter</b> to add a sibling | <b>Backspace</b> on an empty node to delete it
        </p>

        <div className="toolbar">
          <button onClick={handleReset}>Reset</button>
          <button onClick={handleCopy}>Copy to Clipboard</button>
          <button onClick={handleSaveTree}>Save to History</button>
        </div>

        <div className="tree-container">
          <AsciiTree
            nodes={nodes}
            onUpdate={handleUpdate}
            onKeyDown={handleKeyDown}
            focusedId={focusedId}
          />
        </div>
      </main>

      <aside className="sidebar">
        <h2>Saved Trees</h2>
        {savedTrees.length === 0 ? (
          <p style={{ color: '#666', fontSize: '0.9rem' }}>No history yet. Save a tree to see it here.</p>
        ) : (
          <ul className="history-list">
            {savedTrees.map(tree => (
              <li key={tree.id} className="history-item" onClick={() => handleLoadTree(tree)}>
                <div className="history-details">
                  <span className="history-name">{tree.name}</span>
                  <span className="history-date">{new Date(tree.date).toLocaleDateString()} {new Date(tree.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="history-actions">
                  <button className="btn-small" onClick={(e) => handleDeleteTree(e, tree.id)}>x</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

export default App;
