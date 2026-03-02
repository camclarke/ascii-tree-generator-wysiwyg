export const saveTreeToHistory = (name, nodes) => {
    try {
        const history = getTreeHistory();
        const newEntry = {
            id: Date.now().toString(),
            name: name || `Tree ${history.length + 1}`,
            date: new Date().toISOString(),
            nodes: nodes
        };

        const updatedHistory = [newEntry, ...history];
        localStorage.setItem('asciiTreeHistory', JSON.stringify(updatedHistory));
        return updatedHistory;
    } catch (error) {
        console.error("Failed to save tree to history:", error);
        return [];
    }
};

export const getTreeHistory = () => {
    try {
        const stored = localStorage.getItem('asciiTreeHistory');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error("Failed to parse tree history:", error);
    }
    return [];
};

export const deleteTreeFromHistory = (id) => {
    try {
        const history = getTreeHistory();
        const updatedHistory = history.filter(entry => entry.id !== id);
        localStorage.setItem('asciiTreeHistory', JSON.stringify(updatedHistory));
        return updatedHistory;
    } catch (error) {
        console.error("Failed to delete tree from history:", error);
        return [];
    }
};
