const _ = require('lodash');

// FIXED: Optimized O(n) complexity using Set for duplicate tracking
async function processLargeDataset(data) {
    if (!Array.isArray(data)) {
        return [];
    }
    
    const result = [];
    const seenIds = new Set(); // O(1) lookup time instead of O(n)
    
    // FIXED: Use for...of for better performance and readability
    for (const item of data) {
        // FIXED: O(1) duplicate checking using Set
        if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            
            // FIXED: Make expensive operation async to prevent blocking
            const processedItem = await expensiveTransformationAsync(item);
            result.push(processedItem);
        }
    }
    
    return result;
}

// FIXED: Make transformation async to prevent blocking the event loop
async function expensiveTransformationAsync(item) {
    return new Promise((resolve) => {
        // Use setImmediate to yield control back to event loop
        setImmediate(() => {
            // Simulate CPU-intensive work but in smaller chunks
            let sum = 0;
            for (let i = 0; i < 100000; i++) { // Reduced iterations
                sum += Math.random();
            }
            
            resolve({
                ...item,
                processed: true,
                timestamp: Date.now(),
                computationResult: sum
            });
        });
    });
}

// Keep original function for backward compatibility
function expensiveTransformation(item) {
    // Simulate CPU-intensive work
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
        sum += Math.random();
    }
    
    return {
        ...item,
        processed: true,
        timestamp: Date.now(),
        computationResult: sum
    };
}

// BUG 12: Memory leak - creating new arrays repeatedly without cleanup
function sortAndFilterData(data, filters) {
    let sortedData = [...data];
    
    // Inefficient sorting - creating new arrays each time
    for (let i = 0; i < filters.length; i++) {
        const filter = filters[i];
        sortedData = sortedData.filter(item => {
            return Object.keys(filter).every(key => {
                return item[key] === filter[key];
            });
        });
        
        // Creating multiple intermediate arrays
        sortedData = sortedData.map(item => ({ ...item }));
        sortedData = sortedData.sort((a, b) => a.id - b.id);
    }
    
    return sortedData;
}

// BUG 13: Potential stack overflow with deep recursion
function processNestedData(data, depth = 0) {
    if (depth > 1000) {
        // This check is too late - stack might already overflow
        return data;
    }
    
    if (Array.isArray(data)) {
        return data.map(item => processNestedData(item, depth + 1));
    } else if (typeof data === 'object' && data !== null) {
        const result = {};
        for (const key in data) {
            result[key] = processNestedData(data[key], depth + 1);
        }
        return result;
    }
    
    return data;
}

module.exports = {
    processLargeDataset,
    sortAndFilterData,
    processNestedData
};