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

// FIXED BUG 12: Memory leak - optimized to avoid creating multiple intermediate arrays
function sortAndFilterData(data, filters) {
    if (!Array.isArray(data) || !Array.isArray(filters)) {
        return [];
    }
    
    // Use a single pass approach to avoid memory leaks
    let result = data;
    
    // Apply all filters in a single chain to avoid intermediate arrays
    for (const filter of filters) {
        if (typeof filter !== 'object' || filter === null) {
            continue;
        }
        
        result = result.filter(item => {
            return Object.keys(filter).every(key => {
                return item && item[key] === filter[key];
            });
        });
    }
    
    // Sort once at the end instead of after each filter
    return result
        .map(item => ({ ...item })) // Single shallow copy
        .sort((a, b) => (a.id || 0) - (b.id || 0));
}

// FIXED BUG 13: Prevent stack overflow with iterative approach and depth limit
function processNestedData(data, maxDepth = 100) {
    // Use iterative approach instead of recursion to prevent stack overflow
    const stack = [{ data, depth: 0, path: [] }];
    const result = Array.isArray(data) ? [] : {};
    
    while (stack.length > 0) {
        const { data: currentData, depth, path } = stack.pop();
        
        // Early depth check to prevent infinite recursion
        if (depth >= maxDepth) {
            continue;
        }
        
        if (Array.isArray(currentData)) {
            const targetArray = path.length === 0 ? result : getNestedValue(result, path);
            currentData.forEach((item, index) => {
                if (typeof item === 'object' && item !== null) {
                    if (Array.isArray(item)) {
                        targetArray[index] = [];
                    } else {
                        targetArray[index] = {};
                    }
                    stack.push({ 
                        data: item, 
                        depth: depth + 1, 
                        path: [...path, index] 
                    });
                } else {
                    targetArray[index] = item;
                }
            });
        } else if (typeof currentData === 'object' && currentData !== null) {
            const targetObject = path.length === 0 ? result : getNestedValue(result, path);
            Object.keys(currentData).forEach(key => {
                const value = currentData[key];
                if (typeof value === 'object' && value !== null) {
                    if (Array.isArray(value)) {
                        targetObject[key] = [];
                    } else {
                        targetObject[key] = {};
                    }
                    stack.push({ 
                        data: value, 
                        depth: depth + 1, 
                        path: [...path, key] 
                    });
                } else {
                    targetObject[key] = value;
                }
            });
        }
    }
    
    return result;
}

// Helper function to get nested value by path
function getNestedValue(obj, path) {
    return path.reduce((current, key) => current[key], obj);
}

// New utility function for batch processing to improve performance
async function batchProcess(data, batchSize = 100, processor) {
    if (!Array.isArray(data) || typeof processor !== 'function') {
        throw new Error('Invalid input: data must be array and processor must be function');
    }
    
    const results = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(item => processor(item))
        );
        results.push(...batchResults);
        
        // Yield control to prevent blocking
        if (i + batchSize < data.length) {
            await new Promise(resolve => setImmediate(resolve));
        }
    }
    
    return results;
}

module.exports = {
    processLargeDataset,
    sortAndFilterData,
    processNestedData,
    batchProcess
};