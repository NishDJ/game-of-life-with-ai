// FIX 3: Optimized performance - O(n) complexity with async operations
async function processLargeDataset(data) {
    if (!Array.isArray(data)) {
        throw new TypeError('Data must be an array');
    }
    
    const result = [];
    const seenIds = new Set(); // O(1) lookup instead of O(n)
    
    // Process items in parallel batches for better performance
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const promises = batch.map(async (item) => {
            if (!item || typeof item.id === 'undefined') {
                console.warn('Skipping invalid item:', item);
                return null;
            }
            
            if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                return await expensiveTransformationAsync(item);
            }
            return null;
        });
        
        const batchResults = await Promise.all(promises);
        result.push(...batchResults.filter(item => item !== null));
    }
    
    return result;
}

// Asynchronous version of expensive transformation
async function expensiveTransformationAsync(item) {
    // Non-blocking async operation
    await new Promise(resolve => setImmediate(resolve));
    
    // Simulate async processing
    await simulateAsyncWork(10);
    
    return {
        ...item,
        processed: true,
        timestamp: new Date().toISOString(),
        processingVersion: '2.0'
    };
}

// Helper function for async delay
function simulateAsyncWork(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// FIX: Create a copy instead of modifying original array
function sortData(data) {
    if (!Array.isArray(data)) {
        throw new TypeError('Data must be an array');
    }
    
    // Create a shallow copy to avoid mutation
    const dataCopy = [...data];
    return dataCopy.sort((a, b) => {
        // Safe comparison with null checks
        const aId = a?.id ?? 0;
        const bId = b?.id ?? 0;
        return aId - bId;
    });
}

// FIX: Add input validation
function filterData(data, condition) {
    if (!Array.isArray(data)) {
        throw new TypeError('Data must be an array');
    }
    
    if (typeof condition !== 'function') {
        throw new TypeError('Condition must be a function');
    }
    
    try {
        return data.filter(condition);
    } catch (error) {
        console.error('Error in filter condition:', error);
        throw new Error('Failed to filter data: ' + error.message);
    }
}

// New utility function for data validation
function validateDataItem(item) {
    if (!item || typeof item !== 'object') {
        return false;
    }
    
    if (typeof item.id === 'undefined') {
        return false;
    }
    
    return true;
}

// New function for batch processing with progress callback
async function processDataWithProgress(data, onProgress) {
    if (!Array.isArray(data)) {
        throw new TypeError('Data must be an array');
    }
    
    const totalItems = data.length;
    const result = [];
    const seenIds = new Set();
    const batchSize = 50;
    
    for (let i = 0; i < totalItems; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const batchResults = [];
        
        for (const item of batch) {
            if (validateDataItem(item) && !seenIds.has(item.id)) {
                seenIds.add(item.id);
                const processed = await expensiveTransformationAsync(item);
                batchResults.push(processed);
            }
        }
        
        result.push(...batchResults);
        
        // Report progress
        if (typeof onProgress === 'function') {
            const progress = Math.min(100, Math.round((i + batchSize) / totalItems * 100));
            onProgress(progress, result.length);
        }
    }
    
    return result;
}

// Export all functions
module.exports = {
    processLargeDataset,
    sortData,
    filterData,
    validateDataItem,
    processDataWithProgress
};