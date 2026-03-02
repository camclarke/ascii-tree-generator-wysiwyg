import React, { useRef, useEffect } from 'react';

const AsciiNode = ({
    node,
    prefix,
    isLast,
    isRootLevel,
    onUpdate,
    onKeyDown,
    focusedId
}) => {
    const inputRef = useRef(null);

    useEffect(() => {
        if (focusedId === node.id && inputRef.current) {
            inputRef.current.focus();
        }
    }, [focusedId, node.id]);

    const handleChange = (e) => {
        onUpdate(node.id, e.target.value);
    };

    const handleKeyDownLocal = (e) => {
        onKeyDown(e, node.id, e.target.value);
    };

    const branchChar = isRootLevel ? "" : (isLast ? "└── " : "├── ");

    return (
        <div className="tree-row">
            <span>{prefix}{branchChar}</span>
            <input
                ref={inputRef}
                className="tree-input"
                value={node.value}
                onChange={handleChange}
                onKeyDown={handleKeyDownLocal}
                placeholder=""
                spellCheck={false}
            />
        </div>
    );
};

export const AsciiTree = ({ nodes, onUpdate, onKeyDown, focusedId, prefix = "", isRootLevel = true }) => {
    return (
        <>
            {nodes.map((node, index) => {
                const isLast = index === nodes.length - 1;
                const nextPrefix = isRootLevel ? "" : prefix + (isLast ? "    " : "│   ");

                return (
                    <React.Fragment key={node.id}>
                        <AsciiNode
                            node={node}
                            prefix={prefix}
                            isLast={isLast}
                            isRootLevel={isRootLevel}
                            onUpdate={onUpdate}
                            onKeyDown={onKeyDown}
                            focusedId={focusedId}
                        />
                        {node.children && node.children.length > 0 && (
                            <AsciiTree
                                nodes={node.children}
                                onUpdate={onUpdate}
                                onKeyDown={onKeyDown}
                                focusedId={focusedId}
                                prefix={nextPrefix}
                                isRootLevel={false}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </>
    );
};
