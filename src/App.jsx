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
import './index.css';

function App() {
  const [nodes, setNodes] = useState([createNode("Project Root")]);
  const [focusedId, setFocusedId] = useState(nodes[0].id);

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
      setNodes(prev => {
        // If we press Enter on the absolute root, treat it as appending a child
        if (prev.length === 1 && prev[0].id === id) {
          const { newNodes, addedNodeId, rejected } = addChildToNode(prev, id);
          if (addedNodeId) setFocusedId(addedNodeId);
          return rejected ? prev : newNodes;
        }

        const { newNodes, addedNodeId, rejected } = addSiblingAfter(prev, id);
        if (addedNodeId) setFocusedId(addedNodeId);
        return rejected ? prev : newNodes;
      });
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

  return (
    <div>
      <h1>ASCII Tree Generator</h1>
      <p>
        Press <b>Tab</b> to add a child node | <b>Enter</b> to add a sibling node | <b>Backspace</b> on an empty node to delete it
      </p>

      <div>
        <button onClick={handleReset}>Reset</button>&nbsp;
        <button onClick={handleCopy}>Copy to Clipboard</button>
      </div>

      <div className="tree-container">
        <AsciiTree
          nodes={nodes}
          onUpdate={handleUpdate}
          onKeyDown={handleKeyDown}
          focusedId={focusedId}
        />
      </div>
    </div>
  );
}

export default App;
